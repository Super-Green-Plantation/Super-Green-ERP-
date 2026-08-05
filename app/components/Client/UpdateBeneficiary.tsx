"use client";

import { inputClass, labelClass } from "@/app/const/inputStyles";
import { updateBeneficiary } from "@/app/features/clients/actions";
import { useQueryClient } from "@tanstack/react-query";
import {
  Landmark,
  X,
  UploadCloud,
  Loader2,
  CheckCircle2,
  Eye,
} from "lucide-react";
import { useParams } from "next/navigation";
import React, { useState, useRef } from "react";
import { toast } from "sonner";
import { updateBeneficiarySchema } from "@/lib/validations/client.schema";
import { createClient } from "@/lib/supabase/client";

const BUCKET = "kyc-documents";

const FieldError = ({ message }: { message?: string }) =>
  message ? (
    <p className="mt-1 ml-1 text-[10px] font-bold text-red-500 tracking-wide">
      {message}
    </p>
  ) : null;

async function uploadToSupabase(key: string, file: File): Promise<string> {
  const supabase = createClient();
  const ext = file.name.split(".").pop();
  const path = `${key}/${Date.now()}-${crypto.randomUUID()}.${ext}`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { cacheControl: "3600", upsert: false, contentType: file.type });

  if (error) throw new Error(`Upload failed for ${key}: ${error.message}`);

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

// ─── Photo Upload Field ───────────────────────────────────────────────────────

interface PhotoUploadFieldProps {
  label: string;
  fieldKey: string;
  existingUrl?: string | null;
  file: File | null;
  uploading: boolean;
  onFileChange: (key: string, file: File | null) => void;
}

const PhotoUploadField = ({
  label,
  fieldKey,
  existingUrl,
  file,
  uploading,
  onFileChange,
}: PhotoUploadFieldProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const previewUrl = file ? URL.createObjectURL(file) : existingUrl;

  return (
    <div>
      <label className={labelClass}>{label}</label>
      <div
        className="mt-1 flex items-center gap-3 p-3 border border-dashed border-border rounded-xl bg-muted/20 cursor-pointer hover:bg-muted/40 transition-colors"
        onClick={() => inputRef.current?.click()}
      >
        {uploading ? (
          <Loader2 className="w-4 h-4 text-muted-foreground animate-spin shrink-0" />
        ) : previewUrl ? (
          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
        ) : (
          <UploadCloud className="w-4 h-4 text-muted-foreground shrink-0" />
        )}

        <span className="text-xs text-muted-foreground truncate flex-1">
          {file
            ? file.name
            : existingUrl
            ? "Uploaded — click to replace"
            : "Click to upload (JPG, PNG, PDF)"}
        </span>

        {previewUrl && !uploading && (
          <a
            href={previewUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="p-1 hover:bg-muted rounded-md transition-colors"
            title="Preview"
          >
            <Eye className="w-3.5 h-3.5 text-muted-foreground" />
          </a>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*,application/pdf"
        className="hidden"
        onChange={(e) => onFileChange(fieldKey, e.target.files?.[0] ?? null)}
      />
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

interface UpdateBeneficiaryModalProps {
  onClose: () => void;
  initialData: any;
}

const UpdateBeneficiary = ({
  onClose,
  initialData,
}: UpdateBeneficiaryModalProps) => {
  const [formData, setFormData] = useState<any>({
    beneficiary: {
      id: null,
      fullName: "",
      relationship: "",
      bankName: "",
      accountNo: "",
      bankBranch: "",
      nic: "",
      phone: "",
      bankBookPhotoUrl: null,
      idCopyUrl: null,
      ...initialData,
    },
  });

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [photoFiles, setPhotoFiles] = useState<Record<string, File | null>>({
    bankBookPhotoUrl: null,
    idCopyUrl: null,
  });
  const [uploading, setUploading] = useState(false);

  const queryClient = useQueryClient();
  const { id } = useParams();

  const handleChange = (section: string | null, field: string, value: any) => {
    if (section) {
      setFormData((prev: any) => ({
        ...prev,
        [section]: { ...prev[section], [field]: value },
      }));
    } else {
      setFormData((prev: any) => ({ ...prev, [field]: value }));
    }
    setFieldErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const handleFileChange = (key: string, file: File | null) => {
    setPhotoFiles((prev) => ({ ...prev, [key]: file }));
  };

  const errClass = (field: string) =>
    `${inputClass} ${fieldErrors[field] ? "!border-red-400 focus:!ring-red-400" : ""}`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const parsed = updateBeneficiarySchema.safeParse(formData.beneficiary);
    if (!parsed.success) {
      const errs: Record<string, string> = {};
      parsed.error.issues.forEach((issue) => {
        const key = issue.path[issue.path.length - 1] as string;
        if (!errs[key]) errs[key] = issue.message;
      });
      setFieldErrors(errs);
      toast.error("Please fix the errors before saving.");
      return;
    }

    try {
      setUploading(true);

      // Upload any pending photo files
      const photoUrls: Record<string, string | null> = {
        bankBookPhotoUrl: formData.beneficiary.bankBookPhotoUrl ?? null,
        idCopyUrl: formData.beneficiary.idCopyUrl ?? null,
      };

      for (const [key, file] of Object.entries(photoFiles)) {
        if (file) {
          const url = await uploadToSupabase(
            `beneficiary/${formData.beneficiary.id}/${key}`,
            file
          );
          photoUrls[key] = url;
        }
      }

      await updateBeneficiary({
        ...formData.beneficiary,
        ...photoUrls,
      });

      queryClient.invalidateQueries({ queryKey: ["client", Number(id)] });
      toast.success("Beneficiary updated successfully.");
      onClose();
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to save. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
      />

      <div className="relative w-full max-w-2xl bg-card border border-border rounded-2xl shadow-lg animate-in zoom-in-95 duration-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/10 rounded-lg">
              <Landmark className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h3 className="text-sm font-bold uppercase tracking-widest text-foreground">
                Update Beneficiary
              </h3>
              <p className="text-[10px] text-muted-foreground uppercase tracking-tighter">
                Banking & Relationship Details
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className={labelClass}>Beneficiary Name *</label>
                <input
                  value={formData.beneficiary.fullName}
                  onChange={(e) =>
                    handleChange("beneficiary", "fullName", e.target.value)
                  }
                  className={errClass("fullName")}
                  placeholder="Enter full name"
                />
                <FieldError message={fieldErrors.fullName} />
              </div>

              <div className="md:col-span-1">
                <label className={labelClass}>Beneficiary NIC</label>
                <input
                  value={formData.beneficiary.nic}
                  onChange={(e) =>
                    handleChange("beneficiary", "nic", e.target.value)
                  }
                  className={errClass("nic")}
                  placeholder="000000000V or 200000000000"
                />
                <FieldError message={fieldErrors.nic} />
              </div>

              <div>
                <label className={labelClass}>Relationship</label>
                <input
                  value={formData.beneficiary.relationship}
                  onChange={(e) =>
                    handleChange("beneficiary", "relationship", e.target.value)
                  }
                  className={inputClass}
                  placeholder="e.g. Spouse"
                />
              </div>

              <div>
                <label className={labelClass}>Bank Name *</label>
                <input
                  value={formData.beneficiary.bankName}
                  onChange={(e) =>
                    handleChange("beneficiary", "bankName", e.target.value)
                  }
                  className={errClass("bankName")}
                  placeholder="Bank Name"
                />
                <FieldError message={fieldErrors.bankName} />
              </div>

              <div>
                <label className={labelClass}>Account Number *</label>
                <input
                  value={formData.beneficiary.accountNo}
                  onChange={(e) =>
                    handleChange("beneficiary", "accountNo", e.target.value)
                  }
                  className={errClass("accountNo")}
                  placeholder="0000 0000 0000"
                />
                <FieldError message={fieldErrors.accountNo} />
              </div>

              <div>
                <label className={labelClass}>Bank Branch</label>
                <input
                  value={formData.beneficiary.bankBranch}
                  onChange={(e) =>
                    handleChange("beneficiary", "bankBranch", e.target.value)
                  }
                  className={inputClass}
                  placeholder="Branch name/code"
                />
              </div>

              <div>
                <label className={labelClass}>Phone</label>
                <input
                  value={formData.beneficiary.phone}
                  onChange={(e) =>
                    handleChange("beneficiary", "phone", e.target.value)
                  }
                  className={inputClass}
                  placeholder="07XXXXXXXX"
                />
              </div>

              {/* ── Photo Uploads ── */}
              <div className="md:col-span-2 pt-2 border-t border-border">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-4">
                  Documents
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <PhotoUploadField
                    label="Bank Book Photo"
                    fieldKey="bankBookPhotoUrl"
                    existingUrl={formData.beneficiary.bankBookPhotoUrl}
                    file={photoFiles.bankBookPhotoUrl}
                    uploading={uploading && !!photoFiles.bankBookPhotoUrl}
                    onFileChange={handleFileChange}
                  />

                  <PhotoUploadField
                    label="Beneficiary ID Copy"
                    fieldKey="idCopyUrl"
                    existingUrl={formData.beneficiary.idCopyUrl}
                    file={photoFiles.idCopyUrl}
                    uploading={uploading && !!photoFiles.idCopyUrl}
                    onFileChange={handleFileChange}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 p-6 bg-muted/20 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={uploading}
              className="px-8 py-2.5 bg-primary text-primary-foreground rounded-xl text-xs font-bold uppercase tracking-widest hover:opacity-90 transition-all shadow-lg shadow-primary/20 disabled:opacity-60 flex items-center gap-2"
            >
              {uploading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {uploading ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UpdateBeneficiary;