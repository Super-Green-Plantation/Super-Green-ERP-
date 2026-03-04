"use client";

import React, { useState } from "react";
import {
  X,
  FileText,
  CheckCircle2,
  CloudLightning,
  Loader2,
  UploadCloud,
} from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

interface UpdateDocsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (files: Record<string, string | null>) => void;
}

const BUCKET = "kyc-documents";

const docTypes = [
  { id: "idFront",  label: "NIC / ID Front",   description: "Clear photo or scan of the front side" },
  { id: "idBack",   label: "NIC / ID Back",    description: "Clear photo or scan of the back side" },
  { id: "paymentSlip",   label: "Payment Slip",    description: "Clear photo or scan of the Payment Slip" },
  { id: "proposal", label: "Proposal Form",    description: "Signed digital or scanned copy" },
  { id: "agreement",label: "Legal Agreement",  description: "Finalized & stamped document" },
];

const uploadToSupabase = async (key: string, file: File): Promise<string> => {
  const supabase = createClient();
  const ext = file.name.split(".").pop();
  const path = `${key}/${Date.now()}-${crypto.randomUUID()}.${ext}`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type,
    });

  if (error) throw new Error(`Upload failed for ${key}: ${error.message}`);

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
};

const UpdateDocsModal = ({ isOpen, onClose, onSave }: UpdateDocsModalProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const [files, setFiles] = useState<Record<string, File | null>>({
    idFront: null,
    idBack: null,
    paymentSlip:null,
    proposal: null,
    agreement: null,
  });

  if (!isOpen) return null;

  const handleFileChange = (key: string, file: File | null) => {
    if (!file) {
      setFiles((prev) => ({ ...prev, [key]: null }));
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error(`File is too large. Max limit is 10MB.`);
      return;
    }
    if (file.size > 1 * 1024 * 1024) {
      toast.warning(`File is slightly large (>1MB). A smaller file is recommended.`);
    }
    setFiles((prev) => ({ ...prev, [key]: file }));
  };

  const handleUpdate = async () => {
    const hasFiles = Object.values(files).some(Boolean);
    if (!hasFiles) {
      toast.error("Please select at least one file to upload.");
      return;
    }

    setIsUploading(true);
    try {
      const uploadedUrls: Record<string, string | null> = {};

      for (const key of Object.keys(files)) {
        const file = files[key];
        if (file) {
          uploadedUrls[key] = await uploadToSupabase(key, file);
        } else {
          uploadedUrls[key] = null; // no new file for this key — parent keeps existing
        }
      }

      await onSave(uploadedUrls);
      onClose();
    } catch (err) {
      console.error(err);
      toast.error("Failed to upload one or more documents. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-slate-900/40 transition-opacity"
        onClick={onClose}
      />

      <div className="relative w-full max-w-2xl bg-white rounded-[2.5rem] shadow-2xl border border-white/20 overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="px-8 pt-8 pb-6 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="p-1.5 bg-blue-50 rounded-lg">
                <CloudLightning size={16} className="text-blue-600" />
              </div>
              <h2 className="text-xl font-black text-slate-900 tracking-tighter">
                Update KYC Vault
              </h2>
            </div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              Regulatory Compliance Overwrite
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-3 hover:bg-slate-50 rounded-2xl text-slate-400 hover:text-slate-900 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <div className="px-8 pb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {docTypes.map((doc) => {
              const file = files[doc.id];
              const isPDF = file?.type === "application/pdf";
              const previewUrl = file ? URL.createObjectURL(file) : null;

              return (
                <div key={doc.id} className="group relative">
                  <label className="block mb-2 text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">
                    {doc.label}
                  </label>
                  <div className="relative flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50 group-hover:bg-white group-hover:border-blue-400 transition-all cursor-pointer min-h-[140px]">
                    <input
                      type="file"
                      accept="image/*,application/pdf"
                      className="absolute inset-0 opacity-0 cursor-pointer z-10"
                      onChange={(e) => handleFileChange(doc.id, e.target.files?.[0] || null)}
                    />

                    {file ? (
                      /* Preview */
                      <div className="flex flex-col items-center gap-2 w-full">
                        {isPDF ? (
                          <div className="flex flex-col items-center gap-1">
                            <FileText className="w-10 h-10 text-slate-400" />
                            <p className="text-[10px] text-slate-500 font-medium truncate max-w-[140px]">
                              {file.name}
                            </p>
                          </div>
                        ) : (
                          <img
                            src={previewUrl!}
                            alt="Preview"
                            className="w-20 h-20 object-cover rounded-lg border border-slate-200 shadow-sm"
                          />
                        )}
                        {/* Remove button */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleFileChange(doc.id, null);
                          }}
                          className="mt-1 px-3 py-1 bg-red-50 text-red-500 hover:bg-red-500 hover:text-white text-[10px] font-bold rounded-full border border-red-200 transition-colors z-20 relative"
                        >
                          Remove
                        </button>
                      </div>
                    ) : (
                      /* Empty state */
                      <>
                        <div className="w-10 h-10 rounded-xl bg-white shadow-sm border border-slate-100 flex items-center justify-center text-slate-400 group-hover:text-blue-600 transition-colors mb-2">
                          <UploadCloud size={18} />
                        </div>
                        <p className="text-[11px] font-bold text-slate-600">Click to upload</p>
                        <p className="text-[9px] text-slate-400 mt-1">{doc.description} (Max 10MB)</p>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Warning */}
          <div className="mt-6 p-4 bg-orange-50 border border-orange-100 rounded-2xl flex gap-3">
            <div className="w-5 h-5 rounded-full bg-orange-500 text-white flex items-center justify-center shrink-0">
              <span className="text-[10px] font-black">!</span>
            </div>
            <p className="text-[11px] font-bold text-orange-700 leading-relaxed">
              Uploading new documents will replace the current files in the secure vault. This action is permanent.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-8 py-6 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-3 text-[11px] font-black uppercase tracking-widest text-slate-500 hover:text-slate-900 transition-colors"
          >
            Cancel
          </button>
          <button
            disabled={isUploading}
            onClick={handleUpdate}
            className="flex items-center gap-2 px-8 py-3.5 bg-slate-900 hover:bg-blue-600 disabled:bg-slate-400 text-white rounded-2xl text-[11px] font-black uppercase tracking-[0.15em] transition-all shadow-xl shadow-slate-200 active:scale-95"
          >
            {isUploading ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                Uploading to Supabase...
              </>
            ) : (
              <>
                <CheckCircle2 size={14} />
                Commit Changes
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default UpdateDocsModal;