"use client";

import { useRef, useState } from "react";
import { useFormContext } from "@/app/context/FormContext";
import { Landmark, Check, UploadCloud, CheckCircle2, Eye } from "lucide-react";
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
      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 mb-2 ml-1 block">
        {label}
      </label>
      <div
        className="flex items-center gap-3 px-4 py-3 border border-dashed border-border/50 rounded-lg bg-background/50 cursor-pointer hover:bg-background transition-colors"
        onClick={() => inputRef.current?.click()}
      >
        {fileName ? (
          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
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
  beneficiaryPhotosRef: React.MutableRefObject<Record<string, File | null>>;
};

const BeneficiaryDetails = ({ lockedClient, beneficiaryPhotosRef }: Props) => {
  const { form } = useFormContext();
  const { register, watch, setValue, formState: { errors } } = form;

  const beneficiaryErrors = (errors.beneficiary as any) ?? {};
  const beneficiaryName = watch("beneficiary.fullName");
  const hasBeneficiary = !!beneficiaryName?.trim();

  const [selectedBeneficiaryId, setSelectedBeneficiaryId] = useState<number | null>(null);
  const [existingMode, setExistingMode] = useState<"pick" | "edit">("pick");

  const inputClass = (hasError?: boolean) =>
    `bg-background/50 border rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-primary focus:bg-background outline-none transition-all w-full placeholder:text-muted-foreground/30 font-medium ${
      hasError ? "border-red-400 focus:ring-red-400" : "border-border/50"
    }`;
  const labelClass =
    "text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 mb-2 ml-1 block";

  const handleSelectExisting = (b: any) => {
    setSelectedBeneficiaryId(b.id);
    setValue("beneficiary._existingId", b.id);
    setValue("beneficiary.fullName", b.fullName ?? "");
    setValue("beneficiary.nic", b.nic ?? "");
    setValue("beneficiary.phone", b.phone ?? "");
    setValue("beneficiary.bankName", b.bankName ?? "");
    setValue("beneficiary.bankBranch", b.bankBranch ?? "");
    setValue("beneficiary.accountNo", b.accountNo ?? "");
    setValue("beneficiary.relationship", b.relationship ?? "");
    // Clear any staged photos when switching records
    beneficiaryPhotosRef.current = { bankBookPhotoUrl: null, idCopyUrl: null };
    setExistingMode("edit");
  };

  const handleClearExisting = () => {
    setSelectedBeneficiaryId(null);
    setValue("beneficiary._existingId", undefined);
    setValue("beneficiary.fullName", "");
    setValue("beneficiary.nic", "");
    setValue("beneficiary.phone", "");
    setValue("beneficiary.bankName", "");
    setValue("beneficiary.bankBranch", "");
    setValue("beneficiary.accountNo", "");
    setValue("beneficiary.relationship", "");
    beneficiaryPhotosRef.current = { bankBookPhotoUrl: null, idCopyUrl: null };
    setExistingMode("pick");
  };

  const savedBeneficiaries: any[] = lockedClient?.beneficiaries ?? [];

  return (
    <div className="bg-card/60 backdrop-blur-xl rounded-xl border border-border/50 shadow-sm overflow-hidden text-card-foreground">
      <div className="px-8 py-5 border-b border-border/30 flex items-center gap-3">
        <Landmark className="w-4 h-4 text-muted-foreground/60" />
        <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground opacity-60">
          Beneficiary Details
          <span className="ml-2 font-medium normal-case tracking-normal opacity-70">
            (optional)
          </span>
        </h2>
      </div>

      <div className="sm:p-6 p-4 space-y-5">
        {/* ── Existing client: show saved beneficiaries to pick from ── */}
        {lockedClient && existingMode === "pick" && (
          <>
            {savedBeneficiaries.length > 0 ? (
              <div className="space-y-3">
                <p className={labelClass}>Select saved beneficiary</p>
                {savedBeneficiaries.map((b: any) => (
                  <div
                    key={b.id}
                    onClick={() => handleSelectExisting(b)}
                    className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all
                      ${selectedBeneficiaryId === b.id
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/40 hover:bg-muted/30"
                      }`}
                  >
                    <div>
                      <p className="text-sm font-black text-foreground">{b.fullName}</p>
                      <p className="text-[11px] text-muted-foreground font-bold uppercase tracking-tight mt-0.5">
                        {[b.relationship, b.bankName, b.accountNo]
                          .filter(Boolean)
                          .join(" • ")}
                      </p>
                    </div>
                    {selectedBeneficiaryId === b.id && (
                      <Check className="w-4 h-4 text-primary shrink-0" />
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground italic font-medium">
                No saved beneficiaries. Add a new one below.
              </p>
            )}

            <button
              type="button"
              onClick={() => setExistingMode("edit")}
              className="text-xs font-bold text-primary hover:underline"
            >
              + Add new beneficiary instead
            </button>
          </>
        )}

        {/* ── Existing client, edit mode ── */}
        {lockedClient && existingMode === "edit" && (
          <div className="space-y-4">
            {selectedBeneficiaryId && (
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-primary bg-primary/10 border border-primary/20 rounded-lg px-3 py-1">
                  Editing saved beneficiary
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
            {renderBeneficiaryFields()}
          </div>
        )}

        {/* ── New client: standard optional fields ── */}
        {!lockedClient && (
          <>
            <div>
              <label className={labelClass}>Full Name</label>
              <input
                type="text"
                {...register("beneficiary.fullName")}
                placeholder="Leave blank to skip"
                className={inputClass()}
              />
            </div>
            {hasBeneficiary && renderBeneficiaryFields()}
          </>
        )}
      </div>
    </div>
  );

  function renderBeneficiaryFields() {
    return (
      <div className="space-y-4">
        {lockedClient && (
          <div>
            <label className={labelClass}>Full Name</label>
            <input
              type="text"
              {...register("beneficiary.fullName")}
              placeholder="Leave blank to skip"
              className={inputClass()}
            />
          </div>
        )}

        <div className="grid sm:grid-cols-2 grid-cols-1 gap-4">
          <div>
            <label className={labelClass}>NIC</label>
            <input
              type="text"
              {...register("beneficiary.nic", {
                validate: (val) =>
                  !val ||
                  /^(\d{9}[VXvx]|\d{12})$/.test(val.trim()) ||
                  "NIC must be 9 digits + V/X or 12 digits",
              })}
              className={inputClass(!!beneficiaryErrors?.nic)}
            />
            <FieldError message={beneficiaryErrors?.nic?.message} />
          </div>
          <div>
            <label className={labelClass}>Phone</label>
            <input
              type="text"
              {...register("beneficiary.phone")}
              className={inputClass()}
            />
          </div>
        </div>

        <div>
          <label className={labelClass}>Bank Name *</label>
          <input
            type="text"
            {...register("beneficiary.bankName", {
              validate: (val) =>
                !!val?.trim() ||
                "Bank name is required when beneficiary is provided",
            })}
            className={inputClass(!!beneficiaryErrors?.bankName)}
          />
          <FieldError message={beneficiaryErrors?.bankName?.message} />
        </div>

        <div className="grid sm:grid-cols-2 grid-cols-1 gap-4">
          <div>
            <label className={labelClass}>Bank Branch</label>
            <input
              type="text"
              {...register("beneficiary.bankBranch")}
              className={inputClass()}
            />
          </div>
          <div>
            <label className={labelClass}>Account No *</label>
            <input
              type="text"
              {...register("beneficiary.accountNo", {
                validate: (val) =>
                  !!val?.trim() ||
                  "Account number is required when beneficiary is provided",
              })}
              className={inputClass(!!beneficiaryErrors?.accountNo)}
            />
            <FieldError message={beneficiaryErrors?.accountNo?.message} />
          </div>
        </div>

        <div>
          <label className={labelClass}>Relationship</label>
          <input
            type="text"
            {...register("beneficiary.relationship")}
            className={inputClass()}
          />
        </div>

        {/* ── Document uploads ── */}
        <div className="pt-3 border-t border-border/30 space-y-3">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">
            Documents
          </p>
          <div className="grid sm:grid-cols-2 grid-cols-1 gap-3">
            <PhotoField
              label="Bank Book Photo"
              fieldKey="bankBookPhotoUrl"
              photosRef={beneficiaryPhotosRef}
            />
            <PhotoField
              label="Beneficiary ID Copy"
              fieldKey="idCopyUrl"
              photosRef={beneficiaryPhotosRef}
            />
          </div>
        </div>
      </div>
    );
  }
};

export default BeneficiaryDetails;