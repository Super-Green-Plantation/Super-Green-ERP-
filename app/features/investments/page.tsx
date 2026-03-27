"use client";

import { useEffect, useState } from "react";
import { useInvestments } from "@/app/hooks/useInvestments";
import Loading from "@/app/components/Status/Loading";
import Error from "@/app/components/Status/Error";
import Pagination from "@/app/components/Pagination";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSessionUser } from "@/app/hooks/useSessionUser";
import {
  BanknoteArrowUp, Calendar, Download,
  ExternalLink, TrendingUp, User, AlertCircle, Wallet,
} from "lucide-react";
import { generateInvestmentsReportPDF } from "@/app/utils/pdfGenerator";
import { useIsMounted } from "@/app/hooks/useIsMounted";

const fmt = (n: number) =>
  n >= 1_000_000
    ? `${(n / 1_000_000).toFixed(1)}M`
    : n >= 1_000
      ? `${(n / 1_000).toFixed(0)}K`
      : String(n);

const getDaysUntilMaturity = (maturityDate: string) => {
  const today = new Date();
  const maturity = new Date(maturityDate);
  return Math.ceil((maturity.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
};

const MaturityBadge = ({ maturityDate, isMatured, isMounted }: {
  maturityDate?: string;
  isMatured?: boolean;
  isMounted: boolean;
}) => {
  if (!maturityDate || !isMounted) return <span className="text-slate-300 text-xs">—</span>;
  const days = getDaysUntilMaturity(maturityDate);

  if (isMatured || days < 0) return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-50 text-red-600 border border-red-100 rounded-full text-[10px] font-bold uppercase">
      Matured
    </span>
  );
  if (days === 0) return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-600 border border-amber-100 rounded-full text-[10px] font-bold uppercase">
      Today
    </span>
  );
  if (days <= 30) return (
    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-full text-[10px] font-bold">
      <AlertCircle className="w-2.5 h-2.5" />{days}d left
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-full text-[10px] font-bold">
      {days}d left
    </span>
  );
};

export default function InvestmentsPage() {
  const isMounted = useIsMounted();
  const router = useRouter();
  const { data: userData, isLoading: userLoading } = useSessionUser();
  const [currentPage, setCurrentPage] = useState(1);
  const { data, isLoading, isError } = useInvestments(currentPage);

  useEffect(() => {
    if (!userLoading && userData) {
      const isPrivileged = ["ADMIN", "HR", "DEV"].includes(userData.role);
      if (!isPrivileged) {
        router.push("/features/clients");
      }
    }
  }, [userData, userLoading, router]);

  if (isLoading || userLoading) return <Loading />;
  if (isError) return <Error />;

  const investments = data?.investments ?? [];
  const totalPages = data?.totalPages ?? 1;
  const total = data?.total ?? 0;

  return (
    <div className="max-w-7xl mx-auto space-y-6 p-4 md:p-8 min-h-screen">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-slate-900 rounded-2xl shadow-lg shadow-slate-900/20">
            <BanknoteArrowUp className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Investments</h1>
            <p className="text-sm text-slate-500 font-medium mt-0.5">
              {total} total investments
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {investments.length > 0 && (
            <button
              onClick={() => generateInvestmentsReportPDF(investments)}
              className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-emerald-600 text-white text-xs font-bold uppercase tracking-widest rounded-xl transition-all active:scale-95"
            >
              <Download className="w-4 h-4 text-emerald-400" /> Export
            </button>
          )}
          <Link
            href="/features/investments/create"
            className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-blue-600 text-white text-xs font-bold uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-slate-900/20 active:scale-95"
          >
            <BanknoteArrowUp className="w-4 h-4" /> New Investment
          </Link>
        </div>
      </div>

      {/* Empty state */}
      {investments.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-16 text-center">
          <div className="p-4 bg-slate-50 rounded-2xl w-fit mx-auto mb-4">
            <Wallet className="w-10 h-10 text-slate-200" />
          </div>
          <h3 className="text-sm font-bold text-slate-600 uppercase tracking-widest mb-2">
            No investments yet
          </h3>
          <p className="text-xs text-slate-400 font-medium mb-6">
            Get started by creating your first investment
          </p>
          <Link
            href="/features/investments/create"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-blue-600 text-white text-xs font-bold uppercase tracking-widest rounded-xl transition-all active:scale-95"
          >
            <BanknoteArrowUp className="w-4 h-4" /> Create Investment
          </Link>
        </div>
      ) : (
        /* Table */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-200">
                  {["Proposal No.", "Client", "Plan", "Amount", "Inv. Date", "Maturity", "Advisor", "Actions"].map(h => (
                    <th key={h} className={`px-5 py-4 text-[11px] font-bold uppercase tracking-wider text-slate-500 ${h === "Actions" ? "text-center" : ""}`}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {investments.map((inv: any) => (
                  <tr key={inv.id} className="hover:bg-slate-50/80 transition-colors group">

                    <td className="px-5 py-4">
                      <span className="text-[11px] font-bold text-slate-400 font-mono">
                        {inv.client?.proposalFormNo ?? `#${inv.id}`}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 bg-blue-50 rounded-lg flex items-center justify-center shrink-0">
                          <User className="w-3.5 h-3.5 text-blue-500" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900 leading-tight">
                            {inv.client?.fullName ?? "—"}
                          </p>
                          <p className="text-[10px] text-slate-400 font-medium">
                            {inv.client?.nic ?? "No NIC"}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <p className="text-xs font-bold text-slate-700">{inv.plan?.name ?? "—"}</p>
                      {inv.plan && (
                        <p className="text-[10px] text-slate-400 font-medium">
                          {inv.plan.rate}% · {inv.plan.duration}mo
                        </p>
                      )}
                    </td>

                    <td className="px-5 py-4">
                      <p className="text-sm font-bold text-slate-800">
                        Rs. {fmt(inv.amount)}
                      </p>
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600">
                        {inv.investmentDate && isMounted
                          ? new Date(inv.investmentDate).toLocaleDateString("en-GB", {
                              day: "numeric", month: "short", year: "numeric",
                            })
                          : "—"}
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <div className="space-y-1">
                        <MaturityBadge maturityDate={inv.maturityDate} isMatured={inv.isMatured} isMounted={isMounted} />
                        {inv.maturityDate && isMounted && (
                          <p className="text-[10px] text-slate-400 font-medium">
                            {new Date(inv.maturityDate).toLocaleDateString("en-GB", {
                              day: "numeric", month: "short", year: "numeric",
                            })}
                          </p>
                        )}
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <p className="text-xs font-bold text-slate-600">
                        {inv.advisor?.nameWithInitials ?? (
                          <span className="text-slate-300">Unassigned</span>
                        )}
                      </p>
                      {inv.advisor && (
                        <p className="text-[10px] text-slate-400">{inv.advisor.empNo}</p>
                      )}
                    </td>

                    <td className="px-5 py-4 text-center">
                      <Link
                        href={`/features/clients/${inv.clientId}`}
                        className="inline-flex items-center gap-1.5 text-slate-400 hover:text-blue-600 hover:bg-white hover:shadow-sm border border-transparent hover:border-slate-200 transition-all rounded-xl px-3 py-1.5 text-[11px] font-bold uppercase tracking-tight"
                      >
                        View <ExternalLink className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </div>
      )}
    </div>
  );
}
