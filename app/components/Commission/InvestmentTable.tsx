"use client";
import { useCommission } from "@/app/hooks/useCommission";
import { Eye, Inbox, Loader2, MapPin, RotateCcw } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import Error from "../Status/Error";
import Loading from "../Status/Loading";
import { getCommissionByBranch } from "@/app/features/commissions/actions";
import { undoCommissions } from "@/app/features/commissions/process";
import { usePermission } from "@/app/hooks/usePermission";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

export default function InvestmentTable() {
  const { data: investments, isLoading, isError } = useCommission();
  const queryClient = useQueryClient();
  const [dbUser, setDbUser]           = useState<any>(null);
  const [userRole, setUserRole]       = useState<string | null>(null);
  const [investmentData, setInvestmentData] = useState<any[]>([]);
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

  // Deduplicate to one row per investment
  const seen = new Set<number>();
  const uniqueRows = investmentData.filter((item: any) => {
    const id = item.investment?.id;
    if (!id || seen.has(id)) return false;
    seen.add(id);
    return true;
  });

  return (
    <div className="w-full overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-muted/30 border-b border-slate-200">
              <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">ID</th>
              <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Branch</th>
              <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Member / Client</th>
              <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Plan</th>
              <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Amount</th>
              <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-muted-foreground text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {uniqueRows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-20">
                  <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground/50">
                    <Inbox size={40} strokeWidth={1} />
                    <p className="text-sm font-bold">No investments found</p>
                  </div>
                </td>
              </tr>
            )}
            {uniqueRows.map((item: any) => {
              const invId       = item.investment?.id;
              const isProcessed = item.investment?.commissionsProcessed;
              const isUndoing   = undoingId === invId;
              const isConfirm   = confirmId === invId;

              return (
                <tr key={invId} className="hover:bg-muted/50 transition-colors group">
                  <td className="px-6 py-4">
                    <span className="text-xs font-bold text-muted-foreground tabular-nums">#{invId}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 bg-primary/10 text-primary rounded-lg flex items-center justify-center border border-primary/20">
                        <MapPin size={14} />
                      </div>
                      <span className="text-sm font-bold text-foreground tracking-tight">{item.Branch?.name || "N/A"}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-0.5">
                      <div className="text-sm font-bold text-foreground">{item.member?.nameWithInitials || "System"}</div>
                      <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-tight">
                        <span className="text-muted-foreground/70">Client:</span> {item.investment?.client?.fullName || "N/A"}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold bg-primary/10 text-primary border border-primary/20 uppercase tracking-tight">
                      {item.investment?.plan?.name || "N/A"}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-baseline gap-1">
                      <span className="text-[10px] font-bold text-primary uppercase">Rs.</span>
                      <span className="text-sm font-bold text-foreground tabular-nums">
                        {item.amount?.toLocaleString()}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-end items-center gap-2">
                      <Link
                        href={`/features/commissions/${item.id}/details`}
                        className="p-2 text-muted-foreground hover:text-blue-600 hover:bg-white hover:shadow-md border border-transparent hover:border-slate-200 rounded-xl transition-all"
                      >
                        <Eye size={18} />
                      </Link>

                      {canUndo && isProcessed && (
                        isConfirm ? (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => setConfirmId(null)}
                              className="px-2 py-1.5 text-[10px] font-bold border border-border rounded-lg hover:bg-muted transition-colors"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => handleUndo(invId)}
                              disabled={isUndoing}
                              className="flex items-center gap-1 px-2 py-1.5 text-[10px] font-bold bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                            >
                              {isUndoing ? <Loader2 size={11} className="animate-spin" /> : <RotateCcw size={11} />}
                              Confirm
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleUndo(invId)}
                            disabled={isUndoing}
                            title="Undo commissions"
                            className="p-2 text-red-500 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-200 rounded-xl transition-all disabled:opacity-50"
                          >
                            {isUndoing ? <Loader2 size={18} className="animate-spin" /> : <RotateCcw size={18} />}
                          </button>
                        )
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}