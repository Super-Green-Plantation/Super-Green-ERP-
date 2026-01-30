"use client";

import SignaturePad from "@/app/components/SignaturePad";
import { useFormContext } from "@/app/context/FormContext";
import { getBranchDetails, getBranches } from "@/app/services/branches.service";
import { getPlans } from "@/app/services/plans.service";
import { Branch } from "@/app/types/branch";
import { FinancialPlan } from "@/app/types/FinancialPlan";
import { useEffect, useState } from "react";
import { User } from "lucide-react";

const ApplicantDetails = () => {
  const { form } = useFormContext();
  const { register } = form;

  const [branch, setBranch] = useState<Branch[] | null>(null);
  const [selectedBranchId, setSelectedBranchId] = useState<number | null>(null);
  const [branchDetails, setBranchDetails] = useState<Branch | null>(null);
  const [plans, setPlans] = useState<FinancialPlan[] | null>([]);

  const fetchBranch = async () => {
    const braches = await getBranches();
    setBranch(braches.res);
  };

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const plans = await getPlans();
        setPlans(plans);
      } catch (err) {
        console.error(err);
      }
    };
    fetchPlans();
  }, []);

  useEffect(() => {
    if (!selectedBranchId) return;
    const fetchBranchDetails = async () => {
      const data = await getBranchDetails(selectedBranchId);
      setBranchDetails(data);
    };
    fetchBranchDetails();
  }, [selectedBranchId]);

  useEffect(() => {
    fetchBranch();
  }, []);

  const inputClass = "bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all w-full";
  const labelClass = "text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1 ml-1";

  return (
    <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-8 py-5 bg-gray-50/50 border-b border-gray-100 flex items-center gap-2">
        <User className="w-4 h-4 text-blue-600" />
        <h2 className="text-xs font-black uppercase tracking-widest text-gray-800">Primary Applicant Information</h2>
      </div>

      <div className="p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <label className={labelClass}>Full Name</label>
            <input type="text" {...register("applicant.fullName")} placeholder="Legal name as per NIC" className={inputClass} />
          </div>
          
          <div>
            <label className={labelClass}>NIC Number</label>
            <input type="text" {...register("applicant.nic")} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Driving License</label>
            <input type="text" {...register("applicant.drivingLicense")} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Passport No</label>
            <input type="text" {...register("applicant.passportNo")} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Email Address</label>
            <input type="email" {...register("applicant.email")} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Mobile Phone</label>
            <input type="text" {...register("applicant.phoneMobile")} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Land Phone</label>
            <input type="text" {...register("applicant.phoneLand")} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Date of Birth</label>
            <input type="date" {...register("applicant.dateOfBirth")} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Occupation</label>
            <input type="text" {...register("applicant.occupation")} className={inputClass} />
          </div>
          
          <div className="md:col-span-2">
            <label className={labelClass}>Full Residential Address</label>
            <input type="text" {...register("applicant.address")} className={inputClass} />
          </div>

          <div className="md:col-span-2 p-6 bg-blue-50/50 rounded-2xl border border-blue-100 space-y-4">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-blue-600">Financial Selection</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className={labelClass}>Investment Amount (LKR)</label>
                <input type="text" {...register("applicant.investmentAmount")} placeholder="0.00" className={`${inputClass} font-bold text-blue-700`} />
              </div>
              <div>
                <label className={labelClass}>Target Plan</label>
                <select className={inputClass} {...register("investment.planId", { valueAsNumber: true })}>
                  <option value="">Choose a Plan...</option>
                  {plans?.map((b) => <option value={b.id} key={b.id}>{b.name}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className={labelClass}>Assigned Branch</label>
              <select className={inputClass} {...register("applicant.branchId", { valueAsNumber: true })}>
                <option value="">Choose a branch...</option>
                {branch?.map((b) => <option value={b.id} key={b.id}>{b.name}</option>)}
              </select>
            </div>
          </div>
          
          <div className="md:col-span-2 pt-4">
            <label className={labelClass}>E-Signature</label>
            <SignaturePad />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApplicantDetails;