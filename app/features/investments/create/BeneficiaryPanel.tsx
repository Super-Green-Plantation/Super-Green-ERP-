"use client";

import { useRef } from "react";
import { Pencil, Check, UploadCloud, CheckCircle2, Eye, Loader2 } from "lucide-react";
import { Field } from "./ui";
import { BeneficiaryFields, isEqual } from "./types";

// ─── Inline photo upload widget (no Supabase call here — page.tsx handles it) ──

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
          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
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

export default function BeneficiaryPanel({
  mode,
  client,
  selectedId,
  label,
  fields,
  originalFields,
  photoFiles,
  onSelect,
  onFieldChange,
  onPhotoFileChange,
  onClear,
}: {
  mode: "existing" | "new" | "none";
  client: any;
  selectedId: number | null;
  label: string | null;
  fields: BeneficiaryFields;
  originalFields: BeneficiaryFields | null;
  /** Files staged for upload — keyed by bankBookPhotoUrl / idCopyUrl */
  photoFiles: { bankBookPhotoUrl: File | null; idCopyUrl: File | null };
  onSelect: (b: any) => void;
  onFieldChange: (updater: (p: BeneficiaryFields) => BeneficiaryFields) => void;
  onPhotoFileChange: (key: "bankBookPhotoUrl" | "idCopyUrl", file: File | null) => void;
  onClear: () => void;
}) {
  return (
    <div className="space-y-5">
      {/* Card list (existing mode, no selection yet) */}
      {mode === "existing" && !label && (
        <div className="grid grid-cols-1 gap-3">
          {client?.beneficiaries?.length > 0 ? client.beneficiaries.map((b: any) => (
            <div
              key={b.id}
              onClick={() => onSelect(b)}
              className={`group flex items-center justify-between p-4 rounded-lg border-2 cursor-pointer transition-all
                ${selectedId === b.id
                  ? "border-primary bg-primary/5 ring-1 ring-primary"
                  : "border-border hover:border-primary/40 hover:bg-muted/30"
                }`}
            >
              <div>
                <p className={`text-sm font-black ${selectedId === b.id ? "text-primary" : "text-foreground"}`}>
                  {b.fullName}
                </p>
                <p className="text-[11px] text-muted-foreground font-bold uppercase tracking-tight mt-1">
                  {[b.relationship, b.bankName, b.accountNo].filter(Boolean).join(" • ")}
                </p>
              </div>
              {selectedId === b.id && (
                <div className="w-6 h-6 bg-primary rounded-lg flex items-center justify-center shadow-lg shadow-primary/20">
                  <Check className="w-3.5 h-3.5 text-primary-foreground" />
                </div>
              )}
            </div>
          )) : (
            <p className="text-sm text-muted-foreground italic font-medium">No saved beneficiaries found.</p>
          )}
        </div>
      )}

      {/* Edit fields */}
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
              <Field label="Relationship" value={fields.relationship} onChange={v => onFieldChange(p => ({ ...p, relationship: v }))} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Phone" value={fields.phone} onChange={v => onFieldChange(p => ({ ...p, phone: v }))} />
              <Field label="Bank Name" value={fields.bankName} onChange={v => onFieldChange(p => ({ ...p, bankName: v }))} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Bank Branch" value={fields.bankBranch} onChange={v => onFieldChange(p => ({ ...p, bankBranch: v }))} />
              <Field label="Account No." value={fields.accountNo} onChange={v => onFieldChange(p => ({ ...p, accountNo: v }))} />
            </div>

            {/* ── Document uploads ── */}
            <div className="pt-3 border-t border-border space-y-3">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Documents
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <PhotoField
                  label="Bank Book Photo"
                  file={photoFiles.bankBookPhotoUrl}
                  existingUrl={fields.bankBookPhotoUrl}
                  onFileChange={f => onPhotoFileChange("bankBookPhotoUrl", f)}
                />
                <PhotoField
                  label="Beneficiary ID Copy"
                  file={photoFiles.idCopyUrl}
                  existingUrl={fields.idCopyUrl}
                  onFileChange={f => onPhotoFileChange("idCopyUrl", f)}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}