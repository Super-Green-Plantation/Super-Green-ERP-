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
import BranchStaffPanel from "./components/BranchStaffPanel";
import MemberList from "./components/MemberList";
import PlanCard from "./components/PlanCard";
import ClientSelector from "./components/ClientSelector";
import ClientDetailsCard from "./components/ClientDetailsCard";

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

  const [selectedInvestmentId, setSelectedInvestmentId] = useState<
    number | null
  >(null);

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

  const uniquePlans = plans.filter(
    (plan, index, self) => index === self.findIndex((p) => p.id === plan.id),
  );

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-semibold mb-6 text-gray-800">
        Commissions Dashboard
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <BranchStaffPanel
          branches={branches}
          branch={branch}
          selectedBranchId={selectedBranchId}
          selectedEmpNo={selectedEmpNo}
          onBranchChange={setSelectedBranchId}
          onEmployeeChange={setSelectedEmpNo}
        />

        <MemberList
          members={displayedMembers}
          loading={loadingEligible}
          selectedEmpNo={selectedEmpNo}
        />

        <ClientSelector
          clients={clients}
          selectedClientId={selectedClientId}
          onChange={setSelectedClientId}
        />

        {client && (
          <ClientDetailsCard
            client={client}
            selectedInvestmentId={selectedInvestmentId}
            onInvestmentChange={setSelectedInvestmentId}
          />
        )}

        <PlanCard plans={uniquePlans} />
      </div>
    </div>
  );
};

export default Page;
