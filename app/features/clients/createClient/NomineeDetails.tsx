"use client";

import { useRef, useState } from "react";
import { useFormContext } from "@/app/context/FormContext";
import { Users, Check, UploadCloud, CheckCircle2 } from "lucide-react";
import { LockedClient } from "@/app/types/client";

const FieldError = ({ message }: { message?: string }) =>
  message ? (
    <p className="mt-1 ml-1 text-[10px] font-bold text-red-500 tracking-wide">
      {message}
    </p>
  ) : null;

// ─── Photo upload widget ──────────────────────────────────────────────────────

function PhotoField({
  label,
  fieldKey,
  photosRef,
}: {
  label: string;
  fieldKey: string;
  photosRef: React.MutableRefObject<Record<string, File | null>>;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  const handleChange = (file: File | null) => {
    photosRef.current[fieldKey] = file;
    setFileName(file?.name ?? null);
  };

  return (
    <div>
      <label className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground mb-2 ml-1 block">
        {label}
      </label>
      <div
        className="flex items-center gap-3 px-4 py-3 border border-dashed border-border rounded-xl bg-muted/20 cursor-pointer hover:border-primary/40 hover:bg-primary/[0.03] transition-colors"
        onClick={() => inputRef.current?.click()}
      >
        {fileName ? (
          <CheckCircle2 className="w-4 h-4 text-purple-500 shrink-0" />
        ) : (
          <UploadCloud className="w-4 h-4 text-muted-foreground/40 shrink-0" />
        )}
        <span className="text-sm text-muted-foreground/50 truncate flex-1 font-medium">
          {fileName ?? "Click to upload (JPG, PNG, PDF)"}
        </span>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*,application/pdf"
        className="hidden"
        onChange={(e) => handleChange(e.target.files?.[0] ?? null)}
      />
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

type Props = {
  lockedClient: LockedClient | null;
  nomineePhotosRef: React.MutableRefObject<Record<string, File | null>>;
};

const NomineeDetails = ({ lockedClient, nomineePhotosRef }: Props) => {
  const { form } = useFormContext();
  const { register, watch, setValue, formState: { errors } } = form;

  const nomineeErrors = (errors.nominee as any) ?? {};
  const nomineeName = watch("nominee.fullName");
  const hasNominee = !!nomineeName?.trim();

  const [selectedNomineeId, setSelectedNomineeId] = useState<number | null>(null);
  const [existingMode, setExistingMode] = useState<"pick" | "edit">("pick");

  const inputClass = (hasError?: boolean) =>
    `bg-background/60 border rounded-xl px-4 py-3 text-sm focus:ring-4 focus:ring-primary/10 focus:border-primary/50 focus:bg-card outline-none transition-all w-full placeholder:text-muted-foreground/40 font-medium ${
      hasError ? "border-red-400 focus:ring-red-400" : "border-border/50"
    }`;
  const labelClass =
    "text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground mb-2 ml-1 block";

  const handleSelectExisting = (n: any) => {
    setSelectedNomineeId(n.id);
    setValue("nominee._existingId", n.id);
    setValue("nominee.fullName", n.fullName ?? "");
    setValue("nominee.nic", n.nic ?? "");
    setValue("nominee.permanentAddress", n.permanentAddress ?? "");
    setValue("nominee.postalAddress", n.postalAddress ?? "");
    // Clear staged photo when switching records
    nomineePhotosRef.current = { idCopyUrl: null };
    setExistingMode("edit");
  };

  const handleClearExisting = () => {
    setSelectedNomineeId(null);
    setValue("nominee._existingId", undefined);
    setValue("nominee.fullName", "");
    setValue("nominee.nic", "");
    setValue("nominee.permanentAddress", "");
    setValue("nominee.postalAddress", "");
    nomineePhotosRef.current = { idCopyUrl: null };
    setExistingMode("pick");
  };

  const savedNominees: any[] = lockedClient?.nominees ?? [];

  return (
    <div className="rounded-2xl border border-border/70 bg-card shadow-[0_10px_35px_rgba(34,43,72,0.05)] overflow-hidden text-card-foreground">
      <div className="flex items-center gap-3 border-b border-border/70 px-5 py-4 sm:px-6">
        <Users className="w-4 h-4 text-muted-foreground/60" />
        <h2 className="text-sm font-bold tracking-tight text-foreground">
          Nominee Details
          <span className="ml-2 font-medium normal-case tracking-normal opacity-70">
            (optional)
          </span>
        </h2>
      </div>

      <div className="space-y-5 p-5 sm:p-6">
        {/* ── Existing client: pick from saved nominees ── */}
        {lockedClient && existingMode === "pick" && (
          <>
            {savedNominees.length > 0 ? (
              <div className="space-y-3">
                <p className={labelClass}>Select saved nominee</p>
                {savedNominees.map((n: any) => (
                  <div
                    key={n.id}
                    onClick={() => handleSelectExisting(n)}
                    className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all
                      ${selectedNomineeId === n.id
                        ? "border-accent bg-accent/5"
                        : "border-border hover:border-accent/40 hover:bg-muted/30"
                      }`}
                  >
                    <div>
                      <p className="text-sm font-black text-foreground">{n.fullName}</p>
                      <p className="text-[11px] text-muted-foreground font-bold mt-0.5 truncate max-w-50">
                        {n.permanentAddress}
                      </p>
                    </div>
                    {selectedNomineeId === n.id && (
                      <Check className="w-4 h-4 text-accent shrink-0" />
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground italic font-medium">
                No saved nominees. Add a new one below.
              </p>
            )}
            <button
              type="button"
              onClick={() => setExistingMode("edit")}
              className="text-xs font-bold text-primary hover:underline"
            >
              + Add new nominee instead
            </button>
          </>
        )}

        {/* ── Existing client, edit mode ── */}
        {lockedClient && existingMode === "edit" && (
          <div className="space-y-4">
            {selectedNomineeId && (
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-accent bg-accent/10 border border-accent/20 rounded-lg px-3 py-1">
                  Editing saved nominee
                </span>
                <button
                  type="button"
                  onClick={handleClearExisting}
                  className="text-[11px] font-bold text-muted-foreground hover:text-destructive"
                >
                  Change
                </button>
              </div>
            )}
            {renderNomineeFields()}
          </div>
        )}

        {/* ── New client: standard optional fields ── */}
        {!lockedClient && (
          <>
            <div>
              <label className={labelClass}>Full Name</label>
              <input
                type="text"
                {...register("nominee.fullName")}
                placeholder="Leave blank to skip"
                className={inputClass()}
              />
            </div>
            {hasNominee && renderNomineeFields()}
          </>
        )}
      </div>
    </div>
  );

  function renderNomineeFields() {
    return (
      <div className="space-y-4">
        {lockedClient && (
          <div>
            <label className={labelClass}>Full Name</label>
            <input
              type="text"
              {...register("nominee.fullName")}
              placeholder="Leave blank to skip"
              className={inputClass()}
            />
          </div>
        )}

        <div>
          <label className={labelClass}>NIC</label>
          <input
            type="text"
            {...register("nominee.nic", {
              validate: (val) =>
                !val ||
                /^(\d{9}[VXvx]|\d{12})$/.test(val.trim()) ||
                "NIC must be 9 digits + V/X or 12 digits",
            })}
            className={inputClass(!!nomineeErrors?.nic)}
          />
          <FieldError message={nomineeErrors?.nic?.message} />
        </div>

        <div>
          <label className={labelClass}>Permanent Address *</label>
          <textarea
            rows={2}
            {...register("nominee.permanentAddress", {
              validate: (val) =>
                !!val?.trim() ||
                "Permanent address is required when nominee is provided",
            })}
            className={inputClass(!!nomineeErrors?.permanentAddress)}
          />
          <FieldError message={nomineeErrors?.permanentAddress?.message} />
        </div>

        <div>
          <label className={labelClass}>Postal Address</label>
          <textarea
            rows={2}
            {...register("nominee.postalAddress")}
            className={inputClass()}
          />
        </div>

        {/* ── Document upload ── */}
        <div className="pt-3 border-t border-border/30 space-y-3">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">
            Documents
          </p>
          <PhotoField
            label="Nominee ID Copy"
            fieldKey="idCopyUrl"
            photosRef={nomineePhotosRef}
          />
        </div>
      </div>
    );
  }
};

export default NomineeDetails;