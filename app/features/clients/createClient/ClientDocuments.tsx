
"use client";

import React, { useEffect, useRef, useState } from "react";
import { FileUp, FileText, ShieldCheck, Image as ImageIcon, X, UploadCloud } from "lucide-react";

interface FileUploadState { [key: string]: File | null; }
interface PreviewState { [key: string]: string | null; }

interface DocumentUploadSectionProps {
  pendingFilesRef: React.MutableRefObject<Record<string, File | null>>;
}

const DocumentUploadSection = ({ pendingFilesRef }: DocumentUploadSectionProps) => {
  const [files, setFiles] = useState<FileUploadState>({
    idFront: null, idBack: null, paySlip: null, proposal: null, agreement: null,
  });

  const [previews, setPreviews] = useState<PreviewState>({
    idFront: null, idBack: null, paySlip: null, proposal: null, agreement: null,
  });

  // Keep the ref in sync with local file state so SubmitButton can read it
  useEffect(() => {
    pendingFilesRef.current = files;
  }, [files, pendingFilesRef]);

  useEffect(() => {
    return () => {
      Object.values(previews).forEach((url) => { if (url) URL.revokeObjectURL(url); });
    };
  }, []);

  const handleFileChange = (key: string, file: File | null) => {
    setFiles((prev) => ({ ...prev, [key]: file }));
    setPreviews((prev) => {
      if (prev[key]) URL.revokeObjectURL(prev[key]!);
      return { ...prev, [key]: file ? URL.createObjectURL(file) : null };
    });
  };

  const FileCard = ({
    label, id, description, accept = "image/*,application/pdf",
  }: { label: string; id: string; description: string; accept?: string }) => {
    const isSelected = !!files[id];
    const previewUrl = previews[id];
    const isPDF = files[id]?.type === "application/pdf";

    return (
      <div className="relative group rounded-2xl border-2 border-dashed h-48 overflow-hidden">
        <input
          type="file"
          id={id}
          accept={accept}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
          onChange={(e) => handleFileChange(id, e.target.files?.[0] || null)}
        />
        {isSelected && (
          <button
            onClick={(e) => { e.stopPropagation(); handleFileChange(id, null); }}
            title="Remove file"
            className="absolute top-2 right-2 z-20 pointer-events-auto p-1.5 bg-red-500 text-white rounded-lg shadow-lg hover:bg-red-600 transition-colors"
          >
            <X className="w-3 h-3" />
          </button>
        )}
        {isSelected && previewUrl && (
          <div className="absolute inset-0 z-0">
            {isPDF ? (
              <div className="flex flex-col items-center justify-center h-full bg-slate-100 gap-2">
                <FileText className="w-12 h-12 text-slate-400" />
                <p className="text-[10px] text-slate-500 font-medium px-4 truncate max-w-full">{files[id]?.name}</p>
              </div>
            ) : (
              <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
            )}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-10">
              <div className="flex flex-col items-center text-white scale-90 group-hover:scale-100 transition-transform">
                <UploadCloud className="w-6 h-6 mb-1" />
                <span className="text-[10px] font-bold uppercase tracking-tighter">Replace File</span>
              </div>
            </div>
          </div>
        )}
        {!isSelected && (
          <div className="p-6 flex flex-col items-center justify-center text-center space-y-3 h-full">
            <div className="p-3 bg-gray-50 group-hover:bg-blue-50 rounded-full transition-colors">
              <UploadCloud className="w-6 h-6 text-gray-400 group-hover:text-blue-500" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900">{label}</p>
              <p className="text-[10px] text-gray-400 font-medium uppercase tracking-tight">{description}</p>
            </div>
          </div>
        )}
      </div>
    );
  };

  const selectedCount = Object.values(files).filter(Boolean).length;

  return (
    <div className="space-y-8 py-4">
      <div className="flex items-center gap-3 border-b border-gray-100">
        <div className="p-2 bg-blue-600 rounded-lg">
          <ShieldCheck className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="text-sm font-bold uppercase tracking-widest text-gray-900">
            Document Compliance
          </h3>
          <p className="text-xs text-gray-500 font-medium">
            Documents will be uploaded automatically when you submit the form.
          </p>
        </div>
      </div>

      <div className="p-4 bg-amber-50 rounded-xl border border-amber-100 flex items-start gap-3">
        <FileUp className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <p className="text-[11px] leading-relaxed text-amber-800 font-medium italic">
          Files must be under 5MB. Select your files below — they will be securely uploaded when you click <strong>Register Client</strong>.
          {selectedCount > 0 && (
            <span className="ml-1 text-blue-700 not-italic font-bold">
              {selectedCount} file{selectedCount > 1 ? "s" : ""} ready.
            </span>
          )}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-4">
          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
            <ImageIcon className="w-3 h-3" /> Identity (NIC/DL/Passport)
          </label>
          <div className="grid grid-cols-2 gap-4">
            <FileCard id="idFront" label="Front View" description="Photo or Scan" />
            <FileCard id="idBack" label="Back View" description="Photo or Scan" />
          </div>
        </div>
        <div className="space-y-4">
          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
            <FileText className="w-3 h-3" /> Mandatory Paperwork
          </label>
          <div className="grid lg:grid-cols-3 gap-4">
            <FileCard id="paySlip" label="Payment Slip" description="Payment Slip" />
            <FileCard id="proposal" label="Proposal Form" description="Signed PDF/JPG" />
            <FileCard id="agreement" label="Agreement" description="Legal Binding PDF" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentUploadSection;
