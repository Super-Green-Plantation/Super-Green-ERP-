"use client";

/**
 * ActivateProposalModal
 * Shows a confirmation summary before activating a PENDING proposal.
 * On confirm → calls activateMonthlyProposal → all payment slots generated.
 */

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { CheckCircle, X, Calendar, CreditCard, TrendingUp } from "lucide-react";
import { activateMonthlyProposal } from "@/app/features/monthly-proposals/actions";

const FREQ_LABEL: Record<string, string> = {
  MONTHLY: "Monthly", QUARTERLY: "Quarterly",
  SEMI_ANNUAL: "Semi-Annual", ANNUAL: "Annual",
};
const PAYING_YEARS: Record<string, (d: number) => number> = {
  CHILD: () => 3, MARGE: () => 5, PENSION: (d) => d,
};
const FREQ_INTERVAL: Record<string, number> = {
  MONTHLY: 1, QUARTERLY: 3, SEMI_ANNUAL: 6, ANNUAL: 12,
};
const fmt = (n: number) =>
  `Rs. ${n.toLocaleString("en-LK", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

interface Props {
  proposal: {
    id: number;
    proposalFormNo: string;
    planType: string;
    applicantName: string;
    frequency: string;
    premium: number;
    duration: number;
    maturityAmount: number;
  };
  onClose: () => void;
  onActivated: () => void;
}

export default function ActivateProposalModal({ proposal, onClose, onActivated }: Props) {
  const queryClient = useQueryClient();

  const payingYears    = PAYING_YEARS[proposal.planType]?.(proposal.duration) ?? proposal.duration;
  const intervalMonths = FREQ_INTERVAL[proposal.frequency] ?? 1;
  const totalPayments  = Math.round((payingYears * 12) / intervalMonths);

  // Preview maturity date
  const previewMaturity = new Date();
  previewMaturity.setFullYear(previewMaturity.getFullYear() + proposal.duration);

  const mutation = useMutation({
    mutationFn: () => activateMonthlyProposal(proposal.id),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["monthly-proposal", proposal.id] });
      queryClient.invalidateQueries({ queryKey: ["proposal-payments", proposal.id] });
      toast.success(
        `Activated — ${result.totalSlots} payment slots generated. Maturity: ${new Date(result.maturityDate).toLocaleDateString()}`
      );
      onActivated();
      onClose();
    },
    onError: (e: any) => toast.error(e.message || "Activation failed"),
  });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-card rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b bg-muted/30">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <h2 className="font-bold text-card-foreground">Activate Proposal</h2>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Summary */}
          <div className="bg-muted/20 rounded-xl p-4 space-y-3">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Activation Summary
            </p>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <SummaryRow icon={<CreditCard className="w-3.5 h-3.5" />}
                label="Proposal" value={proposal.proposalFormNo} />
              <SummaryRow icon={<TrendingUp className="w-3.5 h-3.5" />}
                label="Applicant" value={proposal.applicantName} />
              <SummaryRow icon={<Calendar className="w-3.5 h-3.5" />}
                label="Premium" value={`${fmt(proposal.premium)} / ${FREQ_LABEL[proposal.frequency]}`} />
              <SummaryRow icon={<Calendar className="w-3.5 h-3.5" />}
                label="Paying term" value={`${payingYears} years`} />
              <SummaryRow icon={<Calendar className="w-3.5 h-3.5" />}
                label="Total installments" value={`${totalPayments} payments`} />
              <SummaryRow icon={<Calendar className="w-3.5 h-3.5" />}
                label="Est. maturity" value={previewMaturity.toLocaleDateString()} />
              <div className="col-span-2 pt-1 border-t border-border/50">
                <SummaryRow icon={<TrendingUp className="w-3.5 h-3.5 text-primary" />}
                  label="Maturity amount" value={fmt(proposal.maturityAmount)} highlight />
              </div>
            </div>
          </div>

          <p className="text-xs text-muted-foreground bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-xl px-4 py-3">
            Activating will generate <strong>{totalPayments} payment slots</strong> starting from today.
            This cannot be undone. The proposal will move to <strong>ACTIVE</strong> status.
          </p>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 border border-border rounded-xl text-sm font-semibold text-muted-foreground hover:bg-muted/30"
            >
              Cancel
            </button>
            <button
              onClick={() => mutation.mutate()}
              disabled={mutation.isPending}
              className="flex-1 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-semibold disabled:opacity-50 shadow"
            >
              {mutation.isPending ? "Activating…" : "Activate & Generate Slots"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function SummaryRow({
  icon, label, value, highlight,
}: { icon: React.ReactNode; label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground flex items-center gap-1">
        {icon}{label}
      </span>
      <span className={`text-sm font-semibold ${highlight ? "text-primary" : "text-card-foreground"}`}>
        {value}
      </span>
    </div>
  );
}