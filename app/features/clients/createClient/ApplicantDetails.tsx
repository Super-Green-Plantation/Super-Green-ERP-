"use client";

import { useFormContext } from "@/app/context/FormContext";
import { getBranchDetails, getBranches } from "@/app/services/branches.service";
import { getPlans } from "@/app/services/plans.service";
import { Branch } from "@/app/types/branch";
import { FinancialPlan } from "@/app/types/FinancialPlan";
import { useEffect, useState } from "react";

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

  return (
    <div className="max-w-4xl mx-auto p-8 bg-white shadow-lg rounded-xl border border-gray-100 mt-10 pb-15">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 border-b pb-2">
        Applicant Details
      </h2>

      <form className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="md:col-span-2 flex flex-col gap-1">
          <label>Full Name</label>
          <input
            type="text"
            {...register("applicant.fullName")}
            placeholder="Enter full name"
            className="p-2.5 border rounded-lg"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label>NIC</label>
          <input
            type="text"
            {...register("applicant.nic")}
            placeholder="NIC"
            className="p-2.5 border rounded-lg"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label>Driving License</label>
          <input
            type="text"
            {...register("applicant.drivingLicense")}
            placeholder="Driving License"
            className="p-2.5 border rounded-lg"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label>Passport No</label>
          <input
            type="text"
            {...register("applicant.passportNo")}
            placeholder="Passport No"
            className="p-2.5 border rounded-lg"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label>Email</label>
          <input
            type="email"
            {...register("applicant.email")}
            placeholder="Email"
            className="p-2.5 border rounded-lg"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label>Mobile Phone</label>
          <input
            type="text"
            {...register("applicant.phoneMobile")}
            placeholder="Mobile"
            className="p-2.5 border rounded-lg"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label>Land Phone</label>
          <input
            type="text"
            {...register("applicant.phoneLand")}
            placeholder="Landline"
            className="p-2.5 border rounded-lg"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label>Date of Birth</label>
          <input
            type="date"
            {...register("applicant.dateOfBirth")}
            className="p-2.5 border rounded-lg"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label>Occupation</label>
          <input
            type="text"
            {...register("applicant.occupation")}
            placeholder="Occupation"
            className="p-2.5 border rounded-lg"
          />
        </div>
        
          <div className="md:col-span-2 flex flex-col gap-1">
            <label>Address</label>
            <input
              type="text"
              {...register("applicant.address")}
              placeholder="Full Address"
              className="p-2.5 border rounded-lg"
            />
          </div>
          <div className="md:col-span-2 flex flex-col gap-1">
            <label>Investment Amount</label>
            <input
              type="text"
              {...register("applicant.investmentAmount")}
              placeholder="50,000"
              className="p-2.5 border rounded-lg"
            />
          </div>


        <div className="md:col-span-2 flex flex-col gap-1">
          <label className="text-[15px] font-semibold text-gray-700">
            Select Branch
          </label>
          <select
            className="p-2.5 border rounded-lg"
            {...register("applicant.branchId", { valueAsNumber: true })}
          >
            <option value="">Choose a branch...</option>
            {branch?.map((b) => (
              <option value={b.id} key={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>

        <div className="md:col-span-2 flex flex-col gap-1">
          <label className="text-[15px] font-semibold text-gray-700">
            Select Plan
          </label>
          <select
            className="p-2.5 border rounded-lg"
            {...register("investment.planId", { valueAsNumber: true })}
          >
            <option value="">Choose a Plan...</option>
            {plans?.map((b) => (
              <option value={b.id} key={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>
      </form>
    </div>
  );
};

export default ApplicantDetails;
