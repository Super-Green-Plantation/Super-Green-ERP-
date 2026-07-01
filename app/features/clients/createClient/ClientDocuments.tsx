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
      <div className="relative group rounded-2xl border-2 border-dashed border-gray-200 dark:border-zinc-800 min-h-[110px] md:h-48 overflow-hidden bg-gray-50/50 dark:bg-zinc-900/30 hover:bg-gray-100/70 dark:hover:bg-zinc-900/60 hover:border-blue-400 dark:hover:border-blue-500 transition-all duration-300 flex items-center justify-center shadow-sm">
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
            className="absolute top-3 right-3 z-20 pointer-events-auto p-2 bg-red-500 text-white rounded-xl shadow-md hover:bg-red-600 transition-colors"
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
          <div className="p-4 md:p-6 w-full flex md:flex-col items-center md:justify-center gap-4 md:gap-3 text-left md:text-center h-full">
            <div className="p-3 md:p-4 bg-white dark:bg-zinc-800 shadow-sm group-hover:bg-blue-50 dark:group-hover:bg-blue-950/40 rounded-xl md:rounded-2xl transition-colors shrink-0 group-hover:scale-105 transition-transform duration-300">
              <UploadCloud className="w-5 h-5 md:w-7 md:h-7 text-gray-400 group-hover:text-blue-500" />
            </div>
            <div className="min-w-0 flex-1 md:flex-none">
              <p className="text-sm md:text-base font-bold text-gray-900 dark:text-zinc-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
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
    <div className="max-w-5xl mx-auto p-1 sm:p-4 md:p-10 space-y-8 bg-white dark:bg-zinc-950 rounded-xl">
      {/* Header */}
      <div className="flex items-center gap-4 border-b border-gray-100 dark:border-zinc-900 pb-5">
        <div className="w-11 h-11 bg-blue-50 dark:bg-blue-950/50 rounded-xl flex items-center justify-center shrink-0">
          <ShieldCheck className="w-6 h-6 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <h3 className="text-sm font-extrabold uppercase tracking-widest text-gray-800 dark:text-zinc-200">
            Document Compliance
          </h3>
          <p className="text-xs text-gray-400 dark:text-zinc-500 mt-0.5 hidden md:block">
            Please upload the required verification files below.
          </p>
        </div>
      </div>

      {/* Info Warning Banner */}
      <div className="p-4 md:p-5 bg-amber-50/60 dark:bg-amber-950/20 rounded-2xl border border-amber-100 dark:border-amber-900/30 flex items-start md:items-center justify-between gap-4">
        <div className="flex items-start md:items-center gap-3">
          <UploadCloud className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
          <p className="text-xs md:text-sm leading-relaxed text-amber-900 dark:text-amber-400 font-medium">
            Payload Limit: <span className="font-bold">1MB / Section</span>. 
          </p>
        </div>
        {selectedCount > 0 && (
          <span className="hidden md:inline-block bg-blue-600 text-white px-3 py-1 rounded-xl text-xs font-bold tracking-wider shrink-0">
            {selectedCount} READY TO UPLOAD
          </span>
        )}
      </div>

      {/* Main Grid Layout - Side-by-side or stacked cleanly */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Identity Docs section (Takes 5 cols on large desktop) */}
        <div className="space-y-4 lg:col-span-5">
          <label className="text-xs font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-widest flex items-center gap-2">
            <ImageIcon className="w-4 h-4" /> Identity Documents
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FileCard id="idFront" label="Front View" description="NIC / DL / Passport" />
            <FileCard id="idBack" label="Back View" description="NIC / DL / Passport" />
          </div>
        </div>

        {/* Paperwork Section (Takes 7 cols on large desktop to give 3 cards plenty of text room) */}
        <div className="space-y-4 lg:col-span-7">
          <label className="text-xs font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-widest flex items-center gap-2">
            <FileText className="w-4 h-4" /> Paperwork Documentation
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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