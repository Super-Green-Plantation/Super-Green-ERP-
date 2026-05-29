"use client";

import {
  Briefcase,
  Calculator,
  ChevronRight,
  Loader2,
  Search,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
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
import {
  getEligibleCommissions,
  
} from "@/app/features/commissions/actions";
import { createProfit } from "@/app/features/profit/actions";
import { Branch } from "@/app/types/branch";
import { Client } from "@/app/types/client";
import { Member } from "@/app/types/member";
import { ClientDetailsCard } from "./components/ClientDetailsCard";
import { useQueryClient } from "@tanstack/react-query";
import { searchEmployees } from "../../employees/actions";
import { processCommissions } from "../process";

const Page = () => {
  const queryClient = useQueryClient();
  /* --- Core states --- */
  const [branches, setBranches] = useState([]);
  const [selectedBranchId, setSelectedBranchId] = useState<number | null>(null);
  const [branchData, setBranchData] = useState<Branch | null>(null);

  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null);
  const [clientData, setClientData] = useState<Client | null>(null);

  const [selectedEmpNo, setSelectedEmpNo] = useState("");
  const [eligibleMembers, setEligibleMembers] = useState<Member[]>([]);

  const [selectedInvestmentId, setSelectedInvestmentId] = useState<number | null>(null);
  const [processing, setProcessing] = useState(false);
  const [commissionDetails, setCommissionDetails] = useState(null);

  /* --- Manual member search states --- */
  const [searchText, setSearchText] = useState("");
  const [searchResults, setSearchResults] = useState<Member[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [manualMembers, setManualMembers] = useState<Member[]>([]);
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* --- Per-member toggle: set of disabled empNos --- */
  const [disabledEmpNos, setDisabledEmpNos] = useState<Set<string>>(new Set());

  /* --- Saved hierarchy derived from selected client --- */
  const clientSavedHierarchy = useMemo<Member[]>(() => {
    if (!clientData) return [];
    // fa is the advisor — exclude from upline list; include fm..cco
    const slots = [
      clientData.fm,
      clientData.bm,
      clientData.rm,
      clientData.zm,
      clientData.agm,
      clientData.cco,
    ].filter(Boolean) as Member[];
    return slots;
  }, [clientData]);

  const hasSavedHierarchy = clientSavedHierarchy.length > 0;

  /* --- Derive investment amount from selected investment --- */
  const investmentAmount: number | null =
    selectedInvestmentId && clientData?.investments
      ? (clientData.investments.find((inv: any) => inv.id === selectedInvestmentId)
          ?.amount ?? null)
      : null;

  /* --- Data loading --- */
  useEffect(() => {
    getBranches().then((data) => setBranches(data as any));
  }, []);

  useEffect(() => {
    if (!selectedBranchId) return;
    getBranchById(selectedBranchId).then(setBranchData);
    getClientsByBranch(selectedBranchId).then((res) => setClients(res.clients));
  }, [selectedBranchId]);

  useEffect(() => {
    if (!selectedClientId) {
      setClientData(null);
      setSelectedEmpNo("");
      setEligibleMembers([]);
      setDisabledEmpNos(new Set());
      setManualMembers([]);
      return;
    }
    getClientById(selectedClientId).then((data) => {
      setClientData(data);
      // Auto-set advisor from saved FA
      if (data?.fa?.empNo) {
        setSelectedEmpNo(data.fa.empNo);
      } else {
        setSelectedEmpNo("");
      }
      // Reset per-client state
      setDisabledEmpNos(new Set());
      setManualMembers([]);
    });
  }, [selectedClientId]);

  useEffect(() => {
    // If the client has a saved hierarchy, use that — skip dynamic lookup
    if (hasSavedHierarchy) {
      setEligibleMembers(clientSavedHierarchy);
      return;
    }
    if (!selectedEmpNo || !selectedBranchId) {
      setEligibleMembers([]);
      return;
    }
    getEligibleCommissions(selectedEmpNo, selectedBranchId)
      .then((data) => setEligibleMembers(data.upperMember))
      .catch(() => setEligibleMembers([]));
  }, [selectedEmpNo, selectedBranchId, hasSavedHierarchy, clientSavedHierarchy]);

  /* --- Manual search debounce --- */
  useEffect(() => {
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);

    if (!searchText.trim()) {
      setSearchResults([]);
      return;
    }

    searchDebounceRef.current = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const results = await searchEmployees(searchText.trim());
        // Filter out members already in eligibleMembers or manualMembers
        const existingEmpNos = new Set([
          ...eligibleMembers.map((m) => m.empNo),
          ...manualMembers.map((m) => m.empNo),
        ]);
        setSearchResults(
          (results as any[]).filter((r) => !existingEmpNos.has(r.empNo))
        );
      } finally {
        setSearchLoading(false);
      }
    }, 350);
  }, [searchText, eligibleMembers, manualMembers]);

  const handleAddManualMember = (member: Member) => {
    setManualMembers((prev) => [...prev, member]);
    setSearchText("");
    setSearchResults([]);
  };

  const handleToggleMember = (empNo: string) => {
    setDisabledEmpNos((prev) => {
      const next = new Set(prev);
      next.has(empNo) ? next.delete(empNo) : next.add(empNo);
      return next;
    });
  };

  /* --- Commission processing --- */
  const handleProcess = async () => {
    if (!selectedEmpNo || !selectedInvestmentId) return;
    setProcessing(true);
    try {
      // Build the list of manually added empNos that are still enabled
      const enabledManualEmpNos = manualMembers
        .filter((m) => !disabledEmpNos.has(m.empNo))
        .map((m) => m.empNo);

      // When client has a saved hierarchy, pass those empNos so the server
      // bypasses the dynamic rank-based upline lookup
      const hierarchyEmpNos = hasSavedHierarchy
        ? eligibleMembers
            .filter((m) => !disabledEmpNos.has(m.empNo))
            .map((m) => m.empNo)
        : undefined;

      const result = await processCommissions({
        investmentId: selectedInvestmentId,
        empNo: selectedEmpNo,
        branchId: selectedBranchId!,
        disabledEmpNos: Array.from(disabledEmpNos),
        manualEmpNos: enabledManualEmpNos,
        hierarchyEmpNos,
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
    <div className="min-h-screen  pb-20">
      {/* Enterprise Top Bar */}
      <div className="mb-8">
        <div className="max-w-400 mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Back />
            <div />
            <div>
              <Heading className="text-lg font-bold text-foreground">
                Process Commission
              </Heading>
              <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">
               {new Date().toLocaleDateString()}
              </p>
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

            {/* Hierarchy Trace + Manual Search Panel */}
            <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
              <div className="px-4 py-3 bg-muted/30 border-b border-border flex items-center justify-between">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                  <Users className="w-3 h-3" /> Hierarchy Trace
                </span>
                <div className="flex items-center gap-2">
                  {hasSavedHierarchy && (
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest bg-emerald-100 text-emerald-700">
                      Saved
                    </span>
                  )}
                  {eligibleMembers.length > 0 && (
                    <span className={`text-[10px] font-bold ${hasSavedHierarchy ? "text-emerald-600" : "text-blue-600"}`}>
                      {eligibleMembers.length} Found
                    </span>
                  )}
                </div>
              </div>

              {/* Member list */}
              <div className="max-h-100 overflow-y-auto p-4">
                <MemberList
                  members={selectedEmpNo ? eligibleMembers : branchData?.members}
                  manualMembers={manualMembers}
                  loading={false}
                  selectedEmpNo={selectedEmpNo}
                  investmentAmount={investmentAmount}
                  disabledEmpNos={disabledEmpNos}
                  onToggle={handleToggleMember}
                />
              </div>

              {/* Manual search section */}
              <div className="border-t border-border p-4 space-y-3">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                  <UserPlus className="w-3 h-3" /> Add Member Manually
                </p>

                {/* Search input */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                  <input
                    type="text"
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    placeholder="Search by name, EMP No, or NIC…"
                    className="w-full pl-9 pr-8 py-2 text-xs font-medium rounded-lg border border-border bg-muted/30 focus:bg-card focus:border-blue-400 focus:ring-2 focus:ring-blue-400/10 outline-none transition-all placeholder:text-muted-foreground"
                  />
                  {searchText && (
                    <button
                      onClick={() => {
                        setSearchText("");
                        setSearchResults([]);
                      }}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-muted-foreground"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>

                {/* Search results dropdown */}
                {(searchResults.length > 0 || searchLoading) && (
                  <div className="rounded-lg border border-border bg-card shadow-sm overflow-hidden divide-y divide-slate-100">
                    {searchLoading ? (
                      <div className="px-3 py-2.5 flex items-center gap-2 text-xs text-muted-foreground">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        Searching…
                      </div>
                    ) : (
                      searchResults.map((result) => (
                        <div
                          key={result.empNo}
                          className="flex items-center justify-between px-3 py-2.5 hover:bg-muted/30 transition-colors"
                        >
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-foreground truncate">
                              {result.nameWithInitials}
                            </p>
                            <p className="text-[10px] text-muted-foreground font-medium">
                              {result.empNo} •{" "}
                              {result.branches?.[0]?.branch?.name ?? "—"}
                            </p>
                          </div>
                          <button
                            onClick={() => handleAddManualMember(result)}
                            className="ml-2 shrink-0 px-2 py-1 text-[10px] font-bold uppercase tracking-wide rounded-md bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                          >
                            Add
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {searchText && !searchLoading && searchResults.length === 0 && (
                  <p className="text-[10px] text-muted-foreground italic text-center py-1">
                    No results found
                  </p>
                )}
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
              <div className="h-75 flex flex-col items-center justify-center border-2 border-dashed border-border rounded-2xl bg-muted/30">
                <div className="w-12 h-12 bg-card rounded-full flex items-center justify-center shadow-sm mb-3">
                  <Briefcase className="w-6 h-6 text-slate-300" />
                </div>
                <p className="text-muted-foreground font-medium text-sm">
                  Select a client to load active portfolios
                </p>
              </div>
            )}
          </main>

          {/* Right: Final Action & Summary */}
          <aside className="lg:col-span-3 sticky top-24">
            <div className="bg-slate-900 rounded-2xl p-6 text-white shadow-xl shadow-none">
              <div className="flex items-center gap-2 text-blue-400 mb-6">
                <Calculator className="w-5 h-5" />
                <h3 className="text-xs text-white font-bold uppercase tracking-[0.2em]">
                  Ready for Processing
                </h3>
              </div>

              <div className="space-y-4 mb-8">
                <div className="flex justify-between items-end border-b border-slate-800 pb-2">
                  <span className="text-xs text-muted-foreground font-medium">Branch</span>
                  <span className="text-sm font-bold">{branchData?.name || "—"}</span>
                </div>
                <div className="flex justify-between items-end border-b border-slate-800 pb-2">
                  <span className="text-xs text-muted-foreground font-medium">Advisor</span>
                  <div className="text-right">
                    <span className="text-sm font-bold truncate max-w-37.5 block">
                      {clientData?.fa?.nameWithInitials || selectedEmpNo || "—"}
                    </span>
                    {clientData?.fa && (
                      <span className="text-[9px] text-emerald-400 font-bold uppercase tracking-widest">
                        {selectedEmpNo}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex justify-between items-end border-b border-slate-800 pb-2">
                  <span className="text-xs text-muted-foreground font-medium">Investment ID</span>
                  <span className="text-sm font-bold text-blue-400">
                    {selectedInvestmentId || "—"}
                  </span>
                </div>
                {hasSavedHierarchy && (
                  <div className="flex justify-between items-end border-b border-slate-800 pb-2">
                    <span className="text-xs text-muted-foreground font-medium">Hierarchy</span>
                    <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
                      Saved ({eligibleMembers.length})
                    </span>
                  </div>
                )}
                {disabledEmpNos.size > 0 && (
                  <div className="flex justify-between items-end border-b border-slate-800 pb-2">
                    <span className="text-xs text-muted-foreground font-medium">Skipped</span>
                    <span className="text-sm font-bold text-amber-400">
                      {disabledEmpNos.size} member{disabledEmpNos.size > 1 ? "s" : ""}
                    </span>
                  </div>
                )}
                {manualMembers.length > 0 && (
                  <div className="flex justify-between items-end border-b border-slate-800 pb-2">
                    <span className="text-xs text-muted-foreground font-medium">Manual</span>
                    <span className="text-sm font-bold text-purple-400">
                      +{manualMembers.filter((m) => !disabledEmpNos.has(m.empNo)).length}
                    </span>
                  </div>
                )}
              </div>

              <button
                onClick={handleProcess}
                disabled={!selectedEmpNo || !selectedInvestmentId || processing}
                className="w-full h-14 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-muted-foreground rounded-xl font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
              >
                {processing ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    Execute Payout <ChevronRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </div>
          </aside>
        </div>

        {/* Receipt Overlay */}
        {commissionDetails && (
          <div className="mt-12 border-t border-border pt-12">
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