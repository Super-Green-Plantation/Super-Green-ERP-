"use client";

import { useState } from "react";
import { useBranchKpis } from "@/app/hooks/useBranchKpis";
import { getRecentMonthOptions } from "@/lib/monthOptions";
import { ArrowDown, ArrowUp, Trophy } from "lucide-react";
import type { BranchKpi } from "@/app/features/dashboard/analytics";

export const BranchKpiTable = () => {
  const now = new Date();
  const [selectedPeriod, setSelectedPeriod] = useState({ year: now.getFullYear(), month: now.getMonth() + 1 });
  const { data, isLoading } = useBranchKpis(selectedPeriod.year, selectedPeriod.month);

  const [sortConfig, setSortConfig] = useState<{ key: keyof BranchKpi; direction: "asc" | "desc" }>({
    key: "achievementPercentage",
    direction: "desc",
  });

  const monthOptions = getRecentMonthOptions(12);

  const handleSort = (key: keyof BranchKpi) => {
    setSortConfig({
      key,
      direction: sortConfig.key === key && sortConfig.direction === "desc" ? "asc" : "desc",
    });
  };

  const sortedData: BranchKpi[] = data
    ? [...data].sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === "asc" ? -1 : 1;
        if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      })
    : [];

  // Find the top performer by achievement percentage to award the trophy
  const topPerformerId =
    sortedData.length > 0
      ? [...sortedData].sort((a, b) => b.achievementPercentage - a.achievementPercentage)[0].branchId
      : -1;

  const SortIcon = ({ columnKey }: { columnKey: string }) => {
    if (sortConfig.key !== columnKey) return null;
    return sortConfig.direction === "asc" ? <ArrowUp className="w-3 h-3 ml-1" /> : <ArrowDown className="w-3 h-3 ml-1" />;
  };

  const getAchievementStyle = (pct: number) => {
    if (pct >= 100) return "text-emerald-600 dark:text-emerald-400 font-bold";
    if (pct >= 75) return "text-amber-600 dark:text-amber-400 font-semibold";
    return "text-red-500 dark:text-red-400 font-semibold";
  };

  const getBarColor = (pct: number) => {
    if (pct >= 100) return "bg-emerald-500";
    if (pct >= 75) return "bg-amber-400";
    return "bg-red-400";
  };

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm flex flex-col w-full min-h-87.5">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">Branch Performance</h2>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Target vs Achievement — selected month</p>
        </div>
        <select
          value={`${selectedPeriod.year}-${selectedPeriod.month}`}
          onChange={(e) => {
            const [year, month] = e.target.value.split("-").map(Number);
            setSelectedPeriod({ year, month });
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

      <div className="overflow-x-auto flex-1">
        <table className="w-full text-left text-sm text-gray-600 dark:text-gray-400">
          <thead className="text-[10px] uppercase tracking-wider font-bold text-gray-500 bg-gray-50 dark:bg-gray-800/50 border-y border-gray-100 dark:border-gray-800">
            <tr>
              <th className="px-4 py-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors" onClick={() => handleSort("branchName")}>
                <div className="flex items-center">Branch <SortIcon columnKey="branchName" /></div>
              </th>
              <th className="px-4 py-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors text-right" onClick={() => handleSort("investmentTotal")}>
                <div className="flex items-center justify-end">Achieved <SortIcon columnKey="investmentTotal" /></div>
              </th>
              <th className="px-4 py-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors text-right" onClick={() => handleSort("target")}>
                <div className="flex items-center justify-end">Target <SortIcon columnKey="target" /></div>
              </th>
              <th className="px-4 py-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors min-w-44" onClick={() => handleSort("achievementPercentage")}>
                <div className="flex items-center">Achievement % <SortIcon columnKey="achievementPercentage" /></div>
              </th>
              <th className="px-4 py-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors text-right" onClick={() => handleSort("investmentCount")}>
                <div className="flex items-center justify-end">Inv. <SortIcon columnKey="investmentCount" /></div>
              </th>
              <th className="px-4 py-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors text-right" onClick={() => handleSort("clientCount")}>
                <div className="flex items-center justify-end">Clients <SortIcon columnKey="clientCount" /></div>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {isLoading ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-500 text-xs">
                  Loading branch data...
                </td>
              </tr>
            ) : sortedData.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-500 text-xs">
                  No branch data found for this period.
                </td>
              </tr>
            ) : (
              sortedData.map((branch) => {
                const isTop = branch.branchId === topPerformerId && branch.achievementPercentage > 0;
                return (
                  <tr
                    key={branch.branchId}
                    className={`hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors ${isTop ? "bg-emerald-50/40 dark:bg-emerald-950/20" : ""}`}
                  >
                    <td className="px-4 py-3 font-semibold text-gray-900 dark:text-gray-100">
                      <div className="flex items-center gap-1.5">
                        {isTop && <Trophy className="w-3.5 h-3.5 text-amber-500 shrink-0" />}
                        {branch.branchName}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-[#0f5132] dark:text-[#4ade80]">
                      Rs. {branch.investmentTotal.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right text-xs text-gray-500 dark:text-gray-400">
                      {branch.target > 0 ? `Rs. ${branch.target.toLocaleString()}` : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 overflow-hidden min-w-16">
                          <div
                            className={`h-1.5 rounded-full transition-all duration-700 ${getBarColor(branch.achievementPercentage)}`}
                            style={{ width: `${Math.min(branch.achievementPercentage, 100)}%` }}
                          />
                        </div>
                        <span className={`text-xs w-12 text-right shrink-0 ${getAchievementStyle(branch.achievementPercentage)}`}>
                          {branch.target > 0 ? `${branch.achievementPercentage}%` : "—"}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right text-xs">{branch.investmentCount}</td>
                    <td className="px-4 py-3 text-right text-xs">{branch.clientCount}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Legend:</span>
        <span className="flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
          <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" /> ≥ 100%
        </span>
        <span className="flex items-center gap-1 text-[10px] text-amber-600 dark:text-amber-400 font-semibold">
          <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" /> ≥ 75%
        </span>
        <span className="flex items-center gap-1 text-[10px] text-red-500 dark:text-red-400 font-semibold">
          <span className="w-2 h-2 rounded-full bg-red-400 inline-block" /> &lt; 75%
        </span>
      </div>
    </div>
  );
};
