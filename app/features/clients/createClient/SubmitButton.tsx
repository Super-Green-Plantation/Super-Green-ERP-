
"use client";

import { useFormContext } from "@/app/context/FormContext";
import { useEffect, useRef, useState } from "react";
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



// Exposed via a ref so SubmitButton can trigger upload from DocumentUploadSection
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
}: {
  pendingFilesRef: PendingFilesRef;
}) => {
  const { form } = useFormContext();
  const [loading, setLoading] = useState(false);
  const [dbUser, setDbUser] = useState<DbUser | null>(null);
const { reset, resetField } = form;

  useEffect(() => {
    fetch("/api/me")
      .then((res) => res.json())
      .then(({ dbUser }) => setDbUser(dbUser));
  }, []);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      // 1. Upload any pending files and set URLs into form
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

      // 2. Submit the form with all values (including now-set document URLs)
      const data = form.getValues();
      console.log("Submitting:", data);

      const res = await saveClient(data, dbUser?.email);

      if (!res.success) {
        toast.error(res.error || "Something went wrong, please try again");
        return;
      }

      toast.success("Client saved successfully!");

      reset();
      resetField("applicant.idFront");
      resetField("applicant.idBack");
      resetField("applicant.paymentSlip");
      resetField("applicant.proposal");
      resetField("applicant.agreement");
      resetField("applicant.signature");
      resetField("applicant.investmentAmount");
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
          w-full py-4 px-6 rounded-2xl font-bold uppercase tracking-widest text-sm transition-all duration-300
          flex items-center justify-center gap-3
          ${loading
            ? "bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200"
            : "bg-slate-900 hover:bg-blue-600 text-white shadow-xl shadow-slate-200 active:scale-95"
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
        <p className="text-center text-[10px] text-gray-400 font-bold uppercase tracking-[0.2em] mt-4">
          Encrypted Secure Submission
        </p>
      )}
    </div>
  );
};
