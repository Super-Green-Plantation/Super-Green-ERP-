"use client";

import { getBranchById, getBranches } from "@/app/features/branches/actions";
import {
  getClientById,
  getClientsByBranch,
} from "@/app/features/clients/actions";
import {
  getEmployeesByBranch,
} from "@/app/features/employees/actions";
import { getEligibleCommissions, processCommissions } from "@/app/features/commissions/actions";
import { getPlansByClient, updateAdvisorId } from "@/app/features/investments/actions";
import { createProfit } from "@/app/features/profit/actions";
import { Branch } from "@/app/types/branch";
import { Client } from "@/app/types/client";
import { FinancialPlan } from "@/app/types/FinancialPlan";
import { Member } from "@/app/types/member";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import CommissionReceipt from "@/app/components/Commission/CommissionReceipt";
import { ArrowLeft } from "lucide-react";
import BranchStaffPanel from "./components/BranchStaffPanel";
import ClientDetailsCard from "./components/ClientDetailsCard";
import ClientSelector from "./components/ClientSelector";
import MemberList from "./components/MemberList";
import PlanCard from "./components/PlanCard";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import Back from "@/app/components/Back";

type CommissionReceipt = {
  alreadyProcessed: boolean;
  investment: any;
  advisor?: any;
  commissions: any[];
};

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
  const [commissionDetails, setCommissionDetails] =
    useState<CommissionReceipt | null>(null);

  const router = useRouter();

  console.log(commissionDetails);
  
  

  useEffect(() => {
    const updateAdvisor = async () => {
      await updateAdvisorId(Number(selectedInvestmentId), selectedEmpNo);
    };
    updateAdvisor();
  }, [selectedInvestmentId]);

  /* ---------------- Load branches ---------------- */
  useEffect(() => {
    const loadBranches = async () => {
      const data = await getBranches();
      // Adjust if the action returns { branches } or just branches
      setBranches(data as any);
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
      const data = await getBranchById(selectedBranchId);
      setBranch(data as any);
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
      setClients(data.clients as any);
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
      const data = await getClientById(selectedClientId);
      setClient(data as any);
    };

    loadClient();
  }, [selectedClientId]);

  /* ---------------- Load plans by client ---------------- */
  useEffect(() => {
    if (!selectedClientId) return;

    const loadPlans = async () => {
      const data = await getPlansByClient(selectedClientId);
      setPlans(data as any);
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
        const data = await getEligibleCommissions(selectedEmpNo, selectedBranchId);
        setEligibleMembers(data.upperMember as any);
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
    : branch?.members as any;

  const uniquePlans = plans.filter(
    (plan, index, self) => plan && index === self.findIndex((p) => p?.id === plan.id),
  );

  const [processing, setProcessing] = useState(false);

  const handleProcess = async () => {
    if (!selectedEmpNo || !selectedInvestmentId || !selectedBranchId) {
      toast.error("Please select all required fields (Branch, Staff, Investment)");
      return;
    }

    setProcessing(true);
    try {
      const result = await processCommissions({
        investmentId: selectedInvestmentId,
        empNo: selectedEmpNo,
        branchId: selectedBranchId,
      });

      if (result.success) {
        setCommissionDetails(result.receipt as any);
        await createProfit(result.receipt as any);
        if (result.receipt.alreadyProcessed) {
          toast.warning("Commission already processed.");
        } else {
          toast.success("Commission processed successfully!");
        }
      } else {
        toast.error(result.error?.message || "Failed to process commission");
      }
    } catch (err) {
      console.error(err);
      toast.error("An unexpected error occurred");
    } finally {
      setProcessing(false);
    }
  };

  useEffect(() => {
    const fetchUpperMembers = async () => {
      if (!selectedEmpNo || !selectedBranchId) return;

      const members = await getEligibleCommissions(
        selectedEmpNo,
        Number(selectedBranchId),
      );

      console.log(
        "upper member ORC rate:",
        members?.upperMember?.[0]?.position?.orc?.rate,
      );
    };

    fetchUpperMembers();
  }, [selectedEmpNo, selectedBranchId]);

  return (
    <>
    <div className="min-h-screen  px-4 ">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <header className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex gap-2 items-center">
              <Back/>
              <h1 className="text-2xl font-semibold ">Commissions Portal</h1>
            </div>
            <p className="text-sm font-medium text-gray-500">
              Manage branch staff allocations and investment performance.
            </p>
          </div>

          {/* Quick Stats Placeholder (Optional) */}
          <div className="flex gap-4">
            <div className=" px-4 py-2 rounded-xl border ">
             
              <p className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                <span className="h-2 w-2 bg-emerald-500 rounded-full animate-ping mr-2" />
                Live Data
              </p>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Selection & Staff (4/12) */}
          <aside className="lg:col-span-4 space-y-8">
            <section className="sticky top-8 space-y-8">
              <BranchStaffPanel
                branches={branches}
                branch={branch}
                selectedBranchId={selectedBranchId}
                selectedEmpNo={selectedEmpNo}
                onBranchChange={setSelectedBranchId}
                onEmployeeChange={setSelectedEmpNo}
              />

              <div className=" overflow-hidden">
                <div className="p-4 border-b border-gray-50 bg-gray-50/50">
                  <h3 className="text-xs font-black uppercase tracking-widest text-gray-500">
                    Eligible Members
                  </h3>
                </div>
                <div className="max-h-125 overflow-y-auto">
                  <MemberList
                    members={displayedMembers}
                    loading={loadingEligible}
                    selectedEmpNo={selectedEmpNo}
                  />
                </div>
              </div>
            </section>
          </aside>

          {/* Right Column: Client & Plans (8/12) */}
          <main className="lg:col-span-8 space-y-8">
            {/* Top Row: Client Select & Active Plan Summary */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
              <ClientSelector
                clients={clients}
                selectedClientId={selectedClientId}
                onChange={setSelectedClientId}
              />
              <PlanCard plans={uniquePlans} />
            </div>

            {/* Bottom Row: Detailed Client View & Processing */}
            {client ? (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <ClientDetailsCard
                  client={client}
                  selectedInvestmentId={selectedInvestmentId}
                  onInvestmentChange={setSelectedInvestmentId}
                />

                <div className="p-1">
                  <button
                    className="group relative w-full overflow-hidden rounded-2xl bg-blue-600 px-8 py-4 text-white transition-all hover:bg-blue-700 hover:shadow-xl active:scale-[0.98] disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed"
                    onClick={handleProcess}
                    disabled={!selectedEmpNo || !selectedInvestmentId || processing}
                  >
                    <div className="relative z-10 flex items-center justify-center gap-3 font-black uppercase tracking-widest">
                      {processing ? (
                        <>
                          <Loader2 className="h-5 w-5 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <svg
                            className="h-5 w-5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={3}
                              d="M9 5l7 7-7 7"
                            />
                          </svg>
                          Process Commission
                        </>
                      )}
                    </div>
                    {/* Glossy Overlay */}
                    <div className="absolute inset-0 z-0 bg-linear-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                  </button>

                  {!selectedInvestmentId && (
                    <p className="mt-3 text-center text-xs font-bold text-orange-500 uppercase tracking-tighter">
                      * Please select an investment plan to proceed
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div className="h-64 flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-3xl bg-gray-50/50">
                <div className="p-4 bg-white rounded-2xl shadow-sm mb-4">
                  <svg
                    className="h-8 w-8 text-gray-300"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    />
                  </svg>
                </div>
                <p className="text-gray-400 font-medium">
                  Select a client to view investment details
                </p>
              </div>
            )}
          </main>
        </div>
      </div>

      
    </div>
    <div>
        <CommissionReceipt data= {commissionDetails}/>
      </div>
      </>
  );
};

export default Page;
