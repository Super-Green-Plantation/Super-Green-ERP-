"use client";
import { getBranchById, getBranches } from "@/app/features/branches/actions";
import { Branch } from "@/app/types/branch";
import React, { useEffect, useState } from "react";

const BranchDetails = () => {
  const [branch, setBranch] = useState<Branch[] | null>(null);
  const [selectedBranchId, setSelectedBranchId] = useState<number | null>(null);
  const [branchDetails, setBranchDetails] = useState<Branch | null>(null);

  const fetchBranch = async () => {
    const braches = await getBranches();
    setBranch(braches as any);
  };

  useEffect(() => {
    if (!selectedBranchId) return;

    const fetchBranchDetails = async () => {
      const data = await getBranchById(selectedBranchId);
      setBranchDetails(data);
    };

    fetchBranchDetails();
  }, [selectedBranchId]);

  useEffect(() => {
    fetchBranch();
  }, []);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-6">
      {/* Branch Selection */}
      <div className="flex flex-col gap-2">
        <label className="text-[15px] font-semibold text-gray-700">
          Select Branch
        </label>
        <select 
          className="p-3.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-white transition cursor-pointer text-gray-600"
          onChange={(e) => setSelectedBranchId(Number(e.target.value))}
        >
          <option value="">Choose a branch...</option>
          {branch?.map((b) => (
            <option value={b.id} key={b.id}>
              {b.name}
            </option>
          ))}
        </select>
      </div>

      {/* Member Selection */}
      <div className="flex flex-col gap-2">
        <label className="text-[15px] font-semibold text-gray-700">
          Select Member
        </label>
        <select 
          className="p-3.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-white transition cursor-pointer text-gray-600"
          disabled={!branchDetails}
        >
          <option value="">
            {branchDetails ? "Choose a member..." : "Select a branch first"}
          </option>
          {branchDetails?.members.map((m, index) => (
            <option value={m.name} key={index}>
              {m.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default BranchDetails;