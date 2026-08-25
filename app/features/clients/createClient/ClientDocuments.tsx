"use client";

import React, { useEffect, useState } from "react";
import { FileText, ShieldCheck, Image as ImageIcon, X, UploadCloud } from "lucide-react";

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
      <div className="relative group rounded-2xl border border-dashed border-border min-h-[110px] md:h-48 overflow-hidden bg-muted/20 hover:bg-primary/[0.03] hover:border-primary/40 transition-all duration-300 flex items-center justify-center shadow-sm">
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
            className="absolute right-3 top-3 z-20 pointer-events-auto rounded-lg bg-destructive p-2 text-white shadow-md transition-colors hover:brightness-105"
          >
            <X className="w-4 h-4" />
          </button>
        )}
        {isSelected && previewUrl && (
          <div className="absolute inset-0 z-0 w-full h-full">
            {isPDF ? (
              <div className="flex flex-col items-center justify-center h-full bg-slate-100 dark:bg-zinc-800 gap-3 p-4">
                <FileText className="w-10 h-10 md:w-14 md:h-14 text-slate-500" />
                <p className="text-xs text-slate-600 dark:text-zinc-400 font-medium truncate max-w-full text-center px-4">{files[id]?.name}</p>
              </div>
            ) : (
              <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
            )}
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-10">
              <div className="flex flex-col items-center text-white scale-90 group-hover:scale-100 transition-transform">
                <UploadCloud className="w-6 h-6 md:w-8 md:h-8 mb-2" />
                <span className="text-xs md:text-sm font-semibold uppercase tracking-wider">Replace File</span>
              </div>
            </div>
          </div>
        )}
        {!isSelected && (
          <div className="flex h-full w-full items-center gap-4 p-4 text-left md:flex-col md:justify-center md:gap-3 md:p-6 md:text-center">
            <div className="shrink-0 rounded-xl bg-card p-3 shadow-sm transition-colors group-hover:bg-primary/10 group-hover:scale-105 md:rounded-2xl md:p-4">
              <UploadCloud className="w-5 h-5 md:w-7 md:h-7 text-muted-foreground group-hover:text-primary" />
            </div>
            <div className="min-w-0 flex-1 md:flex-none">
              <p className="text-sm font-bold text-foreground transition-colors group-hover:text-primary md:text-base">
                {label}
              </p>
              <p className="text-[11px] md:text-xs text-gray-400 dark:text-zinc-500 font-medium tracking-wide mt-0.5">
                {description}
              </p>
            </div>
          </div>
        )}
      </div>
    );
  };

  const selectedCount = Object.values(files).filter(Boolean).length;

  return (
    <div className="mx-auto max-w-5xl space-y-7 rounded-2xl border border-border/70 bg-card p-5 shadow-[0_10px_35px_rgba(34,43,72,0.05)] sm:p-6 md:p-8">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-border/70 pb-5">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
          <ShieldCheck className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h3 className="text-sm font-bold tracking-tight text-foreground">
            Document Compliance
          </h3>
          <p className="text-xs text-gray-400 dark:text-zinc-500 mt-0.5 hidden md:block">
            Please upload the required verification files below.
          </p>
        </div>
      </div>

      {/* Info Warning Banner */}
      <div className="flex items-start justify-between gap-4 rounded-2xl border border-amber-200/70 bg-amber-50/70 p-4 md:items-center md:p-5 dark:border-amber-900/40 dark:bg-amber-950/20">
        <div className="flex items-start md:items-center gap-3">
          <UploadCloud className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
          <p className="text-xs md:text-sm leading-relaxed text-amber-900 dark:text-amber-400 font-medium">
            Payload Limit: <span className="font-bold">1MB / Section</span>. 
          </p>
        </div>
        {selectedCount > 0 && (
          <span className="hidden md:inline-block rounded-lg bg-primary px-3 py-1 text-[10px] font-bold tracking-wide text-primary-foreground shrink-0">
            {selectedCount} READY TO UPLOAD
          </span>
        )}
      </div>

      {/* Main Grid Layout - Side-by-side or stacked cleanly */}
      <div className="grid grid-cols-1 gap-7 lg:grid-cols-12">
        
        {/* Identity Docs section (Takes 5 cols on large desktop) */}
        <div className="space-y-4 lg:col-span-5">
          <label className="text-xs font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-widest flex items-center gap-2">
            <ImageIcon className="w-4 h-4" /> Identity Documents
          </label>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FileCard id="idFront" label="Front View" description="NIC / DL / Passport" />
            <FileCard id="idBack" label="Back View" description="NIC / DL / Passport" />
          </div>
        </div>

        {/* Paperwork Section (Takes 7 cols on large desktop to give 3 cards plenty of text room) */}
        <div className="space-y-4 lg:col-span-7">
          <label className="text-xs font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-widest flex items-center gap-2">
            <FileText className="w-4 h-4" /> Paperwork Documentation
          </label>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <FileCard id="paySlip" label="Pay Slip" description="Recent salary slip" />
            <FileCard id="proposal" label="Proposal" description="Signed copy" />
            <FileCard id="agreement" label="Agreement Contract" description="Binding signature" />
          </div>
        </div>
        
      </div>
    </div>
  );
};

export default DocumentUploadSection;