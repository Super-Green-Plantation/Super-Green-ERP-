"use client";

import { useFormContext } from "@/app/context/FormContext";
import { Landmark } from "lucide-react";

const BeneficiaryDetails = () => {
  const { form } = useFormContext();
  const { register } = form;

  const inputClass = "bg-background/50 border border-border/50 rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary focus:bg-background outline-none transition-all w-full placeholder:text-muted-foreground/30 font-medium";
  const labelClass = "text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 mb-2 ml-1 block";

  return (
    <div className="bg-card/60 backdrop-blur-xl rounded-[2.5rem] border border-border/50 shadow-sm overflow-hidden text-card-foreground">
      <div className="px-8 py-5 border-b border-border/30">
        <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground opacity-60">Beneficiary Details</h2>
      </div>

      <div className="sm:p-6 p-4 space-y-6">
        <div>
          <label className={labelClass}>Full Name</label>
          <input type="text" {...register("beneficiary.fullName")} className={inputClass} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>NIC</label>
            <input type="text" {...register("beneficiary.nic")} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Phone</label>
            <input type="text" {...register("beneficiary.phone")} className={inputClass} />
          </div>
        </div>
        <div>
          <label className={labelClass}>Bank Name</label>
          <input type="text" {...register("beneficiary.bankName")} className={inputClass} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Bank Branch</label>
            <input type="text" {...register("beneficiary.bankBranch")} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Account No</label>
            <input type="text" {...register("beneficiary.accountNo")} className={inputClass} />
          </div>
        </div>
        <div>
          <label className={labelClass}>Relationship</label>
          <input type="text" {...register("beneficiary.relationship")} className={inputClass} />
        </div>
      </div>
    </div>
  );
};

export default BeneficiaryDetails;
