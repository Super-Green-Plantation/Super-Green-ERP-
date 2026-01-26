"use client";

import { getBranchDetails, getBranches } from "@/app/services/branches.service";
import {
  getClientDetails,
  getClientsByBranch,
} from "@/app/services/clients.service";
import { getEligibleMembers, updateTotalCommission } from "@/app/services/member.service";
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
import { updateAdvisorId } from "@/app/services/investments.service";
import { calculatePersonalCommission } from "@/app/services/commission.service";

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
  console.log(selectedInvestmentId);
  

  useEffect(() => {
    const updateAdvisor = async () => {
      const res = await updateAdvisorId(
        Number(selectedInvestmentId),
        selectedEmpNo,
      );
      console.log(res);
    };
    updateAdvisor();
  }, [selectedInvestmentId]);

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

  const handleProcess = () => {
    if (!selectedEmpNo || !selectedInvestmentId || !branch || !client) return;

    // find selected member
    const member = displayedMembers?.find((m) => m.empNo === selectedEmpNo);
    if (!member) return;

    // find selected investment
    const investment = client.investments?.find(
      (inv) => inv.id === selectedInvestmentId,
    );
    if (!investment) return;

    // calculate personal commission
    const personalCommission = calculatePersonalCommission(
      member.position.title,
      investment.amount,
    );

    console.log("Member:", member.name);
    console.log("Investment Amount:", investment.amount);
    console.log("Personal Commission:", personalCommission);

    updateTotalCommission(member.id, personalCommission)
    updateAdvisorId(selectedInvestmentId, selectedEmpNo);
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-semibold mb-6 text-gray-800">
        Commissions Dashboard
      </h1>

      <div className="flex flex-col lg:flex-row gap-8 p-6">
        {/* Sidebar: Navigation and Selection */}
        <aside className="w-full lg:w-1/3 space-y-6">
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
        </aside>

        {/* Main Content: Client Data and Plans */}
        <main className="w-full lg:w-2/3 flex flex-col gap-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ClientSelector
              clients={clients}
              selectedClientId={selectedClientId}
              onChange={setSelectedClientId}
            />
            <PlanCard plans={uniquePlans} />
          </div>

          {client && (
            <div className="w-full">
              <ClientDetailsCard
                client={client}
                selectedInvestmentId={selectedInvestmentId}
                onInvestmentChange={setSelectedInvestmentId}
              />
              <button
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                onClick={handleProcess}
                disabled={!selectedEmpNo || !selectedInvestmentId}
              >
                Process Commission
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Page;
