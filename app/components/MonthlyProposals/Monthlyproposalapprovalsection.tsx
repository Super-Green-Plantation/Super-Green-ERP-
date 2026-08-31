"use client";

/**
 * MonthlyProposalApprovalSection
 *
 * Drop-in replacement for ApprovalSection on the monthly proposal detail page.
 * Reuses AdvisorHierarchy (same component) but calls the MP-specific approve/reject
 * actions instead of the investment ones.
 *
 * Place at: app/components/MonthlyProposals/MonthlyProposalApprovalSection.tsx
 *
 * Usage in [id]/page.tsx:
 *   <MonthlyProposalApprovalSection
 *     proposalId={id}
 *     hierarchy={hierarchy}
 *     onHierarchyChange={handleHierarchyChange}
 *     reviewNote={reviewNote}
 *     onReviewNoteChange={setReviewNote}
 *     userData={userData}
 *     onSuccess={() => queryClient.invalidateQueries({ queryKey: ["monthly-proposal", id] })}
 *   />
 */

import { useState } from "react";
import {
  Check, Loader2, X, AlertTriangle, CheckCircle2,
  Receipt, ChevronDown, ChevronUp,
} from "lucide-react";
import { toast } from "sonner";
import AdvisorHierarchy from "@/app/features/investments/create/AdvisorHierarchy";
import {
  approveMonthlyProposalWithHierarchy,
  rejectMonthlyProposal,
} from "@/app/features/monthly-proposals/actions";
import { HierarchyState } from "@/app/features/investments/create/types";

// ─── Types ────────────────────────────────────────────────────────────────────

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
  | { kind: "success";        commissions: CommissionLine[] }
  | { kind: "comm_error";     approvalOk: true; commError: string }
  | { kind: "approval_error"; error: string }
  | null;

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (n: number) =>
  new Intl.NumberFormat("en-LK", {
    style: "currency", currency: "LKR", maximumFractionDigits: 2,
  }).format(n);

const TYPE_LABEL: Record<string, string> = {
  PERSONAL: "Personal", UPLINE: "Upline / ORC",
  EXCESS: "Excess", CHAIRMAN: "Chairman",
};
const TYPE_COLOR: Record<string, string> = {
  PERSONAL: "bg-emerald-100 text-emerald-700",
  UPLINE:   "bg-blue-100 text-blue-700",
  EXCESS:   "bg-amber-100 text-amber-700",
  CHAIRMAN: "bg-purple-100 text-purple-700",
};

// ─── Result Modal ─────────────────────────────────────────────────────────────

function ResultModal({ state, onClose }: { state: NonNullable<ModalState>; onClose: () => void }) {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm px-4 animate-in fade-in duration-200">
      <div
        className="w-full max-w-lg bg-card border border-border rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        {state.kind === "success" && (
          <div className="flex items-center gap-3 px-6 py-4 bg-emerald-600 text-white">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <div className="flex-1">
              <p className="font-bold text-sm uppercase tracking-wide">Proposal Approved</p>
              <p className="text-xs text-emerald-200">Commissions processed successfully</p>
            </div>
            <button onClick={onClose} className="p-1 hover:bg-emerald-700 rounded-lg">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
        {state.kind === "comm_error" && (
          <div className="flex items-center gap-3 px-6 py-4 bg-amber-500 text-white">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <div className="flex-1">
              <p className="font-bold text-sm uppercase tracking-wide">Proposal Approved</p>
              <p className="text-xs text-amber-100">Commission processing failed — action required</p>
            </div>
            <button onClick={onClose} className="p-1 hover:bg-amber-600 rounded-lg">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
        {state.kind === "approval_error" && (
          <div className="flex items-center gap-3 px-6 py-4 bg-red-600 text-white">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <div className="flex-1">
              <p className="font-bold text-sm uppercase tracking-wide">Approval Failed</p>
              <p className="text-xs text-red-200">The proposal was not approved</p>
            </div>
            <button onClick={onClose} className="p-1 hover:bg-red-700 rounded-lg">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Body */}
        <div className="p-6 space-y-4">
          {state.kind === "success" && (
            <>
              <button
                onClick={() => setExpanded((v) => !v)}
                className="w-full flex items-center justify-between text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground"
              >
                <span className="flex items-center gap-2">
                  <Receipt className="w-3.5 h-3.5" />
                  Commission Receipt ({state.commissions.length} line{state.commissions.length !== 1 ? "s" : ""})
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
                        <tr key={c.id} className="hover:bg-muted/20">
                          <td className="px-4 py-3">
                            <p className="font-semibold text-foreground text-xs">{c.member.nameWithInitials ?? c.member.empNo}</p>
                            <p className="text-[10px] text-muted-foreground">
                              {c.member.position?.title ?? ""} · {c.member.empNo}
                            </p>
                          </td>
                          <td className="px-3 py-3 text-center">
                            <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${TYPE_COLOR[c.type] ?? "bg-muted text-muted-foreground"}`}>
                              {TYPE_LABEL[c.type] ?? c.type}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right font-bold text-xs tabular-nums">
                            {fmt(c.amount)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-muted/30">
                        <td colSpan={2} className="px-4 py-2 text-xs font-bold text-muted-foreground uppercase">Total</td>
                        <td className="px-4 py-2 text-right text-sm font-bold tabular-nums">
                          {fmt(state.commissions.reduce((s, c) => s + c.amount, 0))}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </>
          )}

          {state.kind === "comm_error" && (
            <div className="space-y-3">
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-2">
                <p className="text-sm font-semibold text-amber-800">
                  The proposal was approved but commissions could not be processed automatically.
                </p>
                <p className="text-xs text-amber-700 font-mono bg-amber-100 rounded-lg px-3 py-2 break-words">
                  {state.commError}
                </p>
              </div>
              <div className="bg-muted/40 border border-border rounded-xl p-4">
                <p className="text-xs text-muted-foreground">
                  <span className="font-bold text-foreground">Next step:</span> Go to the{" "}
                  <span className="font-semibold">Commissions</span> page and process manually.
                  The proposal status is already <span className="font-bold text-emerald-600">APPROVED</span>.
                </p>
              </div>
            </div>
          )}

          {state.kind === "approval_error" && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 space-y-2">
              <p className="text-sm font-semibold text-red-800">
                The proposal could not be approved. No changes were made.
              </p>
              <p className="text-xs text-red-700 font-mono bg-red-100 rounded-lg px-3 py-2 break-words">
                {state.error}
              </p>
            </div>
          )}
        </div>

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

// ─── Main Component ───────────────────────────────────────────────────────────

// Note: HierarchyState from investment types — same shape, no ccoId needed for MP
type MPHierarchyState = Pick<HierarchyState, "faId" | "fmId" | "bmId" | "rmId" | "zmId">;

export default function MonthlyProposalApprovalSection({
  proposalId,
  hierarchy,
  onHierarchyChange,
  reviewNote,
  onReviewNoteChange,
  userData,
  onSuccess,
}: {
  proposalId:         number;
  hierarchy:          MPHierarchyState;
  onHierarchyChange:  (key: keyof MPHierarchyState, id: number | null) => void;
  reviewNote:         string;
  onReviewNoteChange: (v: string) => void;
  userData:           any;
  onSuccess?:         () => void;
}) {
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [modal,       setModal]       = useState<ModalState>(null);

  const handleApprove = async () => {
    setIsApproving(true);
    const res = await approveMonthlyProposalWithHierarchy({
      proposalId,
      ...hierarchy,
    });
    setIsApproving(false);

    if (!res.success) {
      setModal({ kind: "approval_error", error: res.error ?? "Failed to approve proposal." });
      return;
    }

    if (res.commissionError) {
      setModal({ kind: "comm_error", approvalOk: true, commError: res.commissionError });
      onSuccess?.();
      return;
    }

    const rawCommissions: CommissionLine[] =
      res.commissionReceipt?.commissions ??
      res.commissionReceipt?.receipt?.commissions ?? [];

    setModal({ kind: "success", commissions: rawCommissions });
    onSuccess?.();
  };

  const handleReject = async () => {
    if (!reviewNote.trim()) {
      toast.warning("A review note is required to reject this proposal.");
      return;
    }
    setIsRejecting(true);
    const res = await rejectMonthlyProposal({ proposalId, reviewNote });
    setIsRejecting(false);

    if (res.success) {
      toast.success("Proposal rejected.");
      onSuccess?.();
    } else {
      toast.error(res.error || "Failed to reject proposal.");
    }
  };

  // Full HierarchyState shape required by AdvisorHierarchy (pass nulls for unused slots)
  const fullHierarchy: HierarchyState = {
    ...hierarchy,
    agmId: null,
    ccoId: null,
  };

  return (
    <>
      {modal && <ResultModal state={modal} onClose={() => setModal(null)} />}

      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden mt-8">
        <div className="px-6 py-4 border-b border-border flex items-center gap-2">
          <Check className="w-5 h-5 text-muted-foreground" />
          <h2 className="font-bold text-sm uppercase tracking-wide text-card-foreground">
            Management Approval Hierarchy
          </h2>
        </div>

        <div className="flex flex-col">
          <div className="p-6">
            {/* Reuse the same AdvisorHierarchy component — only FA/FM/BM/RM/ZM slots
                are relevant for monthly proposals (no AGM/CCO) */}
            <AdvisorHierarchy
              values={fullHierarchy}
              onChange={(key, id) => {
                // Only forward keys that MP uses
                if (key === "faId" || key === "fmId" || key === "bmId" ||
                    key === "rmId" || key === "zmId") {
                  onHierarchyChange(key as keyof MPHierarchyState, id);
                }
              }}
              hideCard
              hiddenSlots={["agmId", "ccoId"]}   // AdvisorHierarchy must accept this prop — see note
            />
          </div>

          <div className="px-6 pb-6 space-y-2">
            <label className="text-[11px] font-bold text-muted-foreground uppercase block">
              Review Note
            </label>
            <textarea
              value={reviewNote}
              onChange={(e) => onReviewNoteChange(e.target.value)}
              placeholder="Add comments or rejection reason..."
              className="w-full bg-background border border-border rounded-lg text-sm py-3 px-4 focus:ring-1 focus:ring-primary outline-none"
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
                disabled={isApproving || isRejecting}
                className="flex-1 md:flex-none px-8 py-3 bg-[#0f5132] text-white rounded-lg font-bold text-sm flex items-center justify-center gap-2 hover:brightness-95 active:scale-95 disabled:opacity-50"
              >
                {isApproving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                APPROVE
              </button>
              <button
                type="button"
                onClick={handleReject}
                disabled={isApproving || isRejecting}
                className="flex-1 md:flex-none px-8 py-3 bg-red-600 text-white rounded-lg font-bold text-sm flex items-center justify-center gap-2 hover:brightness-95 active:scale-95 disabled:opacity-50"
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