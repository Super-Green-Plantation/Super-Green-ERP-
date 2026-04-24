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
  Pencil,
} from "lucide-react";
import { useIsMounted } from "@/app/hooks/useIsMounted";
import { generateInvestmentsReportPDF } from "@/app/pdf/InvestmentsReport";
import Heading from "@/app/components/Heading";
import { ProposalReportExport } from "@/app/components/Buttons/ProposalReportExport";

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
      const isPrivileged = ["ADMIN", "HR", "DEV", "BRANCH_MANAGER"].includes(userData.role);
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
            <Heading>
              Investments
            </Heading>
            <p className="text-sm font-bold text-foreground">
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
        <div className=" overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                {/* Header with better contrast using muted-foreground */}
                <tr className="bg-muted/50 border-b border-border">
                  {["Proposal No.", "Client", "Plan", "Amount", "Inv. Date", "Maturity", "Advisor", "Actions"].map(h => (
                    <th
                      key={h}
                      className={`px-5 py-4 text-[11px] font-extrabold uppercase tracking-widest text-muted-foreground ${h === "Actions" ? "text-center" : ""}`}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody className="divide-y divide-border/60">
                {investments.map((inv: any) => (
                  <tr key={inv.id} className="hover:bg-muted/30 transition-colors group">

                    {/* Proposal No - Mono font for data clarity */}
                    <td className="px-5 py-4">
                      <span className="text-[11px] font-bold text-muted-foreground/80 font-mono tracking-tighter">
                        {inv.client?.proposalFormNo ?? `#${inv.id}`}
                      </span>
                    </td>

                    {/* Client Info - High contrast name */}
                    <td className="px-3 py-4">
                      <div>
                        <p className="text-sm font-bold text-foreground leading-tight">
                          {inv.client?.fullName ?? "—"}
                        </p>
                        <p className="text-[10px] text-muted-foreground font-semibold">
                          {inv.client?.nic ?? "No NIC"}
                        </p>
                      </div>
                    </td>

                    {/* Plan Info */}
                    <td className="px-5 py-4">
                      <p className="text-xs font-bold text-foreground/90">{inv.plan?.name ?? "—"}</p>
                      {inv.plan && (
                        <p className="text-[10px] text-accent font-bold">
                          {inv.investmentRate ? inv.investmentRate : inv.plan.rate}% <span className="text-muted-foreground/60">·</span> {inv.plan.duration}mo
                        </p>
                      )}
                    </td>

                    {/* Amount - Boldest text for financial focus */}
                    <td className="px-5 py-4">
                      <p className="text-sm font-black text-foreground tabular-nums">
                        Rs. {fmt(inv.amount)}
                      </p>
                    </td>

                    {/* Investment Date */}
                    <td className="px-5 py-4">
                      <div className="text-xs font-bold text-muted-foreground/90">
                        {inv.investmentDate && isMounted
                          ? new Date(inv.investmentDate).toLocaleDateString("en-GB", {
                            day: "numeric", month: "short", year: "numeric",
                          })
                          : "—"}
                      </div>
                    </td>

                    {/* Maturity Status */}
                    <td className="px-5 py-4">
                      <div className="space-y-1">
                        <MaturityBadge maturityDate={inv.maturityDate} isMatured={inv.isMatured} isMounted={isMounted} />
                        {inv.maturityDate && isMounted && (
                          <p className="text-[10px] text-muted-foreground font-semibold">
                            {new Date(inv.maturityDate).toLocaleDateString("en-GB", {
                              day: "numeric", month: "short", year: "numeric",
                            })}
                          </p>
                        )}
                      </div>
                    </td>

                    {/* Advisor - Forest Green accents */}
                    <td className="px-5 py-4">
                      <p className="text-xs font-bold text-foreground/80">
                        {inv.advisor?.nameWithInitials ?? (
                          <span className="text-muted-foreground/40 italic">Unassigned</span>
                        )}
                      </p>
                      {inv.advisor && (
                        <p className="text-[10px] text-primary font-bold">{inv.advisor.empNo}</p>
                      )}
                    </td>

                    {/* Actions - Themed Button */}
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <Link
                          href={`/features/investments/${inv.id}`}
                          className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-accent hover:bg-accent/5 hover:border-accent/30 border border-transparent shadow-sm transition-all rounded-xl px-3 py-1.5 text-[11px] font-bold uppercase tracking-tight"
                        >
                          <Pencil className="w-3 h-3" /> Edit
                        </Link>
                        <Link
                          href={`/features/clients/${inv.clientId}`}
                          className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-primary hover:bg-card hover:border-border border border-transparent shadow-sm transition-all rounded-xl px-3 py-1.5 text-[11px] font-bold uppercase tracking-tight"
                        >
                          View Client <ExternalLink className="w-3 h-3" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination container with themed top border */}
          <div className="border-t border-border bg-muted/20">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
        </div>
      )}
    </div>
  );
}
