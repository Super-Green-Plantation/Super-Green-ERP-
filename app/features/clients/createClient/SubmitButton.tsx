"use client";

import { defaultValues, useFormContext } from "@/app/context/FormContext";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { saveClient } from "../actions";
import { createInvestmentForExistingClient } from "@/app/features/investments/actions";
import { createClient } from "@/lib/supabase/client";
import { LockedClient } from "@/app/types/client";

const BUCKET = "kyc-documents";

type DbUser = { id: string; email: string; role: string; branchId?: number };
export type PendingFilesRef = React.MutableRefObject<Record<string, File | null>>;

const uploadToSupabase = async (key: string, file: File): Promise<string> => {
  const supabase = createClient();
  const ext = file.name.split(".").pop();
  const path = `${key}/${Date.now()}-${crypto.randomUUID()}.${ext}`;

  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
    contentType: file.type,
  });

  if (error) throw new Error(`Upload failed for ${key}: ${error.message}`);
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
};

// ─────────────────────────────────────────────────────────────────────────────

export const SubmitButton = ({
  pendingFilesRef,
  lockedClient,
  onResetComplete,
}: {
  pendingFilesRef: PendingFilesRef;
  lockedClient: LockedClient | null;
  onResetComplete: () => void;
}) => {
  const { form } = useFormContext();
  const [loading, setLoading] = useState(false);
  const [dbUser, setDbUser] = useState<DbUser | null>(null);
  const { reset } = form;

  useEffect(() => {
    fetch("/api/me")
      .then((r) => r.json())
      .then(({ dbUser }) => setDbUser(dbUser));
  }, []);

  // ── PATH A: existing client — only create the investment ─────────────────
  const handleExistingClientSubmit = async () => {
    // Validate only investment-relevant fields
    const isValid = await form.trigger([
      "applicant.investmentAmount",
      "applicant.proposalFormNo",
      "applicant.investmentDate",
      "investment.planId",
      "beneficiary",
      "nominee",
    ]);

    if (!isValid) {
      const errs = form.formState.errors;
      const first =
        (errs.applicant as any)?.investmentAmount?.message ||
        (errs.applicant as any)?.proposalFormNo?.message ||
        "Please fix the errors in the form.";
      toast.error(first);
      return;
    }

    setLoading(true);
    try {
      const data = form.getValues();
      const beneficiary = data.beneficiary;
      const nominee = data.nominee;

      // Resolve beneficiary: existing id (unchanged) or new record
      const existingBeneficiaryId: number | undefined =
        (beneficiary as any)?._existingId;
      const newBeneficiary =
        !existingBeneficiaryId && beneficiary?.fullName?.trim()
          ? {
              fullName: beneficiary.fullName,
              nic: beneficiary.nic || undefined,
              phone: beneficiary.phone || "",
              bankName: beneficiary.bankName || "",
              bankBranch: beneficiary.bankBranch || "",
              accountNo: beneficiary.accountNo || "",
              relationship: beneficiary.relationship || "",
            }
          : null;

      // Resolve nominee: existing id (unchanged) or new record
      const existingNomineeId: number | undefined =
        (nominee as any)?._existingId;
      const newNominee =
        !existingNomineeId && nominee?.fullName?.trim()
          ? {
              fullName: nominee.fullName,
              nic: nominee.nic || undefined,
              permanentAddress: nominee.permanentAddress || "",
              postalAddress: nominee.postalAddress || undefined,
            }
          : null;

      const res = await createInvestmentForExistingClient({
        clientId: lockedClient!.id,
        branchId: lockedClient!.branchId,
        planId: data.investment?.planId ? Number(data.investment.planId) : undefined,
        amount: Number(data.applicant.investmentAmount),
        proposal: data.applicant.proposal ,
        investmentDate: data.applicant.investmentDate
          ? new Date(data.applicant.investmentDate)
          : new Date(),
        investmentRates: data.investment?.investmentRates ?? [],
        beneficiaryId: existingBeneficiaryId ?? null,
        nomineeId: existingNomineeId ?? null,
        newBeneficiary,
        newNominee,
      });

      if (!res.success) {
        if ((res as any).fieldErrors) {
          Object.entries((res as any).fieldErrors).forEach(([field, msgs]) => {
            const msg = Array.isArray(msgs) ? msgs[0] : msgs;
            toast.error(`${field}: ${msg}`);
          });
        } else {
          toast.error((res as any).error || "Something went wrong.");
        }
        return;
      }

      toast.success("Investment created successfully!");
      reset(defaultValues);
      onResetComplete();
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong, please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ── PATH B: new client — full saveClient flow ────────────────────────────
  const handleNewClientSubmit = async () => {
    const isValid = await form.trigger();
    if (!isValid) {
      const errs = form.formState.errors;
      const first =
        (errs.applicant as any)?.fullName?.message ||
        (errs.applicant as any)?.address?.message ||
        (errs.applicant as any)?.branchId?.message ||
        (errs.applicant as any)?.investmentAmount?.message ||
        (errs.applicant as any)?.proposalFormNo?.message ||
        (errs.applicant as any)?.nic?.message ||
        (errs.applicant as any)?.email?.message ||
        (errs.applicant as any)?.phoneMobile?.message ||
        (errs.beneficiary as any)?.bankName?.message ||
        (errs.beneficiary as any)?.accountNo?.message ||
        (errs.nominee as any)?.permanentAddress?.message ||
        "Please fix the errors in the form before submitting.";
      toast.error(first);
      return;
    }

    setLoading(true);
    try {
      // Upload documents
      const pendingFiles = pendingFilesRef.current;
      const hasFiles = Object.values(pendingFiles).some(Boolean);

      if (hasFiles) {
        toast.loading("Uploading documents...", { id: "doc-upload" });
        const uploadResults = await Promise.all(
          Object.entries(pendingFiles).map(async ([key, file]) => {
            if (!file) return [key, null];
            const url = await uploadToSupabase(key, file);
            return [key, url];
          })
        );
        uploadResults.forEach(([key, url]) => {
          if (url) form.setValue(`applicant.${key}` as any, url, { shouldDirty: true });
        });
        toast.dismiss("doc-upload");
      }

      const data = form.getValues();
      const res = await saveClient(data, dbUser?.email);

      if (!res.success) {
        if ((res as any).fieldErrors) {
          Object.entries((res as any).fieldErrors).forEach(([field, msgs]) => {
            const msg = Array.isArray(msgs) ? msgs[0] : msgs;
            toast.error(`${field}: ${msg}`);
          });
        } else {
          toast.error((res as any).error || "Something went wrong, please try again.");
        }
        return;
      }

      toast.success("Client saved successfully!");
      reset(defaultValues);
      onResetComplete();
      pendingFilesRef.current = {};
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong, please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = () => {
    if (lockedClient) {
      handleExistingClientSubmit();
    } else {
      handleNewClientSubmit();
    }
  };

  const label = lockedClient ? "Confirm Investment" : "Register Client";

  return (
    <div className="w-full">
      <button
        onClick={handleSubmit}
        type="button"
        disabled={loading}
        className={`
          w-full py-5 px-6 rounded-[2rem] font-black uppercase tracking-[0.2em] text-xs transition-all duration-500
          flex items-center justify-center gap-4
          ${loading
            ? "bg-muted text-muted-foreground/30 cursor-not-allowed border border-border/50"
            : lockedClient
              ? "bg-accent text-accent-foreground hover:bg-accent/90 shadow-2xl shadow-accent/20 hover:shadow-accent/30 active:scale-95"
              : "bg-foreground text-background hover:bg-primary hover:text-white shadow-2xl shadow-black/10 hover:shadow-primary/30 active:scale-95"
          }
        `}
      >
        {loading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Processing…
          </>
        ) : (
          label
        )}
      </button>

      {!loading && (
        <div className="text-center text-[9px] text-muted-foreground/40 font-black uppercase tracking-[0.3em] mt-6 flex items-center justify-center gap-2">
          <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
          Secure End-to-End Encryption Active
        </div>
      )}
    </div>
  );
};