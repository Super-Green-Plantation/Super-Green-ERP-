"use client";
import { useCommission } from "@/app/hooks/useCommission";
import { Eye, Inbox, Loader2, MapPin, RotateCcw, Search } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import Error from "../Status/Error";
import Loading from "../Status/Loading";
import { getCommissionByBranch } from "@/app/features/commissions/actions";
import { undoCommissions } from "@/app/features/commissions/process";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { usePermission } from "@/app/hooks/usePermission";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

const TYPE_STYLES: Record<string, string> = {
  PERSONAL:  "bg-blue-500/10 text-blue-600 border-blue-500/20",
  UPLINE:    "bg-violet-500/10 text-violet-600 border-violet-500/20",
  EXCESS:    "bg-amber-500/10 text-amber-600 border-amber-500/20",
  CHAIRMAN:  "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  REVERSED:  "bg-red-500/10 text-red-500 border-red-500/20 line-through",
};

export default function CommissionAccordionList() {
  const { data: investments, isLoading, isError } = useCommission();
  const queryClient = useQueryClient();
  const [dbUser, setDbUser]           = useState<any>(null);
  const [userRole, setUserRole]       = useState<string | null>(null);
  const [investmentData, setInvestmentData] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo]     = useState("");
  const [filterBranch, setFilterBranch]     = useState("");
  const [undoingId, setUndoingId]     = useState<number | null>(null);
  const [confirmId, setConfirmId]     = useState<number | null>(null);

  const canUndo = usePermission(userRole, PERMISSIONS.DELETE_COMMISSIONS);

  useEffect(() => {
    fetch("/api/me").then((r) => r.json()).then(({ dbUser, role }) => {
      setDbUser(dbUser);
      setUserRole(role);
    });
  }, []);

  useEffect(() => {
    if (!dbUser) return;
    const load = async () => {
      if (dbUser.role === "BRANCH_MANAGER") {
        setInvestmentData(await getCommissionByBranch(dbUser.branchId || 0) || []);
      } else {
        setInvestmentData(investments || []);
      }
    };
    load();
  }, [dbUser, investments]);

  const handleUndo = async (investmentId: number) => {
    if (confirmId !== investmentId) {
      setConfirmId(investmentId);
      return;
    }
    setConfirmId(null);
    setUndoingId(investmentId);
    try {
      const res = await undoCommissions(investmentId);
      if (res.success) {
        const count = "reversed" in res ? res.reversed : 0;
        toast.success(`Commissions reversed (${count} line${count !== 1 ? "s" : ""})`);
        queryClient.invalidateQueries({ queryKey: ["commissions"] });
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

  // Group by investmentId
  const grouped = investmentData.reduce((acc, curr) => {
    const id = curr.investment?.id;
    if (!id) return acc;
    if (!acc[id]) acc[id] = { investment: curr.investment, branch: curr.Branch, commissions: [] };
    acc[id].commissions.push(curr);
    return acc;
  }, {} as Record<number, any>);

  const groupedList = Object.values(grouped) as any[];
  const availableBranches = Array.from(new Set(groupedList.map((g: any) => g.branch?.name).filter(Boolean)));

  const filteredList = groupedList.filter((group: any) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (
        !group.investment.client?.fullName?.toLowerCase().includes(q) &&
        !group.investment.client?.nic?.toLowerCase().includes(q)
      ) return false;
    }
    if (filterBranch && group.branch?.name !== filterBranch) return false;
    if (group.investment?.investmentDate) {
      const d = new Date(group.investment.investmentDate);
      if (filterDateFrom && d < new Date(filterDateFrom)) return false;
      if (filterDateTo) {
        const to = new Date(filterDateTo);
        to.setHours(23, 59, 59, 999);
        if (d > to) return false;
      }
    }
    return true;
  });

  return (
    <div className="w-full space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-center gap-4 w-full">
        <div className="flex items-center gap-2 flex-1 w-full px-4 py-2 bg-card border border-border rounded-xl shadow-sm focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary/50 transition-all">
          <Search className="w-4 h-4 text-muted-foreground shrink-0" />
          <input
            type="text"
            placeholder="Search by client name or NIC..."
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

      {filteredList.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground/50 py-20 bg-card rounded-2xl border border-border shadow-sm">
          <Inbox size={40} strokeWidth={1} />
          <p className="text-sm font-bold">No investments found</p>
        </div>
      ) : (
        <Accordion type="multiple" className="space-y-4">
          {filteredList.map((group: any) => {
            const { investment, branch, commissions } = group;
            const isProcessed = investment.commissionsProcessed;
            const isUndoing   = undoingId === investment.id;
            const isConfirm   = confirmId === investment.id;

            // Filter out REVERSED lines from display total
            const activeCommissions = commissions.filter((c: any) => c.type !== "REVERSED");
            const total = activeCommissions.reduce((s: number, c: any) => s + (c.amount ?? 0), 0);

            return (
              <AccordionItem
                key={investment.id}
                value={`inv-${investment.id}`}
                className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden border-b-0"
              >
                <AccordionTrigger className="px-6 py-4 hover:no-underline hover:bg-muted/30 transition-colors [&[data-state=open]]:border-b border-border">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between w-full gap-4 text-left mr-4">
                    <div>
                      <h3 className="text-sm font-bold text-foreground">
                        {investment.client?.fullName || "Unknown Client"}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                          INV #{investment.id}
                        </span>
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[9px] font-bold bg-primary/10 text-primary border border-primary/20 uppercase tracking-tight">
                          {investment.plan?.name || "N/A"}
                        </span>
                        {!isProcessed && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[9px] font-bold bg-amber-500/10 text-amber-600 border border-amber-500/20 uppercase">
                            Reversed
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1.5 px-3 py-1 bg-muted rounded-lg border border-border">
                        <MapPin size={12} className="text-primary" />
                        <span className="text-[10px] font-bold text-foreground uppercase tracking-wider">
                          {branch?.name || "N/A"}
                        </span>
                      </div>
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
                          <th className="py-3 pl-4 text-[10px] font-bold uppercase tracking-wider text-muted-foreground text-right">Details</th>
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
                                href={`/features/commissions/${comm.id}/details`}
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

                  {/* Undo button — only when commissions are processed and user has permission */}
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
                            onClick={() => handleUndo(investment.id)}
                            disabled={isUndoing}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                          >
                            {isUndoing ? <Loader2 size={12} className="animate-spin" /> : <RotateCcw size={12} />}
                            Yes, Undo
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleUndo(investment.id)}
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