
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
      <div className="relative group rounded-3xl border-2 border-dashed border-border/50 h-40 overflow-hidden bg-card/40 hover:bg-card/80 transition-all duration-500">
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
    <div className="space-y-6">
      <div className="flex items-center gap-4 border-b border-border/10 pb-4">
        <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
          <ShieldCheck className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h3 className="text-xs font-black uppercase tracking-[0.25em] text-foreground opacity-80">
            Document Compliance Node
          </h3>
          <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-1 opacity-50">
            Secure Automated Validation System
          </p>
        </div>
      </div>

      <div className="p-5 bg-accent/5 rounded-2xl border border-accent/10 flex items-start gap-4">
        <UploadCloud className="w-5 h-5 text-accent shrink-0" />
        <p className="text-[11px] leading-relaxed text-accent/80 font-bold uppercase tracking-tight">
          Payload Limit: 5MB / Section. <span className="opacity-60 font-medium lowercase italic">Select your files below — they will be securely encrypted during the "Register Client" sequence.</span>
          {selectedCount > 0 && (
            <span className="ml-2 bg-primary text-primary-foreground px-2 py-0.5 rounded-lg text-[9px] font-black">
              {selectedCount} READY
            </span>
          )}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <label className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-[0.25em] flex items-center gap-2">
            <ImageIcon className="w-3 h-3" /> Identification Metadata
          </label>
          <div className="grid grid-cols-2 gap-4">
            <FileCard id="idFront" label="Front View" description="NIC / DL / Passport" />
            <FileCard id="idBack" label="Back View" description="NIC / DL / Passport" />
          </div>
        </div>
        <div className="space-y-4">
          <label className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-[0.25em] flex items-center gap-2">
            <FileText className="w-3 h-3" /> Compliance Paperwork
          </label>
          <div className="grid grid-cols-1 xs:grid-cols-3 gap-4">
            <FileCard id="paySlip" label="Payout" description="Slip" />
            <FileCard id="proposal" label="Proposal" description="Signed" />
            <FileCard id="agreement" label="Legal" description="Binding" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentUploadSection;
