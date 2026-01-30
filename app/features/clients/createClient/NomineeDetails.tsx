"use client";

import { useFormContext } from "@/app/context/FormContext";
import { Users } from "lucide-react";

const NomineeDetails = () => {
  const { form } = useFormContext();
  const { register } = form;

  const inputClass = "bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all w-full";
  const labelClass = "text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1 ml-1";

  return (
    <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-8 py-5 bg-gray-50/50 border-b border-gray-100 flex items-center gap-2">
        <Users className="w-4 h-4 text-purple-600" />
        <h2 className="text-xs font-black uppercase tracking-widest text-gray-800">Nominee Details</h2>
      </div>

      <div className="p-8 space-y-6">
        <div>
          <label className={labelClass}>Full Name</label>
          <input type="text" {...register("nominee.fullName")} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Permanent Address</label>
          <textarea rows={2} {...register("nominee.permanentAddress")} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Postal Address</label>
          <textarea rows={2} {...register("nominee.postalAddress")} className={inputClass} />
        </div>
      </div>
    </div>
  );
};

export default NomineeDetails;