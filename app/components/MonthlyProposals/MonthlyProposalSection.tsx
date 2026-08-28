"use client";

/**
 * MonthlyProposalSection
 *
 * An embeddable card that shows existing monthly proposals for a client
 * and allows adding new ones. Designed for use inside:
 *   - /features/clients/createClient/page.tsx  (lockedClient mode)
 *   - /features/investments/create/page.tsx
 *   - /features/clients/[id]/page.tsx
 *
 * When clientId is not yet known (new client registration), the card is hidden
 * and only becomes visible after the client is saved. Pass `showAlways` to
 * override and always render the "add" button (form will save without clientId).
 */

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  FileText,
  Plus,
  Baby,
  TrendingUp,
  Landmark,
  Trash2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { getMonthlyProposals, deleteMonthlyProposal } from "@/app/features/monthly-proposals/actions";
import AddMonthlyProposalModal from "@/app/components/MonthlyProposals/AddMonthlyProposalModal";

// ─── Types ────────────────────────────────────────────────────────────────────

type MonthlyPlanType = "CHILD" | "MARGE" | "PENSION";
type MonthlyFrequency = "MONTHLY" | "QUARTERLY" | "SEMI_ANNUAL" | "ANNUAL";

interface MonthlyProposal {
  id: number;
  planType: MonthlyPlanType;
  proposalFormNo: string | null;
  applicantName: string;
  applicantNic: string | null;
  frequency: MonthlyFrequency;
  premium: number;
  duration: number;
  interestRate: number;
  maturityAmount: number;
  totalInvested: number;
  retirementAge: number | null;
  childName: string | null;
  nomineeName: string | null;
  nomineeRelationship: string | null;
  createdAt: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const PLAN_META: Record<MonthlyPlanType, { label: string; icon: React.ReactNode; color: string }> = {
  CHILD:   { label: "Child Plan",     icon: <Baby className="w-3.5 h-3.5" />,      color: "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300" },
  MARGE:   { label: "Marriage Plan",  icon: <TrendingUp className="w-3.5 h-3.5" />, color: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300" },
  PENSION: { label: "Retirement Plan",icon: <Landmark className="w-3.5 h-3.5" />,  color: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300" },
};

const FREQ_SHORT: Record<MonthlyFrequency, string> = {
  MONTHLY: "Monthly", QUARTERLY: "Quarterly", SEMI_ANNUAL: "Semi-Annual", ANNUAL: "Annual",
};

const fmt = (n: number) =>
  "Rs. " + n.toLocaleString("en-LK", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
  clientId?: number | null;
  lockedClient?: {
    id: number;
    fullName: string;
    nic?: string | null;
    address?: string | null;
    phoneMobile?: string | null;
    email?: string | null;
  } | null;
  showAlways?: boolean;           // show even without a clientId
}

const MonthlyProposalSection = ({ clientId, lockedClient, showAlways }: Props) => {
  const queryClient = useQueryClient();
  const [modalOpen,  setModalOpen]  = useState(false);
  const [expanded,   setExpanded]   = useState(true);
  const [deleteId,   setDeleteId]   = useState<number | null>(null);

  const effectiveClientId = clientId ?? lockedClient?.id ?? null;

  // Only fetch when we have a clientId
  const { data, isLoading } = useQuery({
    queryKey: ["client-monthly-proposals", effectiveClientId],
    queryFn: () => getMonthlyProposals(1, 50, effectiveClientId!),
    enabled: !!effectiveClientId,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteMonthlyProposal(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["client-monthly-proposals"] });
      toast.success("Proposal deleted");
      setDeleteId(null);
    },
    onError: () => toast.error("Failed to delete"),
  });

  const proposals = (data?.proposals ?? []) as MonthlyProposal[];

  // Hide entirely when no client context and showAlways is not set
  if (!effectiveClientId && !showAlways) return null;

  return (
    <>
      <div className="bg-card/60 backdrop-blur-xl border border-border/50 rounded-xl shadow-sm overflow-hidden">
        {/* ── Card header ── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/50">
          <button
            type="button"
            className="flex items-center gap-3 text-left"
            onClick={() => setExpanded((v) => !v)}
          >
            <FileText className="w-5 h-5 text-green-600 shrink-0" />
            <div>
              <p className="font-semibold text-card-foreground text-sm">Monthly Proposals</p>
              {effectiveClientId && (
                <p className="text-xs text-muted-foreground">
                  {proposals.length} proposal{proposals.length !== 1 ? "s" : ""} — Child, Marriage & Retirement plans
                </p>
              )}
              {!effectiveClientId && (
                <p className="text-xs text-muted-foreground">
                  Monthly installment plan proposals
                </p>
              )}
            </div>
            {expanded ? (
              <ChevronUp className="w-4 h-4 text-muted-foreground ml-1" />
            ) : (
              <ChevronDown className="w-4 h-4 text-muted-foreground ml-1" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-semibold shadow transition-all active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Proposal
          </button>
        </div>

        {/* ── Proposals list ── */}
        {expanded && (
          <div className="p-4">
            {!effectiveClientId && (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground/60 gap-2">
                <FileText className="w-8 h-8 text-gray-200" />
                <p className="text-sm">Save the client first, then add proposals</p>
              </div>
            )}

            {effectiveClientId && isLoading && (
              <div className="text-center py-6 text-sm text-muted-foreground">Loading...</div>
            )}

            {effectiveClientId && !isLoading && proposals.length === 0 && (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground/60 gap-2">
                <FileText className="w-8 h-8 text-gray-200" />
                <p className="text-sm">No proposals yet — click "Add Proposal" to create one</p>
              </div>
            )}

            {effectiveClientId && proposals.length > 0 && (
              <div className="space-y-3">
                {proposals.map((p) => {
                  const meta = PLAN_META[p.planType];
                  return (
                    <div
                      key={p.id}
                      className="flex items-start justify-between p-3 bg-muted/20 border border-border/50 rounded-xl group"
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        {/* Plan badge */}
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold shrink-0 mt-0.5 ${meta.color}`}
                        >
                          {meta.icon}
                          {meta.label}
                        </span>

                        <div className="min-w-0">
                          <p className="font-semibold text-sm text-card-foreground truncate">
                            {p.applicantName}
                            {p.planType === "CHILD" && p.childName && (
                              <span className="text-xs text-muted-foreground font-normal ml-1">
                                (child: {p.childName})
                              </span>
                            )}
                          </p>
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-0.5">
                            <span className="text-xs text-muted-foreground">
                              {p.duration}Y · {FREQ_SHORT[p.frequency]} · {fmt(p.premium)}/period
                            </span>
                            <span className="text-xs text-green-700 dark:text-green-400 font-semibold">
                              Maturity {fmt(p.maturityAmount)}
                            </span>
                            <span className="text-xs text-muted-foreground/70">
                              {p.interestRate.toFixed(1)}% p.a.
                            </span>
                            {p.proposalFormNo && (
                              <span className="text-xs text-muted-foreground/60 font-mono">
                                {p.proposalFormNo}
                              </span>
                            )}
                          </div>
                          {p.nomineeName && (
                            <p className="text-xs text-muted-foreground/70 mt-0.5">
                              Nominee: {p.nomineeName}
                              {p.nomineeRelationship ? ` (${p.nomineeRelationship})` : ""}
                            </p>
                          )}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => setDeleteId(p.id)}
                        className="p-1.5 text-muted-foreground/40 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100 shrink-0 ml-2"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Add modal ── */}
      <AddMonthlyProposalModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        clientId={effectiveClientId}
        lockedClient={lockedClient}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["client-monthly-proposals", effectiveClientId] });
        }}
      />

      {/* ── Delete confirm ── */}
      {deleteId !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
          onClick={() => setDeleteId(null)}
        >
          <div
            className="bg-card rounded-2xl shadow-2xl p-6 max-w-sm w-full animate-in fade-in zoom-in duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-base font-semibold text-card-foreground mb-1">Delete Proposal</h3>
            <p className="text-sm text-muted-foreground mb-5">
              This monthly proposal will be permanently removed.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteId(null)}
                className="flex-1 py-2.5 border border-border rounded-xl text-sm font-semibold text-muted-foreground hover:bg-muted/30"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteMutation.mutate(deleteId)}
                disabled={deleteMutation.isPending}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-semibold disabled:opacity-50"
              >
                {deleteMutation.isPending ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default MonthlyProposalSection;