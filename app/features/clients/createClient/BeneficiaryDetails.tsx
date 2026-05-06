"use client";

import { useFormContext } from "@/app/context/FormContext";
import { Landmark } from "lucide-react";

const FieldError = ({ message }: { message?: string }) =>
  message ? (
    <p className="mt-1 ml-1 text-[10px] font-bold text-red-500 tracking-wide">{message}</p>
  ) : null;

const BeneficiaryDetails = () => {
  const { form } = useFormContext();
  const { register, watch, formState: { errors } } = form;

  const beneficiaryErrors = (errors.beneficiary as any) ?? {};
  const beneficiaryName = watch("beneficiary.fullName");
  const hasBeneficiary = !!beneficiaryName?.trim();

  const inputClass = (hasError?: boolean) =>
    `bg-background/50 border rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-primary focus:bg-background outline-none transition-all w-full placeholder:text-muted-foreground/30 font-medium ${
      hasError ? "border-red-400 focus:ring-red-400" : "border-border/50"
    }`;
  const labelClass = "text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 mb-2 ml-1 block";

  return (
    <div className="bg-card/60 backdrop-blur-xl rounded-[2.5rem] border border-border/50 shadow-sm overflow-hidden text-card-foreground">
      <div className="px-8 py-5 border-b border-border/30 flex items-center gap-3">
        <Landmark className="w-4 h-4 text-muted-foreground/60" />
        <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground opacity-60">
          Beneficiary Details
          <span className="ml-2 font-medium normal-case tracking-normal opacity-70">(optional)</span>
        </h2>
      </div>

      <div className="sm:p-6 p-4 space-y-6">
        <div>
          <label className={labelClass}>Full Name</label>
          <input
            type="text"
            {...register("beneficiary.fullName")}
            placeholder="Leave blank to skip"
            className={inputClass()}
          />
        </div>

        {hasBeneficiary && (
          <>
            <div className="grid grid-cols-2 gap-4">
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
                    !!val?.trim() || "Bank name is required when beneficiary is provided",
                })}
                className={inputClass(!!beneficiaryErrors?.bankName)}
              />
              <FieldError message={beneficiaryErrors?.bankName?.message} />
            </div>

            <div className="grid grid-cols-2 gap-4">
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
                      !!val?.trim() || "Account number is required when beneficiary is provided",
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
          </>
        )}
      </div>
    </div>
  );
};

export default BeneficiaryDetails;
