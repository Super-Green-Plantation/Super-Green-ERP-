"use client";

import { useMemo, useState } from "react";
import { useIncentiveForecast } from "@/app/hooks/useIncentiveForecast";
import { getRecentMonthOptions } from "@/lib/monthOptions";
import { CheckCircle, AlertTriangle, XCircle } from "lucide-react";

interface Props {
  branchId?: number;
}

type ForecastStatus = "all" | "below" | "partial" | "hit";
const PAGE_SIZE = 20;

export const IncentiveForecast = ({ branchId }: Props) => {
  const now = new Date();
  const [selectedPeriod, setSelectedPeriod] = useState({ year: now.getFullYear(), month: now.getMonth() + 1 });
  const [statusFilter, setStatusFilter] = useState<ForecastStatus>("all");
  const [branchFilter, setBranchFilter] = useState("all");
  const [page, setPage] = useState(1);
  const { data, isLoading } = useIncentiveForecast(selectedPeriod.year, selectedPeriod.month, branchId);

  const monthOptions = getRecentMonthOptions(12);

  const getStatus = (achieved: number, target: number, fullHit: boolean, partialHit: boolean) => {
    const pct = target > 0 ? (achieved / target) * 100 : 0;
    if (fullHit || pct >= 100) return "hit";
    if (partialHit || pct >= 75) return "partial";
    return "below";
  };

  const branches = useMemo(
    () => [...new Set((data ?? []).map((row) => row.member?.branches?.[0]?.branch?.name).filter(Boolean))].sort(),
    [data]
  );

  const filteredData = useMemo(() => (data ?? []).filter((row) => {
    const rowBranch = row.member?.branches?.[0]?.branch?.name || "Unassigned";
    return (branchFilter === "all" || rowBranch === branchFilter)
      && (statusFilter === "all" || getStatus(
        row.volumeAchieved,
        row.monthlyTarget,
        row.incentiveHit,
        row.incentivePartialHit
      ) === statusFilter);
  }), [data, branchFilter, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredData.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageData = filteredData.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const updateFilter = (filter: ForecastStatus, branch: string) => {
    setStatusFilter(filter);
    setBranchFilter(branch);
    setPage(1);
  };

  const renderStatus = (achieved: number, target: number, fullHit: boolean, partialHit: boolean) => {
    const pct = target > 0 ? (achieved / target) * 100 : 0;
    
    if (fullHit || pct >= 100) {
      return (
        <div className="flex items-center gap-1 text-green-700 bg-green-100 dark:bg-green-900/30 dark:text-green-400 px-2 py-1 rounded-full w-max">
          <CheckCircle className="w-3 h-3" />
          <span className="text-[10px] font-bold">100%+ (Hit)</span>
        </div>
      );
    }
    
    if (partialHit || pct >= 75) {
      return (
        <div className="flex items-center gap-1 text-yellow-700 bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-400 px-2 py-1 rounded-full w-max">
          <AlertTriangle className="w-3 h-3" />
          <span className="text-[10px] font-bold">75%+ (Partial)</span>
        </div>
      );
    }

    return (
      <div className="flex items-center gap-1 text-red-700 bg-red-100 dark:bg-red-900/30 dark:text-red-400 px-2 py-1 rounded-full w-max">
        <XCircle className="w-3 h-3" />
        <span className="text-[10px] font-bold">&lt;75% (Miss)</span>
      </div>
    );
  };

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm flex flex-col w-full min-h-87.5">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 tracking-tight flex items-center gap-2">
          Incentive Forecast
        </h2>
        <select
          value={`${selectedPeriod.year}-${selectedPeriod.month}`}
          onChange={(e) => {
            const [year, month] = e.target.value.split("-").map(Number);
            setSelectedPeriod({ year, month });
            setPage(1);
          }}
          className="text-xs font-semibold bg-[#F4F5F1] dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-gray-700 dark:text-gray-300 outline-none"
        >
          {monthOptions.map((opt) => (
            <option key={`${opt.year}-${opt.month}`} value={`${opt.year}-${opt.month}`}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        <select
          value={statusFilter}
          onChange={(e) => updateFilter(e.target.value as ForecastStatus, branchFilter)}
          className="text-xs font-semibold bg-[#F4F5F1] dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-gray-700 dark:text-gray-300 outline-none"
          aria-label="Filter forecast by status"
        >
          <option value="all">All statuses</option>
          <option value="below">Below 75%</option>
          <option value="partial">75–99%</option>
          <option value="hit">100%+ hit</option>
        </select>
        <select
          value={branchFilter}
          onChange={(e) => updateFilter(statusFilter, e.target.value)}
          className="text-xs font-semibold bg-[#F4F5F1] dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-gray-700 dark:text-gray-300 outline-none"
          aria-label="Filter forecast by branch"
        >
          <option value="all">All branches</option>
          {branches.map((branch) => <option key={branch} value={branch}>{branch}</option>)}
        </select>
      </div>

      <div className="space-y-3 md:hidden">
        {isLoading ? (
          <p className="py-8 text-center text-xs text-gray-500">Loading forecast...</p>
        ) : pageData.length === 0 ? (
          <p className="py-8 text-center text-xs text-gray-500">No employees match these filters.</p>
        ) : pageData.map((row) => {
          const pct = row.monthlyTarget > 0 ? Math.min(Math.round((row.volumeAchieved / row.monthlyTarget) * 100), 100) : 0;
          const branchName = row.member?.branches?.[0]?.branch?.name || "Unassigned";
          return (
            <article key={row.member?.empNo} className="rounded-xl border border-gray-100 bg-[#FAFBF9] p-4 dark:border-gray-800 dark:bg-gray-800/50">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-gray-900 dark:text-gray-100">{row.member?.nameWithInitials || "Unknown"}</p>
                  <p className="text-[10px] text-gray-500">{row.member?.position?.title || "FA"} • {branchName}</p>
                </div>
                {renderStatus(row.volumeAchieved, row.monthlyTarget, row.incentiveHit, row.incentivePartialHit)}
              </div>
              <div className="mt-4 flex items-end justify-between gap-3">
                <div><p className="text-[10px] uppercase font-bold text-gray-500">Achieved / target</p><p className="text-sm font-bold text-[#0f5132] dark:text-[#4ade80]">Rs. {row.volumeAchieved.toLocaleString()} <span className="text-gray-500">/ {row.monthlyTarget.toLocaleString()}</span></p></div>
                <p className="text-lg font-black text-gray-900 dark:text-gray-100">{pct}%</p>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700"><div className={`h-full rounded-full ${pct >= 100 ? "bg-green-500" : pct >= 75 ? "bg-yellow-500" : "bg-red-500"}`} style={{ width: `${pct}%` }} /></div>
            </article>
          );
        })}
      </div>

      <div className="hidden overflow-x-auto md:block flex-1">
        <table className="w-full text-left text-sm text-gray-600 dark:text-gray-400">
          <thead className="text-[10px] uppercase tracking-wider font-bold text-gray-500 bg-gray-50 dark:bg-gray-800/50 border-y border-gray-100 dark:border-gray-800">
            <tr>
              <th className="px-4 py-3">Employee</th>
              <th className="px-4 py-3 text-right">Achieved</th>
              <th className="px-4 py-3 text-right">Target</th>
              <th className="px-4 py-3 text-right">Progress</th>
              <th className="px-4 py-3 text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {isLoading ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-500 text-xs">
                  Loading forecast...
                </td>
              </tr>
            ) : pageData.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-500 text-xs">
                  No employees match these filters.
                </td>
              </tr>
            ) : (
              pageData.map((row) => {
                const pct = row.monthlyTarget > 0 ? Math.min(Math.round((row.volumeAchieved / row.monthlyTarget) * 100), 100) : 0;
                const branchName = row.member?.branches?.[0]?.branch?.name || "Unassigned";

                return (
                  <tr key={row.member?.empNo} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="sticky left-0 bg-white px-4 py-3 dark:bg-gray-900">
                      <div className="font-semibold text-gray-900 dark:text-gray-100">
                        {row.member?.nameWithInitials || "Unknown"}
                      </div>
                      <div className="text-[10px] text-gray-500 flex gap-2">
                        <span>{row.member?.position?.title || "FA"}</span>
                        <span>•</span>
                        <span>{branchName}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-[#0f5132] dark:text-[#4ade80]">
                      Rs. {row.volumeAchieved.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-500 font-medium">
                      Rs. {row.monthlyTarget.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex flex-col items-end gap-1 w-full max-w-24 ml-auto">
                        <span className="text-xs font-bold text-gray-700 dark:text-gray-300">{pct}%</span>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 overflow-hidden">
                          <div 
                            className={`h-1.5 rounded-full ${
                              pct >= 100 ? "bg-green-500" : pct >= 75 ? "bg-yellow-500" : "bg-red-500"
                            }`} 
                            style={{ width: `${pct}%` }}
                          ></div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 flex justify-center">
                      {renderStatus(row.volumeAchieved, row.monthlyTarget, row.incentiveHit, row.incentivePartialHit)}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {!isLoading && filteredData.length > PAGE_SIZE && (
        <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-4 text-xs dark:border-gray-800">
          <span className="text-gray-500">{filteredData.length} employees • Page {currentPage} of {totalPages}</span>
          <div className="flex gap-2">
            <button type="button" onClick={() => setPage((value) => Math.max(1, value - 1))} disabled={currentPage === 1} className="rounded-lg border border-gray-200 px-3 py-1.5 font-semibold disabled:cursor-not-allowed disabled:opacity-40 dark:border-gray-700">Previous</button>
            <button type="button" onClick={() => setPage((value) => Math.min(totalPages, value + 1))} disabled={currentPage === totalPages} className="rounded-lg border border-gray-200 px-3 py-1.5 font-semibold disabled:cursor-not-allowed disabled:opacity-40 dark:border-gray-700">Next</button>
          </div>
        </div>
      )}
    </div>
  );
};
