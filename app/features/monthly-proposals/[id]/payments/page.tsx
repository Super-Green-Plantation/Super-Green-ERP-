"use client";

/**
 * /features/monthly-proposals/[id]/payments/page.tsx
 * Premium payment tracker for a single monthly proposal.
 */

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  ArrowLeft, CheckCircle2, Clock, AlertCircle,
  RotateCcw, DollarSign, Filter,
} from "lucide-react";
import {
  getProposalPayments,
  reverseProposalPayment,
} from "../../actions";
import RecordPaymentModal from "@/app/components/MonthlyProposals/RecordPaymentModal";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const FREQ_LABEL: Record<string, string> = {
  MONTHLY: "Monthly", QUARTERLY: "Quarterly",
  SEMI_ANNUAL: "Semi-Annual", ANNUAL: "Annual",
};
const PLAN_LABEL: Record<string, string> = {
  CHILD: "Child Plan", MARGE: "Marriage Plan", PENSION: "Retirement Plan",
};
const STATUS_COLORS: Record<string, string> = {
  PENDING:   "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
  ACTIVE:    "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400",
  COMPLETED: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400",
  MATURED:   "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-400",
  LAPSED:    "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400",
  CANCELLED: "bg-gray-200 text-gray-500",
};

const fmt = (n: number) =>
  `Rs. ${Number(n || 0).toLocaleString("en-LK", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

type FilterType = "ALL" | "PAID" | "OVERDUE" | "UPCOMING";

function getSlotStatus(slot: any): "PAID" | "OVERDUE" | "UPCOMING" {
  if (slot.paidAmount !== null) return "PAID";
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const due   = new Date(slot.dueDate);
  return due <= today ? "OVERDUE" : "UPCOMING";
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function PaymentsPage() {
  const params = useParams<{ id: string }>();
  const proposalId = Number(params.id);
  const queryClient = useQueryClient();

  const [filter,       setFilter]       = useState<FilterType>("ALL");
  const [activeSlot,   setActiveSlot]   = useState<any | null>(null);  // for RecordPaymentModal
  const [confirmReverse, setConfirmReverse] = useState<number | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ["proposal-payments", proposalId],
    queryFn:  () => getProposalPayments(proposalId),
    enabled:  Number.isFinite(proposalId),
  });

  const reverseMutation = useMutation({
    mutationFn: (paymentId: number) => reverseProposalPayment(paymentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["proposal-payments", proposalId] });
      queryClient.invalidateQueries({ queryKey: ["monthly-proposal",  proposalId] });
      toast.success("Payment reversed");
      setConfirmReverse(null);
    },
    onError: (e: any) => toast.error(e.message || "Reverse failed"),
  });

  if (isLoading) return (
    <main className="p-8 text-sm text-muted-foreground">Loading payment schedule…</main>
  );
  if (error || !data) return (
    <main className="p-8 text-sm text-destructive">Unable to load payments.</main>
  );

  const { proposal, payments } = data as any;

  // ── Derived counts ────────────────────────────────────────────────────────
  const paid     = payments.filter((p: any) => p.paidAmount !== null).length;
  const overdue  = payments.filter((p: any) => getSlotStatus(p) === "OVERDUE").length;
  const upcoming = payments.filter((p: any) => getSlotStatus(p) === "UPCOMING").length;
  const total    = payments.length;
  const paidPct  = total > 0 ? Math.round((paid / total) * 100) : 0;
  const paidAmt  = payments.reduce((sum: number, p: any) => sum + (p.paidAmount ?? 0), 0);

  const filtered = filter === "ALL"
    ? payments
    : payments.filter((p: any) => getSlotStatus(p) === filter);

  return (
    <main className="mx-auto min-h-screen w-full max-w-[1200px] space-y-5 px-4 pb-12 pt-6 sm:px-7">

      {/* ── Page header ── */}
      <header className="flex flex-col gap-4 border-b border-border/70 pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Link
            href={`/features/monthly-proposals/${proposalId}`}
            className="mb-3 inline-flex items-center gap-1 text-xs font-bold text-muted-foreground hover:text-primary"
          >
            <ArrowLeft size={14} /> Back to proposal
          </Link>
          <h1 className="text-2xl font-black tracking-tight">
            Payment Schedule
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {proposal.proposalFormNo} · {PLAN_LABEL[proposal.planType]} · {proposal.applicantName}
          </p>
        </div>
        <span className={`self-start sm:self-auto px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${STATUS_COLORS[proposal.status] ?? ""}`}>
          {proposal.status}
        </span>
      </header>

      {/* ── Summary cards ── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Total Installments" value={String(total)}        color="text-card-foreground" />
        <StatCard label="Paid"                value={String(paid)}         color="text-green-600" />
        <StatCard label="Overdue"             value={String(overdue)}      color="text-red-600" />
        <StatCard label="Upcoming"            value={String(upcoming)}     color="text-muted-foreground" />
      </div>

      {/* ── Progress bar ── */}
      <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm space-y-2">
        <div className="flex justify-between text-xs font-semibold text-muted-foreground">
          <span>Progress — {paid} of {total} payments ({paidPct}%)</span>
          <span className="text-primary font-bold">{fmt(paidAmt)} collected</span>
        </div>
        <div className="h-3 bg-muted/40 rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-500"
            style={{ width: `${paidPct}%` }}
          />
        </div>
        <div className="flex gap-4 text-[10px] text-muted-foreground font-semibold pt-1">
          <span>Premium: {fmt(proposal.premium)} / {FREQ_LABEL[proposal.frequency]}</span>
          {proposal.activatedAt && (
            <span>Activated: {new Date(proposal.activatedAt).toLocaleDateString()}</span>
          )}
          {proposal.maturityDate && (
            <span>Maturity: {new Date(proposal.maturityDate).toLocaleDateString()}</span>
          )}
        </div>
      </div>

      {/* ── Filter tabs ── */}
      <div className="flex gap-2 flex-wrap">
        {(["ALL", "PAID", "OVERDUE", "UPCOMING"] as FilterType[]).map((f) => {
          const count = f === "ALL" ? total : f === "PAID" ? paid : f === "OVERDUE" ? overdue : upcoming;
          return (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all border ${
                filter === f
                  ? "bg-primary text-primary-foreground border-primary shadow"
                  : "bg-muted/20 text-muted-foreground border-border hover:border-primary/50"
              }`}
            >
              {f === "OVERDUE" && <AlertCircle size={11} />}
              {f === "PAID"    && <CheckCircle2 size={11} />}
              {f === "UPCOMING"&& <Clock size={11} />}
              {f} <span className="opacity-70">({count})</span>
            </button>
          );
        })}
        <span className="ml-auto flex items-center gap-1 text-[10px] text-muted-foreground px-2">
          <Filter size={10} /> {filtered.length} shown
        </span>
      </div>

      {/* ── Payment table ── */}
      <div className="overflow-x-auto rounded-2xl border border-border/70 bg-card shadow-sm">
        <table className="min-w-[860px] w-full text-left text-sm">
          <thead className="bg-muted/30 text-[10px] uppercase tracking-widest text-muted-foreground">
            <tr>
              {["#", "Due Date", "Status", "Paid Amount", "Paid On", "Method", "Receipt", "Recorded By", "Actions"].map((h) => (
                <th key={h} className="px-4 py-3 font-black">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-4 py-12 text-center text-muted-foreground">
                  No {filter.toLowerCase()} payments.
                </td>
              </tr>
            ) : (
              filtered.map((slot: any) => {
                const status = getSlotStatus(slot);
                return (
                  <tr key={slot.id} className={`hover:bg-muted/20 ${status === "OVERDUE" ? "bg-red-50/40 dark:bg-red-950/10" : ""}`}>
                    <td className="px-4 py-3 font-bold text-muted-foreground">
                      {slot.installmentNo}
                    </td>
                    <td className="px-4 py-3 font-semibold">
                      {new Date(slot.dueDate).toLocaleDateString("en-LK", { year: "numeric", month: "short", day: "numeric" })}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={status} />
                    </td>
                    <td className="px-4 py-3 font-semibold">
                      {slot.paidAmount !== null ? fmt(slot.paidAmount) : "—"}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {slot.paidAt ? new Date(slot.paidAt).toLocaleDateString() : "—"}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {slot.paymentMethod || "—"}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground font-mono text-xs">
                      {slot.receiptNo || "—"}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">
                      {slot.recordedBy?.nameWithInitials || "—"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        {status !== "PAID" && (
                          <button
                            title="Record Payment"
                            onClick={() => setActiveSlot(slot)}
                            className="flex items-center gap-1 px-2.5 py-1.5 bg-primary/10 text-primary hover:bg-primary hover:text-white rounded-lg text-xs font-semibold transition-colors"
                          >
                            <DollarSign size={12} /> Pay
                          </button>
                        )}
                        {status === "PAID" && (
                          <button
                            title="Reverse Payment (Admin)"
                            onClick={() => setConfirmReverse(slot.id)}
                            className="p-1.5 text-muted-foreground/40 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <RotateCcw size={13} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ── Record Payment Modal ── */}
      {activeSlot && (
        <RecordPaymentModal
          slot={{ ...activeSlot, monthlyProposalId: proposalId }}
          defaultAmount={proposal.premium}
          onClose={() => setActiveSlot(null)}
        />
      )}

      {/* ── Reverse Confirm ── */}
      {confirmReverse !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
          onClick={() => setConfirmReverse(null)}
        >
          <div
            className="bg-card rounded-2xl shadow-2xl p-6 max-w-sm w-full animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-base font-bold text-card-foreground mb-1">Reverse Payment</h3>
            <p className="text-sm text-muted-foreground mb-5">
              This will mark the installment as unpaid. This action is admin-only and auditable.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmReverse(null)}
                className="flex-1 py-2.5 border border-border rounded-xl text-sm font-semibold text-muted-foreground hover:bg-muted/30"
              >
                Cancel
              </button>
              <button
                onClick={() => reverseMutation.mutate(confirmReverse)}
                disabled={reverseMutation.isPending}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-semibold disabled:opacity-50"
              >
                {reverseMutation.isPending ? "Reversing…" : "Reverse"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="rounded-2xl border border-border/70 bg-card p-4 shadow-sm">
      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className={`mt-1 text-2xl font-black ${color}`}>{value}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: "PAID" | "OVERDUE" | "UPCOMING" }) {
  if (status === "PAID")     return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400 text-[10px] font-bold uppercase">
      <CheckCircle2 size={9} /> Paid
    </span>
  );
  if (status === "OVERDUE")  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400 text-[10px] font-bold uppercase">
      <AlertCircle size={9} /> Overdue
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted/40 text-muted-foreground text-[10px] font-bold uppercase">
      <Clock size={9} /> Upcoming
    </span>
  );
}