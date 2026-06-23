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
import ClientSelector from "./components/ClientSelector";
import MemberList from "./components/MemberList";
import { ClientDetailsCard } from "./components/ClientDetailsCard";

// Actions & Types
import { getBranchById, getBranches } from "@/app/features/branches/actions";
import { getClientById, getClientsByBranch } from "@/app/features/clients/actions";
import { createProfit } from "@/app/features/profit/actions";
import { Branch } from "@/app/types/branch";
import { Client } from "@/app/types/client";
import { Member } from "@/app/types/member";
import { Investment } from "@/app/types/investment";
import { searchEmployees } from "../../employees/actions";
import { processCommissions } from "../process";

const Page = () => {
  // ── Branch ──────────────────────────────────────────────────────────────────
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<number | null>(null);
  const [branchData, setBranchData] = useState<Branch | null>(null);

  // ── Client ───────────────────────────────────────────────────────────────────
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null);
  const [clientData, setClientData] = useState<Client | null>(null);

  // ── Investment ───────────────────────────────────────────────────────────────
  const [selectedInvestmentId, setSelectedInvestmentId] = useState<number | null>(null);

  // ── Exception handling ───────────────────────────────────────────────────────
  const [manualMembers, setManualMembers] = useState<Member[]>([]);
  const [disabledEmpNos, setDisabledEmpNos] = useState<Set<string>>(new Set());

  // ── Manual search ────────────────────────────────────────────────────────────
  const [searchText, setSearchText] = useState("");
  const [searchResults, setSearchResults] = useState<Member[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Processing ───────────────────────────────────────────────────────────────
  const [processing, setProcessing] = useState(false);
  const [commissionDetails, setCommissionDetails] = useState(null);

  // ── Derived: selected investment object ─────────────────────────────────────
  const selectedInvestment = useMemo<Investment | null>(() => {
    if (!clientData?.investments || !selectedInvestmentId) return null;
    return (clientData.investments as any[]).find(
      (i) => i.id === selectedInvestmentId
    ) ?? null;
  }, [clientData, selectedInvestmentId]);

  // ── Derived: advisor empNo from investment.fa (read-only, no user input) ────
  // The advisor is whoever holds the lowest rank on this investment
  // FA → FM → BM → RM → ZM → AGM → CCO (first non-null wins)
  const advisorMember = (selectedInvestment as any)
    ? (
      (selectedInvestment as any).fa ??
      (selectedInvestment as any).fm ??
      (selectedInvestment as any).bm ??
      (selectedInvestment as any).rm ??
      (selectedInvestment as any).zm ??
      (selectedInvestment as any).agm ??
      (selectedInvestment as any).cco ??
      null
    )
    : null;

  const advisorEmpNo: string = advisorMember?.empNo ?? "";
  const advisorName: string = advisorMember?.nameWithInitials ?? "";

  // ── Derived: hierarchy members from investment snapshot ──────────────────────
  // FA is excluded here — FA's personal commission is handled via advisorEmpNo
  const hierarchyMembers = useMemo<Member[]>(() => {
    if (!selectedInvestment || !advisorEmpNo) return [];
    // All hierarchy members ABOVE the advisor (exclude whoever is the advisor)
    return [
      (selectedInvestment as any).fa,
      (selectedInvestment as any).fm,
      (selectedInvestment as any).bm,
      (selectedInvestment as any).rm,
      (selectedInvestment as any).zm,
      (selectedInvestment as any).agm,
      (selectedInvestment as any).cco,
    ]
      .filter(Boolean)
      .filter((m: any) => m.empNo !== advisorEmpNo) as Member[];
  }, [selectedInvestment, advisorEmpNo]);

  const hasSavedHierarchy = hierarchyMembers.length > 0;

  // ── Derived: investment amount ───────────────────────────────────────────────
  const investmentAmount: number | null = (selectedInvestment as any)?.amount ?? null;

  // ── Load branches once ───────────────────────────────────────────────────────
  useEffect(() => {
    getBranches().then((data) => setBranches(data as any));
  }, []);

  // ── Load branch data + clients when branch changes ───────────────────────────
  useEffect(() => {
    if (!selectedBranchId) {
      setBranchData(null);
      setClients([]);
      setSelectedClientId(null);
      return;
    }
    getBranchById(selectedBranchId).then(setBranchData as any);
    getClientsByBranch(selectedBranchId).then((res) => setClients(res.clients as any));
  }, [selectedBranchId]);

  // ── Load client data when client selected ────────────────────────────────────
  useEffect(() => {
    if (!selectedClientId) {
      setClientData(null);
      setSelectedInvestmentId(null);
      setManualMembers([]);
      setDisabledEmpNos(new Set());
      return;
    }
    getClientById(selectedClientId).then((data) => {
      setClientData(data as any);
      // Reset investment selection when switching clients
      setSelectedInvestmentId(null);
      setManualMembers([]);
      setDisabledEmpNos(new Set());
    });
  }, [selectedClientId]);

  // ── Reset exception state when investment changes ────────────────────────────
  useEffect(() => {
    setManualMembers([]);
    setDisabledEmpNos(new Set());
    setCommissionDetails(null);
  }, [selectedInvestmentId]);

  // ── Manual member search debounce ────────────────────────────────────────────
  useEffect(() => {
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    if (!searchText.trim()) { setSearchResults([]); return; }

    searchDebounceRef.current = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const results = await searchEmployees(searchText.trim());
        // Filter out members already in hierarchy or manually added
        const existingEmpNos = new Set([
          ...hierarchyMembers.map((m) => m.empNo),
          ...manualMembers.map((m) => m.empNo),
          advisorEmpNo,
        ]);
        setSearchResults(
          (results as any[]).filter((r) => !existingEmpNos.has(r.empNo))
        );
      } finally {
        setSearchLoading(false);
      }
    }, 350);
  }, [searchText, hierarchyMembers, manualMembers, advisorEmpNo]);

  // ── Handlers ─────────────────────────────────────────────────────────────────
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

  // ── Commission processing ────────────────────────────────────────────────────
  const handleProcess = async () => {
    if (!advisorEmpNo || !selectedInvestmentId || !selectedBranchId) return;
    setProcessing(true);
    try {
      const result = await processCommissions({
        investmentId: selectedInvestmentId,
        empNo: advisorEmpNo,
        branchId: selectedBranchId,
        disabledEmpNos: Array.from(disabledEmpNos),
        // Manual members that are still enabled
        manualEmpNos: manualMembers
          .filter((m) => !disabledEmpNos.has(m.empNo))
          .map((m) => m.empNo),
        // Saved hierarchy from investment snapshot — bypasses getUplineChain
        hierarchyEmpNos: hierarchyMembers
          .filter((m) => !disabledEmpNos.has(m.empNo))
          .map((m) => m.empNo),
      });

      if (result.success) {
        setCommissionDetails(result.receipt);
        await createProfit(result.receipt);
        result.receipt.alreadyProcessed
          ? toast.warning("Record already exists.")
          : toast.success("Commission updated successfully.");
      } else {
        toast.error(result.error?.message ?? "Processing failed.");
      }
    } finally {
      setProcessing(false);
    }
  };

  const canProcess = !!advisorEmpNo && !!selectedInvestmentId && !processing;

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen pb-20">
      {/* Top bar */}
      <div className="mb-8">
        <div className="max-w-400 mx-auto px-4 h-16 flex items-center gap-4">
          <Back />
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

      <div className="max-w-400 mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

          {/* ── Left: Hierarchy + Manual Search ─────────────────────────────── */}
          <aside className="lg:col-span-3 space-y-6">

            {/* Branch picker — just a filter, no employee dropdown */}
            <div className="bg-card p-6 rounded-2xl border border-border shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <h2 className="text-sm font-bold uppercase tracking-widest text-foreground">
                  Branch
                </h2>
              </div>
              <select
                className="w-full appearance-none rounded-xl border border-border bg-muted/30 px-4 py-2.5 text-sm font-semibold text-foreground outline-none transition-all focus:border-blue-500 focus:ring-4 focus:ring-primary/10 cursor-pointer"
                onChange={(e) => setSelectedBranchId(e.target.value ? Number(e.target.value) : null)}
              >
                <option value="">Select a Branch</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>

              {/* Advisor read-only display — auto-populated from investment.fa */}
              {selectedInvestment && (
                <div className="mt-4 p-3 rounded-xl bg-muted/30 border border-border">
                  <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mb-1">
                    Advisor (from investment)
                  </p>
                  {advisorEmpNo ? (
                    <>
                      <p className="text-sm font-bold text-foreground truncate">{advisorName}</p>
                      <p className="text-[10px] text-emerald-600 font-bold">{advisorEmpNo}</p>
                    </>
                  ) : (
                    <p className="text-xs text-amber-500 font-medium">No FA saved on this investment</p>
                  )}
                </div>
              )}
            </div>

            {/* Hierarchy Trace + Manual Search */}
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
                  {hierarchyMembers.length > 0 && (
                    <span className="text-[10px] font-bold text-emerald-600">
                      {hierarchyMembers.length} Found
                    </span>
                  )}
                </div>
              </div>

              <div className="max-h-100 overflow-y-auto p-4">
                {!selectedInvestmentId ? (
                  <p className="text-xs text-muted-foreground italic text-center py-4">
                    Select an investment to load hierarchy
                  </p>
                ) : (
                  <MemberList
                    members={hierarchyMembers}
                    manualMembers={manualMembers}
                    loading={false}
                    selectedEmpNo={advisorEmpNo}
                    investmentAmount={investmentAmount}
                    disabledEmpNos={disabledEmpNos}
                    onToggle={handleToggleMember}
                  />
                )}
              </div>

              {/* Manual search */}
              <div className="border-t border-border p-4 space-y-3">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                  <UserPlus className="w-3 h-3" /> Add Member Manually
                </p>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                  <input
                    type="text"
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    placeholder="Search by name or EMP No…"
                    className="w-full pl-9 pr-8 py-2 text-xs font-medium rounded-lg border border-border bg-muted/30 focus:bg-card focus:border-blue-400 focus:ring-2 focus:ring-blue-400/10 outline-none transition-all placeholder:text-muted-foreground"
                  />
                  {searchText && (
                    <button
                      onClick={() => { setSearchText(""); setSearchResults([]); }}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>

                {(searchResults.length > 0 || searchLoading) && (
                  <div className="rounded-lg border border-border bg-card shadow-sm overflow-hidden divide-y divide-slate-100">
                    {searchLoading ? (
                      <div className="px-3 py-2.5 flex items-center gap-2 text-xs text-muted-foreground">
                        <Loader2 className="w-3 h-3 animate-spin" /> Searching…
                      </div>
                    ) : (
                      searchResults.map((result) => (
                        <div key={result.empNo} className="flex items-center justify-between px-3 py-2.5 hover:bg-muted/30">
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-foreground truncate">{result.nameWithInitials}</p>
                            <p className="text-[10px] text-muted-foreground font-medium">
                              {result.empNo} • {(result as any).branches?.[0]?.branch?.name ?? "—"}
                            </p>
                          </div>
                          <button
                            onClick={() => handleAddManualMember(result)}
                            className="ml-2 shrink-0 px-2 py-1 text-[10px] font-bold uppercase tracking-wide rounded-md bg-blue-50 text-blue-600 hover:bg-blue-100"
                          >
                            Add
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {searchText && !searchLoading && searchResults.length === 0 && (
                  <p className="text-[10px] text-muted-foreground italic text-center py-1">No results found</p>
                )}
              </div>
            </div>
          </aside>

          {/* ── Middle: Client + Investment Selection ───────────────────────── */}
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

          {/* ── Right: Summary + Process Button ─────────────────────────────── */}
          <aside className="lg:col-span-3 sticky top-24">
            <div className="bg-slate-900 rounded-2xl p-6 text-white shadow-xl">
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
                      {advisorName || "—"}
                    </span>
                    {advisorEmpNo && (
                      <span className="text-[9px] text-emerald-400 font-bold uppercase tracking-widest">
                        {advisorEmpNo}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex justify-between items-end border-b border-slate-800 pb-2">
                  <span className="text-xs text-muted-foreground font-medium">Investment</span>
                  <span className="text-sm font-bold text-blue-400">
                    {selectedInvestmentId ? `#${selectedInvestmentId}` : "—"}
                  </span>
                </div>

                {hasSavedHierarchy && (
                  <div className="flex justify-between items-end border-b border-slate-800 pb-2">
                    <span className="text-xs text-muted-foreground font-medium">Hierarchy</span>
                    <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
                      Saved ({hierarchyMembers.length})
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

                {/* Warn if no FA saved on investment */}
                {selectedInvestmentId && !advisorEmpNo && (
                  <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 px-3 py-2">
                    <p className="text-[10px] font-bold text-amber-400">
                      No members saved on this investment. Cannot process.
                    </p>
                  </div>
                )}
              </div>

              <button
                onClick={handleProcess}
                disabled={!canProcess}
                className="w-full h-14 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-muted-foreground rounded-xl font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
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

        {/* Receipt */}
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