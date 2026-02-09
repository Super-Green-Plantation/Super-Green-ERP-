"use client";

import React, { useState, useEffect } from "react";
import {
  FileUp,
  CheckCircle2,
  FileText,
  ShieldCheck,
  Image as ImageIcon,
  X,
  UploadCloud,
  Eye,
} from "lucide-react";
import { useFormContext } from "@/app/context/FormContext";
import { uploadMultipleDocuments } from "@/lib/uploadMultipleDocuments";

interface FileUploadState {
  [key: string]: File | null;
}

interface PreviewState {
  [key: string]: string | null;
}

const DocumentUploadSection = () => {
  const { form } = useFormContext();
  const { setValue } = form;
  const [uploading, setUploading] = useState(false);

  const [uploadedUrls, setUploadedUrls] = useState<
    Record<string, string | null>
  >({
    idFront: null,
    idBack: null,
    proposal: null,
    agreement: null,
  });

  const [files, setFiles] = useState<FileUploadState>({
    idFront: null,
    idBack: null,
    proposal: null,
    agreement: null,
  });

  const [previews, setPreviews] = useState<PreviewState>({
    idFront: null,
    idBack: null,
    proposal: null,
    agreement: null,
  });

  useEffect(() => {
    return () => {
      Object.values(previews).forEach((url) => {
        if (url) URL.revokeObjectURL(url);
      });
    };
  }, []);

  const handleFileChange = (key: string, file: File | null) => {
    setFiles((prev) => ({ ...prev, [key]: file }));

    setPreviews((prev) => {
      // revoke old URL ONLY for this key
      if (prev[key]) {
        URL.revokeObjectURL(prev[key]!);
      }

      return {
        ...prev,
        [key]: file ? URL.createObjectURL(file) : null,
      };
    });
  };



  const FileCard = ({
    label,
    id,
    description,
    accept = "image/*,application/pdf",
  }: {
    label: string;
    id: string;
    description: string;
    accept?: string;
  }) => {
    const isUploaded = !!files[id];
    const previewUrl = previews[id];
    const isPDF = files[id]?.type === "application/pdf";

    return (
      <div
        className={`relative group transition-all duration-500 rounded-2xl border-2 border-dashed h-48 overflow-hidden ${
          isUploaded
            ? "border-emerald-500 bg-emerald-50/10"
            : "border-gray-200 bg-white hover:border-blue-400"
        }`}
      >
        {/* The Actual Input */}
        <input
          type="file"
          id={id}
          accept={accept}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-30"
          onChange={(e) => handleFileChange(id, e.target.files?.[0] || null)}
        />

        {/* PREVIEW LAYER */}
        {isUploaded && previewUrl ? (
          <div className="absolute inset-0 z-10 animate-in fade-in duration-500">
            {isPDF ? (
              <div className="flex flex-col items-center justify-center h-full bg-slate-100">
                <FileText className="w-12 h-12 text-slate-400 mb-2" />
              </div>
            ) : (
              <img
                src={previewUrl}
                alt="Preview"
                className="w-full h-full object-cover"
              />
            )}
            {/* Overlay on hover to change file */}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <div className="flex flex-col items-center text-white scale-90 group-hover:scale-100 transition-transform">
                <UploadCloud className="w-6 h-6 mb-1" />
                <span className="text-[10px] font-black uppercase tracking-tighter">
                  Replace File
                </span>
              </div>
            </div>
          </div>
        ) : null}

        {/* DEFAULT UPLOAD STATE (Visible only when no file) */}
        {!isUploaded && (
          <div className="p-6 flex flex-col items-center justify-center text-center space-y-3 h-full">
            <div className="p-3 bg-gray-50 group-hover:bg-blue-50 rounded-full transition-colors">
              <UploadCloud className="w-6 h-6 text-gray-400 group-hover:text-blue-500" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900">{label}</p>
              <p className="text-[10px] text-gray-400 font-medium uppercase tracking-tight">
                {description}
              </p>
            </div>
          </div>
        )}

        {/* TOP STATUS BADGE (Persistent when uploaded) */}
        {isUploaded && (
          <div className="absolute top-2 left-2 right-2 z-20 flex justify-between items-start pointer-events-none">
            <div className="bg-white/90 backdrop-blur px-2 py-1 rounded-lg shadow-sm flex items-center gap-1.5 border border-emerald-100">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-tighter truncate max-w-[80px]">
                {label}
              </span>
            </div>

            <button
              onClick={(e) => {
                e.preventDefault();
                handleFileChange(id, null);
              }}
              className="pointer-events-auto p-1.5 bg-red-500 text-white rounded-lg shadow-lg hover:bg-red-600 transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>
    );
  };

  const uploadToCloudinary = async (file: File) => {
    const sigRes = await fetch("/api/src/cloudinary", { method: "POST" });
    const sig = await sigRes.json();

    const formData = new FormData();
    formData.append("file", file);
    formData.append("api_key", sig.apiKey);
    formData.append("timestamp", String(sig.timestamp));
    formData.append("signature", sig.signature);
    formData.append("folder", "compliance-docs");

    const isPDF = file.type === "application/pdf";

    const url = `https://api.cloudinary.com/v1_1/${sig.cloudName}/${
      isPDF ? "raw" : "image"
    }/upload`;

    const res = await fetch(url, { method: "POST", body: formData });
    if (!res.ok) throw new Error("Upload failed");

    return await res.json(); // res.secure_url will be a usable link
  };

  const handleOrcCommission = async () => {
    setUploading(true);

    try {
      const results = await Promise.all(
        Object.entries(files).map(async ([key, file]) => {
          if (!file) return [key, null];

          const uploaded = await uploadToCloudinary(file);
          return [key, uploaded.secure_url];
        }),
      );

      setUploadedUrls(Object.fromEntries(results));
      console.log("Uploaded URLs:", Object.fromEntries(results));
    } catch (err) {
      console.error(err);
      alert("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  // setValue("applicant.idFront", uploadedUrls.idFront ?? undefined);
  // setValue("applicant.idBack", uploadedUrls.idBack ?? undefined);
  // setValue("applicant.proposal", uploadedUrls.proposal ?? undefined);
  // setValue("applicant.agreement", uploadedUrls.agreement ?? undefined);

  return (
    <div className="space-y-8 py-4">
      <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
        <div className="p-2 bg-blue-600 rounded-lg">
          <ShieldCheck className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="text-sm font-black uppercase tracking-widest text-gray-900">
            Document Compliance
          </h3>
          <p className="text-xs text-gray-500 font-medium">
            Verify your identification and review supporting documents.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Identification Block */}
        <div className="space-y-4">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
            <ImageIcon className="w-3 h-3" /> Identity (NIC/DL/Passport)
          </label>
          <div className="grid grid-cols-2 gap-4">
            <FileCard
              id="idFront"
              label="Front View"
              description="Photo or Scan"
            />
            <FileCard
              id="idBack"
              label="Back View"
              description="Photo or Scan"
            />
          </div>
        </div>

        {/* Legal Paperwork Block */}
        <div className="space-y-4">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
            <FileText className="w-3 h-3" /> Mandatory Paperwork
          </label>
          <div className="grid grid-cols-2 gap-4">
            <FileCard
              id="proposal"
              label="Proposal Form"
              description="Signed PDF/JPG"
            />
            <FileCard
              id="agreement"
              label="Agreement"
              description="Legal Binding PDF"
            />
          </div>
        </div>
      </div>

      <div className="p-4 bg-amber-50 rounded-xl border border-amber-100 flex items-start gap-3">
        <FileUp className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <p className="text-[11px] leading-relaxed text-amber-800 font-medium italic">
          Files must be under 5MB. Images will show a live preview; PDFs will
          show a file icon. Ensure all details are sharp and clearly visible.
        </p>
      </div>

      <button
        onClick={handleOrcCommission}
        disabled={uploading}
        className="w-full py-3 rounded-xl bg-blue-600 text-white text-sm font-bold tracking-wide hover:bg-blue-700 disabled:opacity-50"
      >
        {uploading ? "Uploading documents..." : "Upload Documents"}
      </button>
    </div>
  );
};

export default DocumentUploadSection;
