"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  X,
  FileText,
  CheckCircle2,
  CloudLightning,
  Loader2,
  UploadCloud,
  Eye,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  RotateCw,
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
  { id: "idFront",     label: "NIC / ID Front",   description: "Clear photo or scan of the front side" },
  { id: "idBack",      label: "NIC / ID Back",    description: "Clear photo or scan of the back side" },
  { id: "paymentSlip", label: "Payment Slip",      description: "Clear photo or scan of the Payment Slip" },
  { id: "proposal",    label: "Proposal Form",    description: "Signed digital or scanned copy" },
  { id: "agreement",   label: "Legal Agreement",  description: "Finalized & stamped document" },
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

// ─── Preview Lightbox ────────────────────────────────────────────────────────

interface PreviewEntry {
  id: string;
  label: string;
  file: File;
  objectUrl: string;
  isPDF: boolean;
}

interface PreviewLightboxProps {
  entries: PreviewEntry[];
  initialIndex: number;
  onClose: () => void;
}

const PreviewLightbox = ({ entries, initialIndex, onClose }: PreviewLightboxProps) => {
  const [index, setIndex] = useState(initialIndex);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);

  const current = entries[index];
  const hasPrev = index > 0;
  const hasNext = index < entries.length - 1;

  const goTo = (i: number) => {
    setIndex(i);
    setZoom(1);
    setRotation(0);
  };

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft" && hasPrev) goTo(index - 1);
      if (e.key === "ArrowRight" && hasNext) goTo(index + 1);
    },
    [index, hasPrev, hasNext, onClose]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  return (
    <div className="fixed inset-0 z-[200] flex flex-col bg-black/95 animate-in fade-in duration-150">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-white/10 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="p-1.5 bg-primary/20 rounded-lg shrink-0">
            <Eye size={14} className="text-primary" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">
              Document Preview
            </p>
            <p className="text-sm font-bold text-white truncate">{current.label}</p>
          </div>
        </div>

        <div className="flex items-center gap-1 sm:gap-2 shrink-0 ml-3">
          {!current.isPDF && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => setZoom((z) => Math.max(0.25, +(z - 0.25).toFixed(2)))}
                disabled={zoom <= 0.25}
                className="p-2 rounded-xl text-white/50 hover:text-white hover:bg-white/10 disabled:opacity-30 transition-colors"
              >
                <ZoomOut size={15} />
              </button>
              <span className="text-[11px] font-bold text-white/40 w-9 text-center hidden sm:block">
                {Math.round(zoom * 100)}%
              </span>
              <button
                onClick={() => setZoom((z) => Math.min(4, +(z + 0.25).toFixed(2)))}
                disabled={zoom >= 4}
                className="p-2 rounded-xl text-white/50 hover:text-white hover:bg-white/10 disabled:opacity-30 transition-colors"
              >
                <ZoomIn size={15} />
              </button>
              <button
                onClick={() => setRotation((r) => (r + 90) % 360)}
                className="p-2 rounded-xl text-white/50 hover:text-white hover:bg-white/10 transition-colors"
              >
                <RotateCw size={15} />
              </button>
            </div>
          )}
          <button
            onClick={onClose}
            className="p-2.5 hover:bg-white/10 rounded-xl text-white/50 hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Main preview area */}
      <div className="flex-1 overflow-auto flex items-center justify-center p-4 sm:p-6 relative">
        {hasPrev && (
          <button
            onClick={() => goTo(index - 1)}
            className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 p-2.5 sm:p-3 bg-white/10 hover:bg-white/20 rounded-2xl text-white transition-colors z-10"
          >
            <ChevronLeft size={18} />
          </button>
        )}

        {current.isPDF ? (
          <iframe
            src={`${current.objectUrl}#toolbar=0&navpanes=0`}
            className="w-full max-w-3xl rounded-2xl border border-white/10 shadow-2xl"
            style={{ height: "calc(100dvh - 220px)", minHeight: "300px" }}
            title={current.label}
          />
        ) : (
          <div className="overflow-auto max-w-full max-h-full flex items-center justify-center">
            <img
              src={current.objectUrl}
              alt={current.label}
              style={{
                transform: `scale(${zoom}) rotate(${rotation}deg)`,
                transition: "transform 0.2s ease",
                transformOrigin: "center center",
                maxWidth: "min(80vw, 900px)",
                maxHeight: "calc(100dvh - 220px)",
              }}
              className="rounded-xl shadow-2xl object-contain border border-white/10"
              draggable={false}
            />
          </div>
        )}

        {hasNext && (
          <button
            onClick={() => goTo(index + 1)}
            className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 p-2.5 sm:p-3 bg-white/10 hover:bg-white/20 rounded-2xl text-white transition-colors z-10"
          >
            <ChevronRight size={18} />
          </button>
        )}
      </div>

      {/* Thumbnail strip */}
      {entries.length > 1 && (
        <div className="shrink-0 px-4 sm:px-6 py-3 sm:py-4 border-t border-white/10 flex items-center gap-2 sm:gap-3 overflow-x-auto">
          {entries.map((entry, i) => (
            <button
              key={entry.id}
              onClick={() => goTo(i)}
              className={`shrink-0 flex flex-col items-center gap-1.5 transition-opacity ${
                i === index ? "opacity-100" : "opacity-40 hover:opacity-70"
              }`}
            >
              <div
                className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl overflow-hidden border-2 transition-colors ${
                  i === index ? "border-primary" : "border-white/20 hover:border-white/40"
                }`}
              >
                {entry.isPDF ? (
                  <div className="w-full h-full bg-white/10 flex items-center justify-center">
                    <FileText size={18} className="text-white/60" />
                  </div>
                ) : (
                  <img
                    src={entry.objectUrl}
                    alt={entry.label}
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
              <p className="text-[9px] font-bold uppercase tracking-widest text-white/50 max-w-[56px] truncate text-center">
                {entry.label}
              </p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── Main Modal ──────────────────────────────────────────────────────────────

const UpdateDocsModal = ({ isOpen, onClose, onSave }: UpdateDocsModalProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const [files, setFiles] = useState<Record<string, File | null>>({
    idFront: null,
    idBack: null,
    paymentSlip: null,
    proposal: null,
    agreement: null,
  });

  const [objectUrls, setObjectUrls] = useState<Record<string, string>>({});
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewIndex, setPreviewIndex] = useState(0);

  useEffect(() => {
    const next: Record<string, string> = {};
    for (const [key, file] of Object.entries(files)) {
      if (file) next[key] = URL.createObjectURL(file);
    }
    setObjectUrls((prev) => {
      for (const [key, url] of Object.entries(prev)) {
        if (!next[key]) URL.revokeObjectURL(url);
      }
      return next;
    });
    return () => {
      for (const url of Object.values(next)) URL.revokeObjectURL(url);
    };
  }, [files]);

  // Lock body scroll while modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const previewEntries: PreviewEntry[] = docTypes
    .filter((d) => files[d.id])
    .map((d) => ({
      id: d.id,
      label: d.label,
      file: files[d.id]!,
      objectUrl: objectUrls[d.id] ?? "",
      isPDF: files[d.id]!.type === "application/pdf",
    }));

  const openPreview = (docId: string) => {
    const idx = previewEntries.findIndex((e) => e.id === docId);
    if (idx === -1) return;
    setPreviewIndex(idx);
    setPreviewOpen(true);
  };

  const handleFileChange = (key: string, file: File | null) => {
    if (!file) {
      setFiles((prev) => ({ ...prev, [key]: null }));
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File is too large. Max limit is 10MB.");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.warning("File is slightly large (>2MB). A smaller file is recommended.");
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
        uploadedUrls[key] = file ? await uploadToSupabase(key, file) : null;
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
    <>
      {previewOpen && previewEntries.length > 0 && (
        <PreviewLightbox
          entries={previewEntries}
          initialIndex={previewIndex}
          onClose={() => setPreviewOpen(false)}
        />
      )}

      {/* Backdrop */}
      <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center sm:p-4">
        <div
          className="absolute inset-0 bg-background/80"
          onClick={onClose}
        />

        {/*
          Mobile:  slides up from bottom, full width, rounded top corners only,
                   max-h with internal scroll so it never overflows the viewport.
          Desktop: centered card, max-w-2xl, fully rounded.
        */}
        <div className="relative w-full sm:max-w-2xl bg-card sm:rounded-[2.5rem] rounded-t-[2rem] shadow-lg border border-border flex flex-col max-h-[92dvh] sm:max-h-[90dvh] animate-in fade-in slide-in-from-bottom-4 sm:zoom-in duration-200">

          {/* Header — fixed inside the card */}
          <div className="px-6 sm:px-8 pt-6 sm:pt-8 pb-4 sm:pb-6 flex items-center justify-between shrink-0">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="p-1.5 bg-primary/10 rounded-lg">
                  <CloudLightning size={16} className="text-primary" />
                </div>
                <h2 className="text-lg sm:text-xl font-bold text-foreground tracking-tighter">
                  Update KYC Vault
                </h2>
              </div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                Regulatory Compliance Overwrite
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-3 hover:bg-muted/80 rounded-2xl text-muted-foreground hover:text-foreground transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Scrollable body */}
          <div className="overflow-y-auto flex-1 px-6 sm:px-8 pb-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {docTypes.map((doc) => {
                const file = files[doc.id];
                const isPDF = file?.type === "application/pdf";
                const previewUrl = objectUrls[doc.id];

                return (
                  <div key={doc.id} className="group relative">
                    <label className="block mb-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">
                      {doc.label}
                    </label>

                    <div className="relative flex flex-col items-center justify-center p-5 border-2 border-dashed border-border rounded-2xl bg-muted/30 group-hover:bg-card group-hover:border-primary transition-all cursor-pointer min-h-[140px]">
                      {/* File input — full coverage, lowest interactive layer */}
                      <input
                        type="file"
                        accept="image/*,application/pdf"
                        className="absolute inset-0 opacity-0 cursor-pointer z-10"
                        onChange={(e) => handleFileChange(doc.id, e.target.files?.[0] || null)}
                      />

                      {file ? (
                        <div className="flex flex-col items-center gap-3 w-full">
                          {/* Thumbnail */}
                          {isPDF ? (
                            <div className="flex flex-col items-center gap-1">
                              <FileText className="w-10 h-10 text-primary" />
                              <p className="text-[10px] text-muted-foreground font-medium truncate max-w-[120px] text-center">
                                {file.name}
                              </p>
                            </div>
                          ) : (
                            <img
                              src={previewUrl}
                              alt="Preview"
                              className="w-20 h-20 object-cover rounded-lg border border-border shadow-sm"
                            />
                          )}

                          {/*
                            Action buttons:
                            - Row, centred, wraps if needed
                            - Both above the file input (z-20)
                            - Fixed height pills so they never collapse
                          */}
                          <div className="relative z-20 flex flex-row items-center justify-center gap-2 w-full flex-wrap">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                openPreview(doc.id);
                              }}
                              className="inline-flex items-center justify-center gap-1.5 h-7 px-3 bg-primary/10 text-primary hover:bg-primary/20 text-[10px] font-bold rounded-full border border-primary/20 transition-colors whitespace-nowrap"
                            >
                              <Eye size={10} />
                              Preview
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleFileChange(doc.id, null);
                              }}
                              className="inline-flex items-center justify-center h-7 px-3 bg-red-500/10 text-red-500 hover:bg-red-500/20 text-[10px] font-bold rounded-full border border-red-500/20 transition-colors whitespace-nowrap"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="w-10 h-10 rounded-xl bg-card shadow-sm border border-border flex items-center justify-center text-muted-foreground group-hover:text-primary transition-colors mb-2">
                            <UploadCloud size={18} />
                          </div>
                          <p className="text-[11px] font-bold text-muted-foreground">
                            Click to upload
                          </p>
                          <p className="text-[9px] text-muted-foreground mt-1 text-center">
                            {doc.description} · Max 10MB
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Warning */}
            <div className="mt-5 p-4 bg-orange-500/10 border border-orange-500/20 rounded-2xl flex gap-3">
              <div className="w-5 h-5 rounded-full bg-orange-500 text-white flex items-center justify-center shrink-0 mt-px">
                <span className="text-[10px] font-bold">!</span>
              </div>
              <p className="text-[11px] font-bold text-orange-500 leading-relaxed">
                Uploading new documents will replace the current files in the secure vault. This action is permanent.
              </p>
            </div>
          </div>

          {/* Footer — fixed inside the card */}
          <div className="px-6 sm:px-8 py-4 sm:py-6 bg-muted/30 border-t border-border flex items-center justify-end gap-3 shrink-0">
            <button
              onClick={onClose}
              className="px-5 py-3 text-[11px] font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors"
            >
              Cancel
            </button>
            <button
              disabled={isUploading}
              onClick={handleUpdate}
              className="flex items-center gap-2 px-6 sm:px-8 py-3 sm:py-3.5 bg-primary hover:opacity-90 disabled:opacity-50 text-primary-foreground rounded-2xl text-[11px] font-bold uppercase tracking-[0.15em] transition-all active:scale-95"
            >
              {isUploading ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Uploading...
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
    </>
  );
};

export default UpdateDocsModal;