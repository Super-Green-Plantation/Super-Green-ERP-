"use client";

import React, { useState, useRef } from "react";
import {
  Users,
  X,
  UploadCloud,
  Loader2,
  CheckCircle2,
  Eye,
} from "lucide-react";
import { updateNominee } from "@/app/features/clients/actions";
import { inputClass, labelClass } from "@/app/const/inputStyles";
import { useQueryClient } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { updateNomineeSchema } from "@/lib/validations/client.schema";
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
          <CheckCircle2 className="w-4 h-4 text-purple-500 shrink-0" />
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

interface UpdateNomineeModalProps {
  onClose: () => void;
  initialData: any;
}

export const UpdateNominee = ({
  onClose,
  initialData,
}: UpdateNomineeModalProps) => {
  const queryClient = useQueryClient();
  const { id } = useParams();

  const [formData, setFormData] = useState<any>({
    nominee: {
      id: initialData?.id || null,
      fullName: initialData?.fullName || "",
      nic: initialData?.nic || "",
      permanentAddress: initialData?.permanentAddress || "",
      postalAddress: initialData?.postalAddress || "",
      contact: initialData?.contact || "",
      idCopyUrl: initialData?.idCopyUrl || null,
    },
  });

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [idCopyFile, setIdCopyFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleChange = (section: string, field: string, value: string) => {
    setFormData((prev: any) => ({
      ...prev,
      [section]: { ...prev[section], [field]: value },
    }));
    setFieldErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const errClass = (field: string) =>
    `${inputClass} ${fieldErrors[field] ? "!border-red-400 focus:!ring-red-400" : ""}`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const parsed = updateNomineeSchema.safeParse(formData.nominee);
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

      let idCopyUrl = formData.nominee.idCopyUrl ?? null;
      if (idCopyFile) {
        idCopyUrl = await uploadToSupabase(
          `nominee/${formData.nominee.id}/idCopyUrl`,
          idCopyFile
        );
      }

      await updateNominee({ ...formData.nominee, idCopyUrl });

      queryClient.invalidateQueries({ queryKey: ["client", Number(id)] });
      toast.success("Nominee updated successfully.");
      onClose();
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to save. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-background/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="relative w-full max-w-2xl bg-card border border-border rounded-2xl shadow-lg overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500/10 rounded-lg">
              <Users className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h3 className="text-sm font-bold uppercase tracking-widest text-foreground">
                Nominee Registry
              </h3>
              <p className="text-[10px] text-muted-foreground uppercase tracking-tighter">
                Manage legal representative details
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
            <div className="grid grid-cols-1 gap-6">
              <div>
                <label className={labelClass}>Nominee Full Name *</label>
                <input
                  type="text"
                  value={formData.nominee.fullName}
                  onChange={(e) =>
                    handleChange("nominee", "fullName", e.target.value)
                  }
                  className={errClass("fullName")}
                  placeholder="Enter full name"
                />
                <FieldError message={fieldErrors.fullName} />
              </div>

              <div>
                <label className={labelClass}>Nominee NIC</label>
                <input
                  type="text"
                  value={formData.nominee.nic}
                  onChange={(e) =>
                    handleChange("nominee", "nic", e.target.value)
                  }
                  className={errClass("nic")}
                  placeholder="000000000V or 200000000000"
                />
                <FieldError message={fieldErrors.nic} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Permanent Address *</label>
                  <textarea
                    rows={3}
                    value={formData.nominee.permanentAddress}
                    onChange={(e) =>
                      handleChange("nominee", "permanentAddress", e.target.value)
                    }
                    className={`${errClass("permanentAddress")} resize-none`}
                    placeholder="Street, City, State"
                  />
                  <FieldError message={fieldErrors.permanentAddress} />
                </div>
                <div>
                  <label className={labelClass}>Postal Address</label>
                  <textarea
                    rows={3}
                    value={formData.nominee.postalAddress}
                    onChange={(e) =>
                      handleChange("nominee", "postalAddress", e.target.value)
                    }
                    className={`${inputClass} resize-none`}
                    placeholder="Mailing address"
                  />
                </div>
              </div>

              {/* ── ID Copy Upload ── */}
              <div className="pt-2 border-t border-border">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-4">
                  Documents
                </p>
                <PhotoUploadField
                  label="Nominee ID Copy"
                  fieldKey="idCopyUrl"
                  existingUrl={formData.nominee.idCopyUrl}
                  file={idCopyFile}
                  uploading={uploading && !!idCopyFile}
                  onFileChange={(_, file) => setIdCopyFile(file)}
                />
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
              className="px-8 py-2.5 bg-purple-600 text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-purple-700 transition-all shadow-lg shadow-purple-500/20 disabled:opacity-60 flex items-center gap-2"
            >
              {uploading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {uploading ? "Saving..." : "Update Nominee"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UpdateNominee;