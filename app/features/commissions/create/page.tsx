"use client";

import { Briefcase, Calculator, ChevronRight, Loader2, ShieldCheck, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

// Components
import Back from "@/app/components/Buttons/Back";
import CommissionReceipt from "@/app/components/Commission/CommissionReceipt";
import Heading from "@/app/components/Heading";
import BranchStaffPanel from "./components/BranchStaffPanel";
import ClientSelector from "./components/ClientSelector";
import MemberList from "./components/MemberList";

// Actions & Types
import { getBranchById, getBranches } from "@/app/features/branches/actions";
import { getClientById, getClientsByBranch } from "@/app/features/clients/actions";
import { getEligibleCommissions, processCommissions } from "@/app/features/commissions/actions";
import { createProfit } from "@/app/features/profit/actions";
import { Branch } from "@/app/types/branch";
import { Client } from "@/app/types/client";
import { ClientDetailsCard } from "./components/ClientDetailsCard";

const Page = () => {
  /* --- States --- */
  const [branches, setBranches] = useState([]);
  const [selectedBranchId, setSelectedBranchId] = useState<number | null>(null);
  const [branchData, setBranchData] = useState<Branch | null>(null);
  
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null);
  const [clientData, setClientData] = useState<Client | null>(null);
  
  const [selectedEmpNo, setSelectedEmpNo] = useState("");
  const [eligibleMembers, setEligibleMembers] = useState([]);
  
  const [selectedInvestmentId, setSelectedInvestmentId] = useState<number | null>(null);
  const [processing, setProcessing] = useState(false);
  const [commissionDetails, setCommissionDetails] = useState(null);

  /* --- Data Loading Orchestration --- */
  useEffect(() => {
    getBranches().then(data => setBranches(data as any));
  }, []);

  useEffect(() => {
    if (!selectedBranchId) return;
    getBranchById(selectedBranchId).then(setBranchData);
    getClientsByBranch(selectedBranchId).then(res => setClients(res.clients ));
  }, [selectedBranchId]);

  useEffect(() => {
    if (!selectedClientId) {
      setClientData(null);
      return;
    }
    getClientById(selectedClientId).then(setClientData);
  }, [selectedClientId]);

  useEffect(() => {
    if (!selectedEmpNo || !selectedBranchId) {
      setEligibleMembers([]);
      return;
    }
    getEligibleCommissions(selectedEmpNo, selectedBranchId)
      .then(data => setEligibleMembers(data.upperMember))
      .catch(() => setEligibleMembers([]));
  }, [selectedEmpNo, selectedBranchId]);

  const handleProcess = async () => {
    if (!selectedEmpNo || !selectedInvestmentId) return;
    setProcessing(true);
    try {
      const result = await processCommissions({
        investmentId: selectedInvestmentId,
        empNo: selectedEmpNo,
        branchId: selectedBranchId!,
      });

      if (result.success) {
        setCommissionDetails(result.receipt);
        await createProfit(result.receipt);
        result.receipt.alreadyProcessed 
          ? toast.warning("Record already exists in ledger.") 
          : toast.success("Ledger updated successfully.");
      }
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-20">
      {/* Enterprise Top Bar */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-30 mb-8">
        <div className="max-w-400 mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Back />
            <div className="h-6 w-px bg-slate-200 mx-2" />
            <div>
              <Heading className="text-lg font-bold text-slate-900">Process Commission</Heading>
              <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400">v1.0 • {new Date().toLocaleDateString()}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden md:flex flex-col items-end mr-4">
              <span className="text-[10px] font-bold text-emerald-600 uppercase">System Status</span>
              <span className="text-xs text-slate-500 font-medium">Operational</span>
            </div>
            <div className="h-8 w-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4 text-slate-400" />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-400 mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Left: Origin Context (Branch & Staff) */}
          <aside className="lg:col-span-3 space-y-6">
            <BranchStaffPanel
              branches={branches}
              branch={branchData}
              selectedBranchId={selectedBranchId}
              selectedEmpNo={selectedEmpNo}
              onBranchChange={setSelectedBranchId}
              onEmployeeChange={setSelectedEmpNo}
            />
            
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-4 py-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                  <Users className="w-3 h-3" /> Hierarchy Trace
                </span>
                {eligibleMembers.length > 0 && <span className="text-[10px] font-bold text-blue-600">{eligibleMembers.length} Found</span>}
              </div>
              <div className="max-h-100 overflow-y-auto p-4">
                <MemberList 
                  members={selectedEmpNo ? eligibleMembers : branchData?.members} 
                  loading={false} 
                  selectedEmpNo={selectedEmpNo} 
                />
              </div>
            </div>
          </aside>

          {/* Middle: Selection Workspace (Client & Plan) */}
          <main className="lg:col-span-6 space-y-6">
            <ClientSelector
              clients={clients}
              selectedClientId={selectedClientId}
              onChange={setSelectedClientId}
            />

            {clientData ? (
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                <ClientDetailsCard
                  client={clientData}
                  selectedInvestmentId={selectedInvestmentId}
                  onInvestmentChange={setSelectedInvestmentId}
                />
              </div>
            ) : (
              <div className="h-75 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm mb-3">
                  <Briefcase className="w-6 h-6 text-slate-300" />
                </div>
                <p className="text-slate-400 font-medium text-sm">Select a client to load active portfolios</p>
              </div>
            )}
          </main>

          {/* Right: Final Action & Summary */}
          <aside className="lg:col-span-3 sticky top-24">
            <div className="bg-slate-900 rounded-2xl p-6 text-white shadow-xl shadow-slate-200">
              <div className="flex items-center gap-2 text-blue-400 mb-6">
                <Calculator className="w-5 h-5" />
                <h3 className="text-xs text-white font-bold uppercase tracking-[0.2em]">Ready for Processing</h3>
              </div>
              
              <div className="space-y-4 mb-8">
                <div className="flex justify-between items-end border-b border-slate-800 pb-2">
                  <span className="text-xs text-slate-400 font-medium">Branch</span>
                  <span className="text-sm font-bold">{branchData?.name || "—"}</span>
                </div>
                <div className="flex justify-between items-end border-b border-slate-800 pb-2">
                  <span className="text-xs text-slate-400 font-medium">Advisor</span>
                  <span className="text-sm font-bold truncate max-w-37.5">{selectedEmpNo || "—"}</span>
                </div>
                <div className="flex justify-between items-end border-b border-slate-800 pb-2">
                  <span className="text-xs text-slate-400 font-medium">Investment ID</span>
                  <span className="text-sm font-bold text-blue-400">{selectedInvestmentId || "—"}</span>
                </div>
              </div>

              <button
                onClick={handleProcess}
                disabled={!selectedEmpNo || !selectedInvestmentId || processing}
                className="w-full h-14 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-600 rounded-xl font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
              >
                {processing ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>Execute Payout <ChevronRight className="w-5 h-5" /></>
                )}
              </button>
            </div>
          </aside>
        </div>

        {/* Receipt Overlay */}
        {commissionDetails && (
          <div className="mt-12 border-t border-slate-200 pt-12">
            <div className="flex flex-col items-center">
              <div className="mb-4 px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-[10px] font-bold uppercase tracking-widest">
                Transaction Completed
              </div>
              <CommissionReceipt data={commissionDetails} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Page;