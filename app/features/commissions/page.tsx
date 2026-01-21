"use client";

import { getBranchDetails, getBranches } from "@/app/services/branches.service";
import {
  getClientDetails,
  getClientsByBranch,
} from "@/app/services/clients.service";
import { getEligibleMembers } from "@/app/services/member.service";
import { getPlansByClient } from "@/app/services/plans.service";

import { Branch } from "@/app/types/branch";
import { Client } from "@/app/types/client";
import { FinancialPlan } from "@/app/types/FinancialPlan";
import { Member } from "@/app/types/member";

import { useEffect, useState } from "react";

const Page = () => {
  /* ---------------- State ---------------- */
  const [branches, setBranches] = useState<Branch[]>([]);
  const [branch, setBranch] = useState<Branch | null>(null);

  const [clients, setClients] = useState<Client[]>([]);
  const [client, setClient] = useState<Client | null>(null);

  const [plans, setPlans] = useState<FinancialPlan[]>([]);

  const [selectedBranchId, setSelectedBranchId] = useState<number | null>(null);
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null);
  const [selectedEmpNo, setSelectedEmpNo] = useState<string>("");

  const [eligibleMembers, setEligibleMembers] = useState<Member[]>([]);
  const [loadingEligible, setLoadingEligible] = useState(false);

  /* ---------------- Load branches ---------------- */
  useEffect(() => {
    const loadBranches = async () => {
      const data = await getBranches();
      setBranches(data.res);
    };
    loadBranches();
  }, []);

  /* ---------------- Load branch details ---------------- */
  useEffect(() => {
    if (!selectedBranchId) {
      setBranch(null);
      setSelectedEmpNo("");
      return;
    }

    const loadBranch = async () => {
      const data = await getBranchDetails(selectedBranchId);
      setBranch(data);
    };

    loadBranch();
  }, [selectedBranchId]);

  /* ---------------- Load clients by branch ---------------- */
  useEffect(() => {
    if (!selectedBranchId) {
      setClients([]);
      return;
    }

    const loadClients = async () => {
      const data = await getClientsByBranch(selectedBranchId);
      setClients(data.clients);
    };

    loadClients();
  }, [selectedBranchId]);

  /* ---------------- Load client details ---------------- */
  useEffect(() => {
    if (!selectedClientId) {
      setClient(null);
      setPlans([]);
      return;
    }

    const loadClient = async () => {
      const data = await getClientDetails(selectedClientId);
      setClient(data);
    };

    loadClient();
  }, [selectedClientId]);

  /* ---------------- Load plans by client ---------------- */
  useEffect(() => {
    if (!selectedClientId) return;

    const loadPlans = async () => {
      const data = await getPlansByClient(selectedClientId);
      setPlans(data);
    };

    loadPlans();
  }, [selectedClientId]);

  /* ---------------- Load eligible members ---------------- */
  useEffect(() => {
    const loadEligibleMembers = async () => {
      if (!selectedEmpNo || !selectedBranchId) {
        setEligibleMembers([]);
        return;
      }

      try {
        setLoadingEligible(true);
        const data = await getEligibleMembers(selectedEmpNo, selectedBranchId);
        setEligibleMembers(data.eligibleMembers);
      } catch (error) {
        console.error(error);
        setEligibleMembers([]);
      } finally {
        setLoadingEligible(false);
      }
    };

    loadEligibleMembers();
  }, [selectedEmpNo, selectedBranchId]);

  /* ---------------- Decide members to display ---------------- */
  const displayedMembers: Member[] | undefined = selectedEmpNo
    ? eligibleMembers
    : branch?.members;

  /* ---------------- UI ---------------- */
  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-6 text-gray-800">
        Commissions Dashboard
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {/* ================= Branch & Staff ================= */}
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-xl border shadow-sm">
            <h2 className="text-sm font-bold uppercase text-blue-600 mb-4">
              Branch & Staff
            </h2>

            {/* Branch select */}
            <label className="block mb-1 text-xs font-medium text-gray-500">
              Select Branch
            </label>
            <select
              className="w-full rounded-lg border px-3 py-2 mb-4 bg-gray-50"
              onChange={(e) =>
                setSelectedBranchId(
                  e.target.value ? Number(e.target.value) : null,
                )
              }
            >
              <option value="">Choose a branch</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>

            {/* Employee select */}
            <label className="block mb-1 text-xs font-medium text-gray-500">
              Select Employee
            </label>
            <select
              className="w-full rounded-lg border px-3 py-2 bg-gray-50"
              value={selectedEmpNo}
              onChange={(e) => setSelectedEmpNo(e.target.value)}
            >
              <option value="">All Employees</option>
              {branch?.members?.map((m) => (
                <option key={m.empNo} value={m.empNo}>
                  {m.name} ({m.empNo})
                </option>
              ))}
            </select>
          </div>

          {/* Members list */}
          <div className="space-y-3">
            {loadingEligible && (
              <p className="text-sm text-gray-400 italic">
                Loading eligible members…
              </p>
            )}

            {!loadingEligible &&
              selectedEmpNo &&
              displayedMembers?.length === 0 && (
                <p className="text-sm text-red-500 italic">
                  No eligible members found
                </p>
              )}

            {displayedMembers?.map((m) => (
              <div
                key={m.id}
                className="rounded-xl border bg-white p-4 shadow-sm border-l-4 border-blue-500"
              >
                <p className="font-bold text-gray-800">{m.name}</p>
                <p className="text-xs text-blue-600 mb-3">
                  {m.position?.title}
                </p>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-100">
                  <div>
                    <p className="text-[10px] text-gray-500 uppercase">
                      ORC Rate
                    </p>
                    <p className="font-bold text-gray-700">
                      {m.position?.commissionRate?.rate
                        ? `${m.position.commissionRate.rate}%`
                        : "0%"}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-500 uppercase">
                      Total Earned
                    </p>
                    <p className="font-bold text-green-600">
                      Rs. {m.totalCommission?.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ================= Client ================= */}
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-xl border shadow-sm">
            <h2 className="text-sm font-bold uppercase text-blue-600 mb-4">
              Client Details
            </h2>

            <label className="block mb-1 text-xs font-medium text-gray-500">
              Select Client
            </label>
            <select
              className="w-full rounded-lg border px-3 py-2 bg-gray-50"
              onChange={(e) =>
                setSelectedClientId(
                  e.target.value ? Number(e.target.value) : null,
                )
              }
            >
              <option value="">Choose a client</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.fullName}
                </option>
              ))}
            </select>
          </div>

          {client && (
            <div className="rounded-xl border bg-white p-5 shadow-sm space-y-3 border-l-4 border-green-500">
              <h2 className="text-lg font-bold text-gray-800">
                {client.fullName}
              </h2>
              <div className="grid grid-cols-1 gap-2 text-sm text-gray-600">
                <p>
                  <span className="font-medium text-gray-400">NIC:</span>{" "}
                  {client.nic}
                </p>
                <p>
                  <span className="font-medium text-gray-400">Mobile:</span>{" "}
                  {client.phoneMobile}
                </p>
                <p>
                  <span className="font-medium text-gray-400">Branch:</span>{" "}
                  {client.branch?.name}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* ================= Plans ================= */}
        <div className="space-y-4">
          <h2 className="text-sm font-bold uppercase text-blue-600 px-1">
            Active Plan
          </h2>
          {!plans || plans.length === 0 ? (
            <div className="h-32 flex items-center justify-center border-2 border-dashed rounded-xl text-gray-400 text-sm italic bg-gray-50">
              No plan details found
            </div>
          ) : (
            plans.map((p) => (
              <div
                key={p.id}
                className="rounded-xl border bg-linear-to-br from-blue-50 to-white p-5 shadow-md border-t-4 border-t-blue-600"
              >
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-black text-blue-900 tracking-tight">
                    {p.name}
                  </h3>
                  <span className="bg-blue-600 text-white text-[10px] font-bold px-2 py-1 rounded">
                    {p.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-y-4">
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase font-bold">
                      Investment
                    </p>
                    <p className="text-lg font-bold text-gray-900">
                      Rs. {p.investment?.toLocaleString() ?? "0"}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase font-bold">
                      Interest Rate
                    </p>
                    <p className="text-lg font-bold text-gray-900">{p.rate}%</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase font-bold">
                      Duration
                    </p>
                    <p className="font-semibold text-gray-700">
                      {p.duration} Months
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase font-bold">
                      Type
                    </p>
                    <p className="font-semibold text-gray-700 uppercase">
                      {p.description}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Page;
