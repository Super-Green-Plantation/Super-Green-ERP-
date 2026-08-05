"use client";

import { defaultValues, useFormContext } from "@/app/context/FormContext";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { saveClient } from "../actions";
import { updateBeneficiary, updateNominee } from "@/app/features/clients/actions";
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
  beneficiaryPhotosRef,
  nomineePhotosRef,
  lockedClient,
  onResetComplete,
}: {
  pendingFilesRef: PendingFilesRef;
  beneficiaryPhotosRef: PendingFilesRef;
  nomineePhotosRef: PendingFilesRef;
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

  // ── Upload helper ─────────────────────────────────────────────────────────
  const uploadPhotos = async (
    filesRef: PendingFilesRef,
    keyPrefix: string
  ): Promise<Record<string, string | null>> => {
    const results: Record<string, string | null> = {};
    await Promise.all(
      Object.entries(filesRef.current).map(async ([key, file]) => {
        if (!file) return;
        results[key] = await uploadToSupabase(`${keyPrefix}/${key}`, file);
      })
    );
    return results;
  };

  // ── PATH A: existing client — only create the investment ─────────────────
  const handleExistingClientSubmit = async () => {
    setLoading(true);
    try {
      const data = form.getValues();
      const beneficiary = data.beneficiary;
      const nominee = data.nominee;

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
        proposal: data.applicant.proposalFormNo ?? "",
        investmentDate: data.applicant.investmentDate
          ? new Date(data.applicant.investmentDate)
          : new Date(),
        investmentRates: data.investment?.investmentRates ?? [],
        beneficiaryId: existingBeneficiaryId ?? null,
        nomineeId: existingNomineeId ?? null,
        newBeneficiary,
        newNominee,
        proposalFormNo: data.applicant.proposalFormNo ?? "",
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

      // ── Upload beneficiary photos ────────────────────────────────────────
      const finalBeneficiaryId = res.investment?.beneficiaryId;
      const finalNomineeId = res.investment?.nomineeId;

      const photoUploads: Promise<void>[] = [];

      if (finalBeneficiaryId && Object.values(beneficiaryPhotosRef.current).some(Boolean)) {
        photoUploads.push(
          uploadPhotos(beneficiaryPhotosRef, `beneficiary/${finalBeneficiaryId}`)
            .then((urls) => updateBeneficiary({ id: finalBeneficiaryId, ...urls }))
            .then(() => void 0)
        );
      }

      if (finalNomineeId && Object.values(nomineePhotosRef.current).some(Boolean)) {
        photoUploads.push(
          uploadPhotos(nomineePhotosRef, `nominee/${finalNomineeId}`)
            .then((urls) => updateNominee({ id: finalNomineeId, ...urls }))
            .then(() => void 0)
        );
      }

      if (photoUploads.length) {
        try {
          await Promise.all(photoUploads);
        } catch (err) {
          console.error("Photo upload error:", err);
          toast.warning("Investment created but some photos failed to upload.");
        }
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
      // ── Upload KYC documents ─────────────────────────────────────────────
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

      // ── Upload beneficiary / nominee photos after client is saved ────────
      // saveClient returns the created beneficiaryId / nomineeId
      const createdBeneficiaryId = (res as any).beneficiaryId;
      const createdNomineeId = (res as any).nomineeId;

      const photoUploads: Promise<void>[] = [];

      if (createdBeneficiaryId && Object.values(beneficiaryPhotosRef.current).some(Boolean)) {
        photoUploads.push(
          uploadPhotos(beneficiaryPhotosRef, `beneficiary/${createdBeneficiaryId}`)
            .then((urls) => updateBeneficiary({ id: createdBeneficiaryId, ...urls }))
            .then(() => void 0)
        );
      }

      if (createdNomineeId && Object.values(nomineePhotosRef.current).some(Boolean)) {
        photoUploads.push(
          uploadPhotos(nomineePhotosRef, `nominee/${createdNomineeId}`)
            .then((urls) => updateNominee({ id: createdNomineeId, ...urls }))
            .then(() => void 0)
        );
      }

      if (photoUploads.length) {
        try {
          await Promise.all(photoUploads);
        } catch (err) {
          console.error("Photo upload error:", err);
          toast.warning("Client saved but some photos failed to upload.");
        }
      }

      toast.success("Client saved successfully!");
      reset(defaultValues);
      onResetComplete();
      pendingFilesRef.current = {};
      beneficiaryPhotosRef.current = { bankBookPhotoUrl: null, idCopyUrl: null };
      nomineePhotosRef.current = { idCopyUrl: null };
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
    </div>
  );
};