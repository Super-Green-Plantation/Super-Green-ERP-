"use client";

/**
 * MPCommissionAccordionList
 * Mirrors CommissionAccordionList but for MonthlyProposalCommission records.
 * Place at: app/components/Commission/MPCommissionAccordionList.tsx
 */

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Eye, Inbox, Loader2, MapPin, RotateCcw, Search } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  getMPCommissions,
  getMPCommissionsByBranch,
  undoMPCommissions,
} from "@/app/features/commissions/actions";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { usePermission } from "@/app/hooks/usePermission";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { toast } from "sonner";
import Loading from "@/app/components/Status/Loading";
import Error from "@/app/components/Status/Error";

// ─── Constants ────────────────────────────────────────────────────────────────

const TYPE_STYLES: Record<string, string> = {
  PERSONAL: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  UPLINE:   "bg-violet-500/10 text-violet-600 border-violet-500/20",
  EXCESS:   "bg-amber-500/10 text-amber-600 border-amber-500/20",
  CHAIRMAN: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  REVERSED: "bg-red-500/10 text-red-500 border-red-500/20 line-through",
};

const PLAN_BADGE: Record<string, string> = {
  CHILD:      "bg-purple-100 text-purple-700 border-purple-200",
  MARGE:      "bg-blue-100 text-blue-700 border-blue-200",
  PENSION:    "bg-amber-100 text-amber-700 border-amber-200",
  RAN_ASWANU: "bg-green-100 text-green-700 border-green-200",
};

const PLAN_LABEL: Record<string, string> = {
  CHILD: "Child Plan", MARGE: "Marriage Plan", PENSION: "Retirement Plan", RAN_ASWANU: "Ran Aswanu",
};

const FREQ_LABEL: Record<string, string> = {
  MONTHLY: "Monthly", QUARTERLY: "Quarterly",
  SEMI_ANNUAL: "Semi-Annual", ANNUAL: "Annual",
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function MPCommissionAccordionList() {
  const queryClient = useQueryClient();
  const [dbUser,       setDbUser]       = useState<any>(null);
  const [userRole,     setUserRole]     = useState<string | null>(null);
  const [searchQuery,  setSearchQuery]  = useState("");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo,   setFilterDateTo]   = useState("");
  const [filterBranch,   setFilterBranch]   = useState("");
  const [undoingId,    setUndoingId]    = useState<number | null>(null);
  const [confirmId,    setConfirmId]    = useState<number | null>(null);

  const canUndo = usePermission(userRole, PERMISSIONS.DELETE_COMMISSIONS);

  useEffect(() => {
    fetch("/api/me").then((r) => r.json()).then(({ dbUser, role }) => {
      setDbUser(dbUser);
      setUserRole(role);
    });
  }, []);

  // Fetch — scoped by role
  const isBranchManager = dbUser?.role === "BRANCH_MANAGER";

  const { data: rawData, isLoading, isError } = useQuery({
    queryKey: ["mp-commissions", dbUser?.branchId],
    queryFn: () =>
      isBranchManager
        ? getMPCommissionsByBranch(dbUser.branchId || 0)
        : getMPCommissions(),
    enabled: !!dbUser,
  });

  const allRows: any[] = rawData || [];

  // ── Group by monthlyProposalId ─────────────────────────────────────────────
  const grouped = allRows.reduce((acc, curr) => {
    const id = curr.monthlyProposal?.id;
    if (!id) return acc;
    if (!acc[id]) {
      acc[id] = {
        proposal:    curr.monthlyProposal,
        branch:      curr.monthlyProposal?.branch,
        commissions: [],
      };
    }
    acc[id].commissions.push(curr);
    return acc;
  }, {} as Record<number, any>);

  const groupedList = Object.values(grouped) as any[];

  const availableBranches = Array.from(
    new Set(groupedList.map((g: any) => g.branch?.name).filter(Boolean))
  );

  // ── Filters ────────────────────────────────────────────────────────────────
  const filteredList = groupedList.filter((group: any) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchName   = group.proposal?.applicantName?.toLowerCase().includes(q);
      const matchFormNo = group.proposal?.proposalFormNo?.toLowerCase().includes(q);
      if (!matchName && !matchFormNo) return false;
    }
    if (filterBranch && group.branch?.name !== filterBranch) return false;
    if (group.commissions?.[0]?.createdAt) {
      const d = new Date(group.commissions[0].createdAt);
      if (filterDateFrom && d < new Date(filterDateFrom)) return false;
      if (filterDateTo) {
        const to = new Date(filterDateTo);
        to.setHours(23, 59, 59, 999);
        if (d > to) return false;
      }
    }
    return true;
  });

  // ── Undo handler ───────────────────────────────────────────────────────────
  const handleUndo = async (proposalId: number) => {
    if (confirmId !== proposalId) { setConfirmId(proposalId); return; }
    setConfirmId(null);
    setUndoingId(proposalId);
    try {
      const res = await undoMPCommissions(proposalId);
      if (res.success) {
        const count = res.reversed ?? 0;
        toast.success(`Commissions reversed (${count} line${count !== 1 ? "s" : ""})`);
        queryClient.invalidateQueries({ queryKey: ["mp-commissions"] });
      } else {
        toast.error(res.error ?? "Failed to undo commissions");
      }
    } catch {
      toast.error("Unexpected error during undo");
    } finally {
      setUndoingId(null);
    }
  };

  if (isLoading) return <Loading />;
  if (isError)   return <Error />;

  return (
    <div className="w-full space-y-4">
      {/* ── Filters ── */}
      <div className="flex flex-col sm:flex-row items-center gap-4 w-full">
        <div className="flex items-center gap-2 flex-1 w-full px-4 py-2 bg-card border border-border rounded-xl shadow-sm focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary/50 transition-all">
          <Search className="w-4 h-4 text-muted-foreground shrink-0" />
          <input
            type="text"
            placeholder="Search by applicant name or proposal number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-transparent border-none outline-none text-sm font-medium text-foreground placeholder:text-muted-foreground/50"
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
          <div className="flex items-center gap-1 bg-card border border-border rounded-xl px-2 shadow-sm">
            <span className="text-[10px] font-bold text-muted-foreground uppercase px-1">From</span>
            <input type="date" value={filterDateFrom} onChange={(e) => setFilterDateFrom(e.target.value)}
              className="py-2 bg-transparent text-sm font-medium text-foreground outline-none border-none" />
          </div>
          <div className="flex items-center gap-1 bg-card border border-border rounded-xl px-2 shadow-sm">
            <span className="text-[10px] font-bold text-muted-foreground uppercase px-1">To</span>
            <input type="date" value={filterDateTo} onChange={(e) => setFilterDateTo(e.target.value)}
              className="py-2 bg-transparent text-sm font-medium text-foreground outline-none border-none" />
          </div>
          <select value={filterBranch} onChange={(e) => setFilterBranch(e.target.value)}
            className="px-3 py-2 bg-card border border-border rounded-xl text-sm font-medium text-foreground outline-none focus:ring-2 focus:ring-primary/20 shadow-sm min-w-[140px]">
            <option value="">All Branches</option>
            {availableBranches.map((b: any) => <option key={b} value={b}>{b}</option>)}
          </select>
        </div>
      </div>

      {/* ── List ── */}
      {filteredList.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground/50 py-20 bg-card rounded-2xl border border-border shadow-sm">
          <Inbox size={40} strokeWidth={1} />
          <p className="text-sm font-bold">No monthly proposal commissions found</p>
        </div>
      ) : (
        <Accordion type="multiple" className="space-y-4">
          {filteredList.map((group: any) => {
            const { proposal, branch, commissions } = group;
            const isProcessed = proposal.commissionsProcessed;
            const isUndoing   = undoingId  === proposal.id;
            const isConfirm   = confirmId  === proposal.id;

            const activeCommissions = commissions.filter((c: any) => c.type !== "REVERSED");
            const total = activeCommissions.reduce((s: number, c: any) => s + (c.amount ?? 0), 0);

            return (
              <AccordionItem
                key={proposal.id}
                value={`mp-${proposal.id}`}
                className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden border-b-0"
              >
                <AccordionTrigger className="px-6 py-4 hover:no-underline hover:bg-muted/30 transition-colors [&[data-state=open]]:border-b border-border">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between w-full gap-4 text-left mr-4">
                    <div>
                      <h3 className="text-sm font-bold text-foreground">
                        {proposal.applicantName || "Unknown"}
                      </h3>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                          {proposal.proposalFormNo || `MP #${proposal.id}`}
                        </span>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-tight border ${PLAN_BADGE[proposal.planType] ?? "bg-muted text-muted-foreground border-border"}`}>
                          {PLAN_LABEL[proposal.planType] ?? proposal.planType}
                        </span>
                        <span className="text-[9px] font-bold text-muted-foreground uppercase">
                          {FREQ_LABEL[proposal.frequency] ?? proposal.frequency}
                        </span>
                        {!isProcessed && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[9px] font-bold bg-amber-500/10 text-amber-600 border border-amber-500/20 uppercase">
                            Reversed
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {branch?.name && (
                        <div className="flex items-center gap-1.5 px-3 py-1 bg-muted rounded-lg border border-border">
                          <MapPin size={12} className="text-primary" />
                          <span className="text-[10px] font-bold text-foreground uppercase tracking-wider">
                            {branch.name}
                          </span>
                        </div>
                      )}
                      <span className="text-xs font-bold text-foreground tabular-nums">
                        Rs. {total.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </AccordionTrigger>

                <AccordionContent className="px-6 pb-6 pt-2">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="py-3 pr-4 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Type</th>
                          <th className="py-3 px-4 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Member</th>
                          <th className="py-3 px-4 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Amount</th>
                          <th className="py-3 pl-4 text-[10px] font-bold uppercase tracking-wider text-muted-foreground text-right">View</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {commissions.map((comm: any) => (
                          <tr key={comm.id} className="hover:bg-muted/50 transition-colors">
                            <td className="py-3 pr-4">
                              <span className={`inline-flex items-center px-2 py-1 rounded text-[9px] font-bold uppercase tracking-widest border ${TYPE_STYLES[comm.type] ?? "bg-muted text-muted-foreground border-border"}`}>
                                {comm.type}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <div className="text-xs font-bold text-foreground">{comm.member?.nameWithInitials || "Unknown"}</div>
                              <div className="text-[9px] text-muted-foreground uppercase tracking-wider">{comm.member?.empNo}</div>
                              {comm.member?.position?.title && (
                                <div className="text-[9px] text-muted-foreground/60">{comm.member.position.title}</div>
                              )}
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex items-baseline gap-1">
                                <span className="text-[9px] font-bold text-primary uppercase">Rs.</span>
                                <span className={`text-xs font-bold tabular-nums ${comm.type === "REVERSED" ? "text-red-500 line-through" : "text-foreground"}`}>
                                  {Math.abs(comm.amount)?.toLocaleString()}
                                </span>
                              </div>
                            </td>
                            <td className="py-3 pl-4 text-right">
                              <Link
                                href={`/features/monthly-proposals/${proposal.id}`}
                                className="inline-flex p-1.5 text-muted-foreground hover:text-primary hover:bg-muted rounded-lg border border-transparent hover:border-border transition-all"
                              >
                                <Eye size={14} />
                              </Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Undo — only when processed and user has permission */}
                  {canUndo && isProcessed && (
                    <div className="mt-4 flex justify-end">
                      {isConfirm ? (
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">Confirm undo?</span>
                          <button
                            onClick={() => setConfirmId(null)}
                            className="px-3 py-1.5 text-xs font-bold border border-border rounded-lg hover:bg-muted transition-colors"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handleUndo(proposal.id)}
                            disabled={isUndoing}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                          >
                            {isUndoing ? <Loader2 size={12} className="animate-spin" /> : <RotateCcw size={12} />}
                            Yes, Undo
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleUndo(proposal.id)}
                          disabled={isUndoing}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
                        >
                          {isUndoing ? <Loader2 size={12} className="animate-spin" /> : <RotateCcw size={12} />}
                          Undo Commissions
                        </button>
                      )}
                    </div>
                  )}
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      )}
    </div>
  );
}