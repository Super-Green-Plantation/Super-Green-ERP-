
"use client";

import { defaultValues, useFormContext } from "@/app/context/FormContext";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { saveClient } from "../actions";
import { createClient } from "@/lib/supabase/client";

const BUCKET = "kyc-documents";

type DbUser = {
  id: string;
  email: string;
  role: string;
  branchId?: number;
};

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

export const SubmitButton = ({
  pendingFilesRef,
  onResetComplete,
}: {
  pendingFilesRef: PendingFilesRef;
  onResetComplete: () => void;
}) => {
  const { form } = useFormContext();
  const [loading, setLoading] = useState(false);
  const [dbUser, setDbUser] = useState<DbUser | null>(null);
  const { reset } = form;

  useEffect(() => {
    fetch("/api/me")
      .then((res) => res.json())
      .then(({ dbUser }) => setDbUser(dbUser));
  }, []);

  const handleSubmit = async () => {
    // ── 1. Client-side validation via react-hook-form ──────────────────────
    const isValid = await form.trigger();
    if (!isValid) {
      const errs = form.formState.errors;
      // Collect first meaningful message
      const firstError =
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
      toast.error(firstError);
      return;
    }

    setLoading(true);
    try {
      // ── 2. Upload any pending files ────────────────────────────────────
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
          if (url) {
            form.setValue(`applicant.${key}` as any, url, { shouldDirty: true });
          }
        });

        toast.dismiss("doc-upload");
      }

      // ── 3. Submit ──────────────────────────────────────────────────────
      const data = form.getValues();
      const res = await saveClient(data, dbUser?.email);

      if (!res.success) {
        // Server may return fieldErrors from Zod
        if (res.fieldErrors) {
          Object.entries(res.fieldErrors).forEach(([field, msgs]) => {
            const msg = Array.isArray(msgs) ? msgs[0] : msgs;
            toast.error(`${field}: ${msg}`);
          });
        } else {
          toast.error(res.error || "Something went wrong, please try again");
        }
        return;
      }

      toast.success("Client saved successfully!");
      reset(defaultValues);
      onResetComplete();
      pendingFilesRef.current = {};
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong, please try again");
    } finally {
      setLoading(false);
    }
  };

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
            : "bg-foreground text-background hover:bg-primary hover:text-white shadow-2xl shadow-black/10 hover:shadow-primary/30 active:scale-95"
          }
        `}
      >
        {loading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Processing Application...
          </>
        ) : (
          "Register Client"
        )}
      </button>
      {!loading && (
        <div className="text-center text-[9px] text-muted-foreground/40 font-black uppercase tracking-[0.3em] mt-6 flex items-center justify-center gap-2">
          <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse"></div>
          Secure End-to-End Encryption Active
        </div>
      )}
    </div>
  );
};
