"use client";

import { useFormContext } from "@/app/context/FormContext";
import { Users } from "lucide-react";

const FieldError = ({ message }: { message?: string }) =>
  message ? (
    <p className="mt-1 ml-1 text-[10px] font-bold text-red-500 tracking-wide">{message}</p>
  ) : null;

const NomineeDetails = () => {
  const { form } = useFormContext();
  const { register, watch, formState: { errors } } = form;

  const nomineeErrors = (errors.nominee as any) ?? {};
  const nomineeName = watch("nominee.fullName");
  const hasNominee = !!nomineeName?.trim();

  const inputClass = (hasError?: boolean) =>
    `bg-background/50 border rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-primary focus:bg-background outline-none transition-all w-full placeholder:text-muted-foreground/30 font-medium ${
      hasError ? "border-red-400 focus:ring-red-400" : "border-border/50"
    }`;
  const labelClass = "text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 mb-2 ml-1 block";

  return (
    <div className="bg-card/60 backdrop-blur-xl rounded-[2.5rem] border border-border/50 shadow-sm overflow-hidden text-card-foreground">
      <div className="px-8 py-5 border-b border-border/30 flex items-center gap-3">
        <Users className="w-4 h-4 text-muted-foreground/60" />
        <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground opacity-60">
          Nominee Details
          <span className="ml-2 font-medium normal-case tracking-normal opacity-70">(optional)</span>
        </h2>
      </div>

      <div className="sm:p-6 p-4 space-y-6">
        <div>
          <label className={labelClass}>Full Name</label>
          <input
            type="text"
            {...register("nominee.fullName")}
            placeholder="Leave blank to skip"
            className={inputClass()}
          />
        </div>

        {hasNominee && (
          <>
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
                    !!val?.trim() || "Permanent address is required when nominee is provided",
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
          </>
        )}
      </div>
    </div>
  );
};

export default NomineeDetails;
