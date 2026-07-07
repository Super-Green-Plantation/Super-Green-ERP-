"use client";

import { Pencil, Check } from "lucide-react";
import { Field } from "./ui";
import { isEqual, NomineeFields } from "./types";

export default function NomineePanel({
  mode,
  client,
  selectedId,
  label,
  fields,
  originalFields,
  onSelect,
  onFieldChange,
  onClear,
}: {
  mode: "existing" | "new" | "none";
  client: any;
  selectedId: number | null;
  label: string | null;
  fields: NomineeFields;
  originalFields: NomineeFields | null;
  onSelect: (n: any) => void;
  onFieldChange: (updater: (p: NomineeFields) => NomineeFields) => void;
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
                <Pencil className="w-[18px] h-[18px] text-primary" />
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
                className="w-full px-3 py-2.5 text-sm font-semibold bg-card border border-border rounded-md outline-none focus:border-[#0f5132] focus:ring-1 focus:ring-[#0f5132] transition-all resize-y min-h-[80px]"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Postal Address</label>
              <textarea
                value={fields.postalAddress}
                onChange={e => onFieldChange(p => ({ ...p, postalAddress: e.target.value }))}
                className="w-full px-3 py-2.5 text-sm font-semibold bg-card border border-border rounded-md outline-none focus:border-[#0f5132] focus:ring-1 focus:ring-[#0f5132] transition-all resize-y min-h-[80px]"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
