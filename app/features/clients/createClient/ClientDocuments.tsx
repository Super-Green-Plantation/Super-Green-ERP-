"use client";

import React, { useState } from "react";
import { 
  FileUp, 
  CheckCircle2, 
  FileText, 
  ShieldCheck, 
  Image as ImageIcon, 
  X,
  UploadCloud
} from "lucide-react";

interface FileUploadState {
  [key: string]: File | null;
}

const DocumentUploadSection = () => {
  const [files, setFiles] = useState<FileUploadState>({
    idFront: null,
    idBack: null,
    proposal: null,
    agreement: null,
  });

  const handleFileChange = (key: string, file: File | null) => {
    setFiles((prev) => ({ ...prev, [key]: file }));
  };

  const FileCard = ({ 
    label, 
    id, 
    description, 
    accept = "image/*,application/pdf" 
  }: { 
    label: string; 
    id: string; 
    description: string;
    accept?: string;
  }) => {
    const isUploaded = !!files[id];

    return (
      <div className={`relative group transition-all duration-300 rounded-2xl border-2 border-dashed ${
        isUploaded ? "border-emerald-500 bg-emerald-50/30" : "border-gray-200 bg-white hover:border-blue-400"
      }`}>
        <input
          type="file"
          id={id}
          accept={accept}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
          onChange={(e) => handleFileChange(id, e.target.files?.[0] || null)}
        />
        
        <div className="p-6 flex flex-col items-center text-center space-y-3">
          {isUploaded ? (
            <div className="p-3 bg-emerald-100 rounded-full">
              <CheckCircle2 className="w-6 h-6 text-emerald-600" />
            </div>
          ) : (
            <div className="p-3 bg-gray-50 group-hover:bg-blue-50 rounded-full transition-colors">
              <UploadCloud className="w-6 h-6 text-gray-400 group-hover:text-blue-500" />
            </div>
          )}
          
          <div>
            <p className="text-sm font-bold text-gray-900">{label}</p>
            <p className="text-[10px] text-gray-400 font-medium uppercase tracking-tight">{description}</p>
          </div>

          {isUploaded && (
            <div className="flex items-center gap-2 px-3 py-1 bg-white border border-emerald-100 rounded-lg shadow-sm animate-in fade-in zoom-in duration-300">
              <FileText className="w-3 h-3 text-emerald-500" />
              <span className="text-[10px] font-mono text-emerald-700 truncate max-w-[120px]">
                {files[id]?.name}
              </span>
              <button 
                onClick={(e) => {
                  e.preventDefault();
                  handleFileChange(id, null);
                }}
                className="z-20 p-1 hover:bg-red-50 rounded-md transition-colors"
              >
                <X className="w-3 h-3 text-red-400" />
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8 py-4">
      {/* Header Info */}
      <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
        <div className="p-2 bg-blue-600 rounded-lg">
          <ShieldCheck className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="text-sm font-black uppercase tracking-widest text-gray-900">Document Compliance</h3>
          <p className="text-xs text-gray-500 font-medium">Upload clear scans or photos for identity verification.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

      {/* Warning/Disclaimer */}
      <div className="p-4 bg-amber-50 rounded-xl border border-amber-100 flex items-start gap-3">
        <div className="mt-0.5">
          <FileUp className="w-4 h-4 text-amber-600" />
        </div>
        <p className="text-[11px] leading-relaxed text-amber-800 font-medium italic">
          Files must be under 5MB. Supported formats: PDF, PNG, JPEG. Ensure all text is legible to avoid manual rejection during audit.
        </p>
      </div>
    </div>
  );
};

export default DocumentUploadSection;