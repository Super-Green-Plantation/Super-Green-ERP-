"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  FileText,
  Plus,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Search,
  Baby,
  TrendingUp,
  Landmark,
  Download,
} from "lucide-react";
import { getQuotations, deleteQuotation } from "@/app/features/quotations/actions";
import { generateQuotationPDF } from "@/app/pdf/Quotation";
import AddQuotationModal from "@/app/components/Quotations/AddQuotationModal";

// ─── Types ────────────────────────────────────────────────────────────────────

type PlanType = "CHILD" | "MARGE" | "PENSION";
type PaymentFrequency = "MONTHLY" | "QUARTERLY" | "SEMI_ANNUAL" | "ANNUAL";

interface Quotation {
  id: string;
  clientName: string;
  clientNic: string | null;
  clientAge: number | null;
  planType: PlanType;
  frequency: PaymentFrequency;
  duration: number;
  premium: number;
  retirementAge: number | null;
  totalInvested: number;
  interestRate: number;
  interestEarned: number;
  maturityAmount: number;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const PLAN_META: Record<PlanType, { label: string; icon: React.ReactNode; color: string }> = {
  CHILD: {
    label: "Child Plan",
    icon: <Baby className="w-3.5 h-3.5" />,
    color: "bg-purple-100 text-purple-700",
  },
  MARGE: {
    label: "Marge Plan",
    icon: <TrendingUp className="w-3.5 h-3.5" />,
    color: "bg-blue-100 text-blue-700",
  },
  PENSION: {
    label: "Pension Plan",
    icon: <Landmark className="w-3.5 h-3.5" />,
    color: "bg-amber-100 text-amber-700",
  },
};

const FREQ_SHORT: Record<PaymentFrequency, string> = {
  MONTHLY: "Monthly",
  QUARTERLY: "Quarterly",
  SEMI_ANNUAL: "Semi-Annual",
  ANNUAL: "Annual",
};

const PAGE_SIZE = 15;

const fmt = (n: number) =>
  "Rs. " + n.toLocaleString("en-LK", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// ─── Component ────────────────────────────────────────────────────────────────

const QuotationsPage = () => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["quotations", page],
    queryFn: () => getQuotations(page, PAGE_SIZE),
  });

  const handleDownload = (q: Quotation) => {
    const advisor = data?.advisor;
    generateQuotationPDF({
      ...q,
      advisorName: advisor?.name ?? undefined,
      advisorEmpNo: advisor?.empNo ?? undefined,
      advisorBranch: advisor?.branch ?? undefined,
    });
  };

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteQuotation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quotations"] });
      toast.success("Quotation deleted");
      setDeleteId(null);
    },
    onError: () => toast.error("Failed to delete"),
  });

  const quotations = (data?.quotations ?? []) as unknown as Quotation[];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  const filtered = search.trim()
    ? quotations.filter(
        (q) =>
          q.clientName.toLowerCase().includes(search.toLowerCase()) ||
          (q.clientNic ?? "").toLowerCase().includes(search.toLowerCase())
      )
    : quotations;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* ── Header ── */}
        <div className="sm:flex space-y-3 items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <FileText className="w-6 h-6 text-green-600" />
              Quotations
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {total} quotation{total !== 1 ? "s" : ""} generated
            </p>
          </div>
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl font-semibold text-sm shadow active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4" />
            New Quotation
          </button>
        </div>

        {/* ── Table ── */}
        <div className="overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-24 text-gray-400 text-sm">
              Loading quotations...
            </div>
          ) : isError ? (
            <div className="flex items-center justify-center py-24 text-red-400 text-sm">
              Failed to load quotations.
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-gray-400 gap-2">
              <FileText className="w-10 h-10 text-gray-200" />
              <p className="text-sm">No quotations found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Client
                    </th>
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Plan
                    </th>
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Frequency
                    </th>
                    <th className="text-right px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Premium
                    </th>
                    <th className="text-right px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Total Invested
                    </th>
                    <th className="text-right px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Maturity
                    </th>
                    <th className="text-center px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Rate
                    </th>
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Date
                    </th>
                    <th className="px-5 py-3.5" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.map((q) => {
                    const meta = PLAN_META[q.planType];
                    return (
                      <tr key={q.id} className="hover:bg-gray-50 transition-colors group">
                        {/* Client */}
                        <td className="px-5 py-4">
                          <p className="font-semibold text-gray-800">{q.clientName}</p>
                          <p className="text-xs text-gray-400">
                            {q.clientNic ?? "—"}
                            {q.clientAge ? ` · ${q.clientAge} yrs` : ""}
                          </p>
                        </td>

                        {/* Plan */}
                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${meta.color}`}
                          >
                            {meta.icon}
                            {meta.label}
                          </span>
                          <p className="text-xs text-gray-400 mt-1">
                            {q.duration}Y plan
                            {q.planType === "PENSION" && q.retirementAge
                              ? ` · Retire @ ${q.retirementAge}`
                              : ""}
                          </p>
                        </td>

                        {/* Frequency */}
                        <td className="px-5 py-4 text-gray-600">
                          {FREQ_SHORT[q.frequency]}
                        </td>

                        {/* Premium */}
                        <td className="px-5 py-4 text-right font-medium text-gray-800">
                          {fmt(q.premium)}
                        </td>

                        {/* Total Invested */}
                        <td className="px-5 py-4 text-right text-gray-600">
                          {fmt(q.totalInvested)}
                        </td>

                        {/* Maturity */}
                        <td className="px-5 py-4 text-right font-semibold text-green-700">
                          {fmt(q.maturityAmount)}
                        </td>

                        {/* Rate */}
                        <td className="px-5 py-4 text-center">
                          <span className="inline-block bg-green-50 text-green-700 text-xs font-bold px-2 py-0.5 rounded-full">
                            {q.interestRate.toFixed(1)}%
                          </span>
                        </td>

                        {/* Date */}
                        <td className="px-5 py-4 text-gray-400 text-xs whitespace-nowrap">
                          {new Date(q.createdAt).toLocaleDateString("en-LK", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </td>

                        {/* Actions */}
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-1 justify-end">
                            <button
                              onClick={() => handleDownload(q)}
                              className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                              title="Download PDF"
                            >
                              <Download className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setDeleteId(q.id)}
                              className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* ── Pagination ── */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-4 border-t border-gray-100 bg-gray-50">
              <p className="text-xs text-gray-500">
                Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} of {total}
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-xs text-gray-600 font-medium">
                  {page} / {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Add Modal ── */}
      <AddQuotationModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />

      {/* ── Delete Confirm ── */}
      {deleteId && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
          onClick={() => setDeleteId(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full animate-in fade-in zoom-in duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-base font-semibold text-gray-800 mb-1">Delete Quotation</h3>
            <p className="text-sm text-gray-500 mb-5">
              This quotation will be permanently removed. This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteId(null)}
                className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50"
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
    </div>
  );
};

export default QuotationsPage;