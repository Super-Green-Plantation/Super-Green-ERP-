"use client";

import { useRef } from "react";
import { Pencil, Check, UploadCloud, CheckCircle2, Eye } from "lucide-react";
import { Field } from "./ui";
import { isEqual, NomineeFields } from "./types";

// ─── Inline photo upload widget ───────────────────────────────────────────────

function PhotoField({
  label,
  file,
  existingUrl,
  onFileChange,
}: {
  label: string;
  file: File | null;
  existingUrl: string | null;
  onFileChange: (file: File | null) => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const previewUrl = file ? URL.createObjectURL(file) : existingUrl;

  return (
    <div>
      <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
        {label}
      </label>
      <div
        className="flex items-center gap-3 px-3 py-2.5 border border-dashed border-border rounded-md bg-card cursor-pointer hover:bg-muted/30 transition-colors"
        onClick={() => ref.current?.click()}
      >
        {previewUrl ? (
          <CheckCircle2 className="w-4 h-4 text-purple-500 shrink-0" />
        ) : (
          <UploadCloud className="w-4 h-4 text-muted-foreground shrink-0" />
        )}
        <span className="text-xs text-muted-foreground truncate flex-1">
          {file ? file.name : existingUrl ? "Uploaded — click to replace" : "Click to upload (JPG, PNG, PDF)"}
        </span>
        {previewUrl && (
          <a
            href={previewUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={e => e.stopPropagation()}
            className="p-1 hover:bg-muted rounded transition-colors shrink-0"
          >
            <Eye className="w-3.5 h-3.5 text-muted-foreground" />
          </a>
        )}
      </div>
      <input
        ref={ref}
        type="file"
        accept="image/*,application/pdf"
        className="hidden"
        onChange={e => onFileChange(e.target.files?.[0] ?? null)}
      />
    </div>
  );
}

// ─── Main panel ──────────────────────────────────────────────────────────────

export default function NomineePanel({
  mode,
  client,
  selectedId,
  label,
  fields,
  originalFields,
  idCopyFile,
  onSelect,
  onFieldChange,
  onIdCopyFileChange,
  onClear,
}: {
  mode: "existing" | "new" | "none";
  client: any;
  selectedId: number | null;
  label: string | null;
  fields: NomineeFields;
  originalFields: NomineeFields | null;
  /** Staged file for the nominee ID copy */
  idCopyFile: File | null;
  onSelect: (n: any) => void;
  onFieldChange: (updater: (p: NomineeFields) => NomineeFields) => void;
  onIdCopyFileChange: (file: File | null) => void;
  onClear: () => void;
}) {
  return (
    <div className="space-y-5">
      {mode === "existing" && !label && (
        <div className="grid grid-cols-1 gap-3">
          {client?.nominees?.length > 0 ? client.nominees.map((n: any) => (
            <div
              key={n.id}
              onClick={() => onSelect(n)}
              className={`flex items-center justify-between p-4 rounded-lg border-2 cursor-pointer transition-all
                ${selectedId === n.id
                  ? "border-accent bg-accent/5 ring-1 ring-accent"
                  : "border-border hover:border-accent/40 hover:bg-muted/30"
                }`}
            >
              <div>
                <p className={`text-sm font-black ${selectedId === n.id ? "text-accent" : "text-foreground"}`}>
                  {n.fullName}
                </p>
                <p className="text-[11px] text-muted-foreground font-bold mt-1 uppercase tracking-tighter">
                  {n.permanentAddress}
                </p>
              </div>
              {selectedId === n.id && (
                <div className="w-6 h-6 bg-accent rounded-lg flex items-center justify-center shadow-lg shadow-accent/20">
                  <Check className="w-3.5 h-3.5 text-accent-foreground" />
                </div>
              )}
            </div>
          )) : (
            <p className="text-sm text-muted-foreground italic font-medium">No saved nominees found.</p>
          )}
        </div>
      )}

      {(mode === "new" || (mode === "existing" && label)) && (
        <div className="space-y-4">
          {label && (
            <div className="p-3 bg-muted/30 rounded-lg border border-primary/20 flex justify-between items-center mb-2">
              <div className="flex items-center gap-2">
                <Pencil className="w-4.5 h-4.5 text-primary" />
                <span className="text-[11px] font-bold text-foreground">
                  Editing: <span className="uppercase">{label}</span>
                </span>
                {originalFields && !isEqual(fields, originalFields) && (
                  <span className="ml-2 inline-flex items-center px-2 py-0.5 bg-amber-100 text-amber-800 border border-amber-300 rounded text-[10px] font-bold">
                    MODIFIED
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={onClear}
                className="text-primary text-[10px] font-bold underline uppercase"
              >
                Change
              </button>
            </div>
          )}

          <div className="space-y-4 pt-2">
            <div className="sm:col-span-2">
              <Field label="Full Name" value={fields.fullName}
                onChange={v => onFieldChange(p => ({ ...p, fullName: v }))} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="NIC" value={fields.nic} onChange={v => onFieldChange(p => ({ ...p, nic: v }))} />
              <Field label="Contact No." value={fields.contact} onChange={v => onFieldChange(p => ({ ...p, contact: v }))} />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Permanent Address</label>
              <textarea
                value={fields.permanentAddress}
                onChange={e => onFieldChange(p => ({ ...p, permanentAddress: e.target.value }))}
                className="w-full px-3 py-2.5 text-sm font-semibold bg-card border border-border rounded-md outline-none focus:border-[#0f5132] focus:ring-1 focus:ring-[#0f5132] transition-all resize-y min-h-20"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Postal Address</label>
              <textarea
                value={fields.postalAddress}
                onChange={e => onFieldChange(p => ({ ...p, postalAddress: e.target.value }))}
                className="w-full px-3 py-2.5 text-sm font-semibold bg-card border border-border rounded-md outline-none focus:border-[#0f5132] focus:ring-1 focus:ring-[#0f5132] transition-all resize-y min-h-20"
              />
            </div>

            {/* ── Document upload ── */}
            <div className="pt-3 border-t border-border space-y-3">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Documents
              </p>
              <PhotoField
                label="Nominee ID Copy"
                file={idCopyFile}
                existingUrl={fields.idCopyUrl}
                onFileChange={onIdCopyFileChange}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}