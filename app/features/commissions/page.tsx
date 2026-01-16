"use client";
import { getBranchDetails, getBranches } from "@/app/services/branches.service";
import { Branch } from "@/app/types/branch";
import { Member } from "@/app/types/member";
import { useEffect, useState } from "react";

const Page = () => {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<number | null>(null);
  const [branch, setBranch] = useState<Branch | null>(null);

  const getBranch = async () => {
    const data = await getBranches();
    setBranches(data.res);
  };

  useEffect(() => {
    getBranch();
  }, []);

  useEffect(() => {
    if (!selectedBranchId) return;

    const fetchBranchDetails = async () => {
      const data = await getBranchDetails(selectedBranchId);
      setBranch(data);
    };

    fetchBranchDetails();
  }, [selectedBranchId]);

  return (
    <div className="p-6">
      {/* Page Title */}
      <h1 className="text-2xl font-semibold mb-6">Commissions</h1>

      {/* Branch Selector */}
      <div className="mb-6">
        <label className="block mb-2 text-sm font-medium text-gray-700">
          Select Branch
        </label>
        <select
          className="w-full max-w-sm rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          onChange={(e) => setSelectedBranchId(Number(e.target.value))}
        >
          <option value="">Select a branch</option>
          {branches.map((b) => (
            <option value={b.id} key={b.id}>
              {b.name}
            </option>
          ))}
        </select>
      </div>

      {/* Members */}
      <div className="space-y-4">
        {/* No branch selected */}
        {!branch && (
          <p className="text-sm text-gray-500">
            Select a branch to view commission details.
          </p>
        )}

        {/* Branch selected but no members */}
        {branch && branch.members.length === 0 && (
          <p className="text-sm text-gray-500">No members in this branch.</p>
        )}

        {/* Members list */}
        {branch?.members.map((m: Member) => (
          <div
            key={m.id}
            className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Position */}
              <div>
                <p className="text-xs text-gray-500">Position</p>
                <h2 className="text-lg font-semibold text-gray-800">
                  {m.position.title}
                </h2>
              </div>

              {/* Name */}
              <div>
                <p className="text-xs text-gray-500">Employee</p>
                <h2 className="text-lg font-semibold text-gray-800">
                  {m.name}
                </h2>
              </div>

              {/* Commission Rate */}
              <div>
                <p className="text-xs text-gray-500">Commission Rate</p>
                <h2 className="text-lg font-semibold text-gray-800">
                  {m.position.commissionRate?.rate ?? "-"}%
                </h2>
              </div>

              {/* Total Commission */}
              <div>
                <p className="text-xs text-gray-500">Total Commission</p>
                <h2 className="text-lg font-semibold text-gray-800">
                  Rs. {m.totalCommission ?? "-"} /-
                </h2>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Page;
