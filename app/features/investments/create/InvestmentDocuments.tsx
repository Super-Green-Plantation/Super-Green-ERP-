"use client";

import { ShieldCheck, FileText, UploadCloud, X } from "lucide-react";

export default function InvestmentDocuments({
  files,
  previews,
  onChange,
}: {
  files: Record<string, File | null>;
  previews: Record<string, string | null>;
  onChange: (key: string, file: File | null) => void;
}) {
  const readyCount = Object.values(files).filter(Boolean).length;

  return (
    <section className="w-full">
      <div className="bg-card border border-border rounded-xl p-6 shadow-sm flex flex-col gap-5">
        {/* Section header */}
        <div className="flex items-center gap-3 border-b border-border pb-4">
          <div className="w-10 h-10 bg-blue-50 dark:bg-blue-950/50 rounded-xl flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold uppercase tracking-widest text-foreground">
              Investment Documents
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Upload supporting documents for this investment (optional).
            </p>
          </div>
          {readyCount > 0 && (
            <span className="ml-auto bg-blue-600 text-white px-3 py-1 rounded-xl text-xs font-bold tracking-wider shrink-0">
              {readyCount} READY
            </span>
          )}
        </div>

        {/* Upload cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {([
            { id: "paymentSlip", label: "Pay Slip", description: "Recent salary slip" },
            { id: "proposal", label: "Proposal Form", description: "Signed proposal copy" },
            { id: "agreement", label: "Agreement Contract", description: "Binding signature" },
          ] as const).map(({ id, label, description }) => {
            const isSelected = !!files[id];
            const previewUrl = previews[id];
            const isPDF = files[id]?.type === "application/pdf";
            return (
              <div
                key={id}
                className="relative group rounded-2xl border-2 border-dashed border-gray-200 dark:border-zinc-800 min-h-[110px] md:h-44 overflow-hidden bg-gray-50/50 dark:bg-zinc-900/30 hover:bg-gray-100/70 dark:hover:bg-zinc-900/60 hover:border-blue-400 dark:hover:border-blue-500 transition-all duration-300 flex items-center justify-center shadow-sm"
              >
                <input
                  type="file"
                  id={`inv-doc-${id}`}
                  accept="image/*,application/pdf"
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  onChange={e => onChange(id, e.target.files?.[0] || null)}
                />

                {/* Remove button */}
                {isSelected && (
                  <button
                    type="button"
                    onClick={e => { e.stopPropagation(); onChange(id, null); }}
                    title="Remove file"
                    className="absolute top-3 right-3 z-20 pointer-events-auto p-1.5 bg-red-500 text-white rounded-xl shadow-md hover:bg-red-600 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}

                {/* Preview */}
                {isSelected && previewUrl && (
                  <div className="absolute inset-0 z-0 w-full h-full">
                    {isPDF ? (
                      <div className="flex flex-col items-center justify-center h-full bg-slate-100 dark:bg-zinc-800 gap-2 p-4">
                        <FileText className="w-10 h-10 text-slate-500" />
                        <p className="text-xs text-slate-600 dark:text-zinc-400 font-medium truncate max-w-full text-center px-2">
                          {files[id]?.name}
                        </p>
                      </div>
                    ) : (
                      <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                    )}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-10">
                      <div className="flex flex-col items-center text-white scale-90 group-hover:scale-100 transition-transform">
                        <UploadCloud className="w-6 h-6 mb-1" />
                        <span className="text-xs font-semibold uppercase tracking-wider">Replace</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Idle placeholder */}
                {!isSelected && (
                  <div className="p-4 w-full flex md:flex-col items-center md:justify-center gap-3 md:gap-2 text-left md:text-center h-full">
                    <div className="p-3 bg-white dark:bg-zinc-800 shadow-sm group-hover:bg-blue-50 dark:group-hover:bg-blue-950/40 rounded-xl transition-colors shrink-0 group-hover:scale-105 duration-300">
                      <UploadCloud className="w-5 h-5 text-gray-400 group-hover:text-blue-500" />
                    </div>
                    <div className="min-w-0 flex-1 md:flex-none">
                      <p className="text-sm font-bold text-gray-900 dark:text-zinc-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {label}
                      </p>
                      <p className="text-[11px] text-gray-400 dark:text-zinc-500 font-medium mt-0.5">
                        {description}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Payload limit note */}
        <div className="flex items-center gap-2 text-xs text-amber-700 dark:text-amber-400 bg-amber-50/60 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30 rounded-xl px-4 py-2.5">
          <UploadCloud className="w-4 h-4 shrink-0" />
          <span>Payload limit: <strong>1 MB per file</strong>. Accepts images &amp; PDF.</span>
        </div>
      </div>
    </section>
  );
}
