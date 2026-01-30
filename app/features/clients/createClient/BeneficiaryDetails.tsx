"use client";

import { useFormContext } from "@/app/context/FormContext";
import { Landmark } from "lucide-react";

const BeneficiaryDetails = () => {
  const { form } = useFormContext();
  const { register } = form;

  const inputClass = "bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all w-full";
  const labelClass = "text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1 ml-1";

  return (
    <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-8 py-5 bg-gray-50/50 border-b border-gray-100 flex items-center gap-2">
        <Landmark className="w-4 h-4 text-emerald-600" />
        <h2 className="text-xs font-black uppercase tracking-widest text-gray-800">Beneficiary Details</h2>
      </div>

      <div className="p-8 space-y-6">
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