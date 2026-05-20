"use client";

import { useState } from "react";
import { useFormContext } from "@/app/context/FormContext";
import { Users, Check } from "lucide-react";
import { LockedClient } from "@/app/types/client";

const FieldError = ({ message }: { message?: string }) =>
  message ? (
    <p className="mt-1 ml-1 text-[10px] font-bold text-red-500 tracking-wide">
      {message}
    </p>
  ) : null;

type Props = { lockedClient: LockedClient | null };

const NomineeDetails = ({ lockedClient }: Props) => {
  const { form } = useFormContext();
  const { register, watch, setValue, formState: { errors } } = form;

  const nomineeErrors = (errors.nominee as any) ?? {};
  const nomineeName = watch("nominee.fullName");
  const hasNominee = !!nomineeName?.trim();

  const [selectedNomineeId, setSelectedNomineeId] = useState<number | null>(null);
  const [existingMode, setExistingMode] = useState<"pick" | "edit">("pick");

  const inputClass = (hasError?: boolean) =>
    `bg-background/50 border rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-primary focus:bg-background outline-none transition-all w-full placeholder:text-muted-foreground/30 font-medium ${
      hasError ? "border-red-400 focus:ring-red-400" : "border-border/50"
    }`;
  const labelClass =
    "text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 mb-2 ml-1 block";

  const handleSelectExisting = (n: any) => {
    setSelectedNomineeId(n.id);
    setValue("nominee._existingId", n.id);
    setValue("nominee.fullName", n.fullName ?? "");
    setValue("nominee.nic", n.nic ?? "");
    setValue("nominee.permanentAddress", n.permanentAddress ?? "");
    setValue("nominee.postalAddress", n.postalAddress ?? "");
    setExistingMode("edit");
  };

  const handleClearExisting = () => {
    setSelectedNomineeId(null);
    setValue("nominee._existingId", undefined);
    setValue("nominee.fullName", "");
    setValue("nominee.nic", "");
    setValue("nominee.permanentAddress", "");
    setValue("nominee.postalAddress", "");
    setExistingMode("pick");
  };

  const savedNominees: any[] = lockedClient?.nominees ?? [];

  return (
    <div className="bg-card/60 backdrop-blur-xl rounded-[2.5rem] border border-border/50 shadow-sm overflow-hidden text-card-foreground">
      <div className="px-8 py-5 border-b border-border/30 flex items-center gap-3">
        <Users className="w-4 h-4 text-muted-foreground/60" />
        <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground opacity-60">
          Nominee Details
          <span className="ml-2 font-medium normal-case tracking-normal opacity-70">
            (optional)
          </span>
        </h2>
      </div>

      <div className="sm:p-6 p-4 space-y-5">
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
      </div>
    );
  }
};

export default NomineeDetails;