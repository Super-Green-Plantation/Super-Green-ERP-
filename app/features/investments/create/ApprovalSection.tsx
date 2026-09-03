"use client";

import { useState } from "react";
import { Check, Loader2, X, AlertTriangle, CheckCircle2, Receipt, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";
import { SectionHeader } from "./ui";
import AdvisorHierarchy from "./AdvisorHierarchy";
import { approveInvestmentWithHierarchyLog } from "../../hr/salary/action";
import { rejectInvestment } from "@/app/features/investments/actions";
import { HierarchyState } from "./types";

// ─── Types ─────────────────────────────────────────────────────────────────

type CommissionLine = {
  id: number;
  type: "PERSONAL" | "UPLINE" | "EXCESS" | "CHAIRMAN";
  amount: number;
  member: {
    empNo: string;
    nameWithInitials: string | null;
    position: { title: string } | null;
  };
};

type ModalState =
  | { kind: "success"; commissions: CommissionLine[]; investmentRef: string }
  | { kind: "comm_error"; approvalOk: true; commError: string }
  | { kind: "approval_error"; error: string }
  | null;

// ─── Helpers ───────────────────────────────────────────────────────────────

function fmt(amount: number) {
  return new Intl.NumberFormat("en-LK", {
    style: "currency",
    currency: "LKR",
    maximumFractionDigits: 2,
  }).format(amount);
}

const TYPE_LABEL: Record<string, string> = {
  PERSONAL: "Personal",
  UPLINE:   "Upline / ORC",
  EXCESS:   "Excess",
  CHAIRMAN: "Chairman",
};

const TYPE_COLOR: Record<string, string> = {
  PERSONAL: "bg-emerald-100 text-emerald-700",
  UPLINE:   "bg-blue-100 text-blue-700",
  EXCESS:   "bg-amber-100 text-amber-700",
  CHAIRMAN: "bg-purple-100 text-purple-700",
};

// ─── Result Modal ──────────────────────────────────────────────────────────

function ResultModal({ state, onClose }: { state: NonNullable<ModalState>; onClose: () => void }) {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm px-4 animate-in fade-in duration-200">
      <div
        className="w-full max-w-lg bg-card border border-border rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header ── */}
        {state.kind === "success" && (
          <div className="flex items-center gap-3 px-6 py-4 bg-emerald-600 text-white">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <div className="flex-1">
              <p className="font-bold text-sm uppercase tracking-wide">Investment Approved</p>
              <p className="text-xs text-emerald-200">Volume recorded — commissions calculate at month-end payroll</p>
            </div>
            <button onClick={onClose} className="p-1 hover:bg-emerald-700 rounded-lg transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {state.kind === "comm_error" && (
          <div className="flex items-center gap-3 px-6 py-4 bg-amber-500 text-white">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <div className="flex-1">
              <p className="font-bold text-sm uppercase tracking-wide">Investment Approved</p>
              <p className="text-xs text-amber-100">Commission processing failed — action required</p>
            </div>
            <button onClick={onClose} className="p-1 hover:bg-amber-600 rounded-lg transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {state.kind === "approval_error" && (
          <div className="flex items-center gap-3 px-6 py-4 bg-red-600 text-white">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <div className="flex-1">
              <p className="font-bold text-sm uppercase tracking-wide">Approval Failed</p>
              <p className="text-xs text-red-200">The investment was not approved</p>
            </div>
            <button onClick={onClose} className="p-1 hover:bg-red-700 rounded-lg transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ── Body ── */}
        <div className="p-6 space-y-4">

          {/* SUCCESS — commission receipt */}
          {state.kind === "success" && (
            <>
              {/* Toggle receipt */}
              <button
                onClick={() => setExpanded((v) => !v)}
                className="w-full flex items-center justify-between text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
              >
                <span className="flex items-center gap-2">
                  <Receipt className="w-3.5 h-3.5" />
                  Commission Receipt ({state.commissions.length} line{state.commissions.length !== 1 ? "s" : ""})
                  {state.commissions.length === 0 ? " — calculated at month-end" : ""}
                </span>
                {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              {expanded && (
                <div className="border border-border rounded-xl overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-muted/50">
                        <th className="text-left px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Member</th>
                        <th className="text-center px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Type</th>
                        <th className="text-right px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {state.commissions.map((c) => (
                        <tr key={c.id} className="hover:bg-muted/20 transition-colors">
                          <td className="px-4 py-3">
                            <p className="font-semibold text-foreground text-xs">{c.member.nameWithInitials ?? c.member.empNo}</p>
                            <p className="text-[10px] text-muted-foreground">{c.member.position?.title ?? ""} · {c.member.empNo}</p>
                          </td>
                          <td className="px-3 py-3 text-center">
                            <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${TYPE_COLOR[c.type] ?? "bg-muted text-muted-foreground"}`}>
                              {TYPE_LABEL[c.type] ?? c.type}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right font-bold text-foreground text-xs tabular-nums">
                            {fmt(c.amount)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-muted/30">
                        <td colSpan={2} className="px-4 py-2 text-xs font-bold text-muted-foreground uppercase">Total</td>
                        <td className="px-4 py-2 text-right text-sm font-bold text-foreground tabular-nums">
                          {fmt(state.commissions.reduce((s, c) => s + c.amount, 0))}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </>
          )}

          {/* COMMISSION ERROR */}
          {state.kind === "comm_error" && (
            <div className="space-y-3">
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-2">
                <p className="text-sm font-semibold text-amber-800">
                  The investment was approved successfully, but commissions could not be processed automatically.
                </p>
                <p className="text-xs text-amber-700 font-mono bg-amber-100 rounded-lg px-3 py-2 break-words">
                  {state.commError}
                </p>
              </div>
              <div className="bg-muted/40 border border-border rounded-xl p-4">
                <p className="text-xs text-muted-foreground">
                  <span className="font-bold text-foreground">Next step:</span> Go to the{" "}
                  <span className="font-semibold text-foreground">Commissions</span> page, find this investment,
                  and process commissions manually. The investment status is already <span className="font-bold text-emerald-600">APPROVED</span>.
                </p>
              </div>
            </div>
          )}

          {/* APPROVAL ERROR */}
          {state.kind === "approval_error" && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 space-y-2">
              <p className="text-sm font-semibold text-red-800">
                The investment could not be approved. No changes were made.
              </p>
              <p className="text-xs text-red-700 font-mono bg-red-100 rounded-lg px-3 py-2 break-words">
                {state.error}
              </p>
            </div>
          )}

        </div>

        {/* ── Footer ── */}
        <div className="px-6 pb-5 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-foreground text-background rounded-xl text-xs font-bold uppercase tracking-wider hover:opacity-80 transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────

export default function ApprovalSection({
  investmentId,
  hierarchy,
  onHierarchyChange,
  advisorId,
  reviewNote,
  onReviewNoteChange,
  userData,
  isUpdating,
  onSuccess,
}: {
  investmentId: number;
  hierarchy: HierarchyState;
  onHierarchyChange: (key: keyof HierarchyState, id: number | null) => void;
  advisorId: number | null;
  reviewNote: string;
  onReviewNoteChange: (v: string) => void;
  userData: any;
  isUpdating: boolean;
  onSuccess?: () => void;
}) {
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [modal, setModal] = useState<ModalState>(null);

  const handleApprove = async () => {
    setIsApproving(true);
    const res = await approveInvestmentWithHierarchyLog({
      investmentId,
      advisorId,
      ...hierarchy,
      reviewNote,
    });
    setIsApproving(false);

    if (!res.success) {
      setModal({ kind: "approval_error", error: res.error ?? "Failed to approve investment." });
      return;
    }

    if (res.commissionError) {
      setModal({ kind: "comm_error", approvalOk: true, commError: res.commissionError });
      // still fire onSuccess so the parent refreshes the investment status
      onSuccess?.();
      return;
    }

    // Success — parse receipt
    const result = res as typeof res & { commissionReceipt?: any };
    const rawCommissions: CommissionLine[] =
      result.commissionReceipt?.commissions ?? result.commissionReceipt?.receipt?.commissions ?? [];

    setModal({
      kind: "success",
      commissions: rawCommissions,
      investmentRef: res.investment?.refNumber ?? "",
    });
    onSuccess?.();
  };

  const handleReject = async () => {
    if (!reviewNote.trim()) {
      toast.warning("A review note is required to reject this investment.");
      return;
    }
    setIsRejecting(true);
    const res = await rejectInvestment({ investmentId, reviewNote });
    setIsRejecting(false);
    if (res.success) {
      toast.success("Investment has been successfully rejected.");
      onSuccess?.();
    } else {
      toast.error(res.error || "Failed to reject investment.");
    }
  };

  return (
    <>
      {modal && <ResultModal state={modal} onClose={() => setModal(null)} />}

      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden mt-8">
        <div className="px-6 py-4 border-b border-border">
          <SectionHeader icon={<Check className="w-[20px] h-[20px]" />} title="Management Approval Hierarchy" />
        </div>
        <div className="flex flex-col">
          <div className="p-6">
            <AdvisorHierarchy
              values={hierarchy}
              onChange={onHierarchyChange}
              hideCard
            />
          </div>

          <div className="px-6 pb-6 space-y-2">
            <label className="text-[11px] font-bold text-muted-foreground uppercase block">
              Review Note
            </label>
            <textarea
              value={reviewNote}
              onChange={e => onReviewNoteChange(e.target.value)}
              placeholder="Add comments or rejection reason..."
              className="w-full bg-background border border-border rounded-lg text-sm py-3 px-4 focus:ring-1 focus:ring-primary focus:border-primary shadow-inner outline-none transition-all"
              rows={3}
            />
          </div>

          <div className="px-6 py-4 bg-muted/30 border-t border-border flex flex-col md:flex-row gap-4 items-center">
            <div className="flex-1 text-[11px] font-bold text-muted-foreground uppercase">
              Reviewing as: <span className="text-foreground ml-1">{userData?.name}</span>
            </div>
            <div className="flex gap-3 w-full md:w-auto">
              <button
                type="button"
                onClick={handleApprove}
                disabled={isApproving || isRejecting || isUpdating}
                className="flex-1 md:flex-none px-8 py-3 bg-[#0f5132] text-white rounded-lg font-bold text-sm flex items-center justify-center gap-2 hover:brightness-95 active:scale-95 transition-all disabled:opacity-50"
              >
                {isApproving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                APPROVE
              </button>
              <button
                type="button"
                onClick={handleReject}
                disabled={isApproving || isRejecting || isUpdating}
                className="flex-1 md:flex-none px-8 py-3 bg-red-600 text-white rounded-lg font-bold text-sm flex items-center justify-center gap-2 hover:brightness-95 active:scale-95 transition-all disabled:opacity-50"
              >
                {isRejecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
                REJECT
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}