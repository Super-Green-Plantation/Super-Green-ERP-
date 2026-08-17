"use client";

import { useState } from "react";
import { useBranchKpis } from "@/app/hooks/useBranchKpis";
import { getRecentMonthOptions } from "@/lib/monthOptions";
import { ArrowDown, ArrowUp } from "lucide-react";

export const BranchKpiTable = () => {
  const now = new Date();
  const [selectedPeriod, setSelectedPeriod] = useState({ year: now.getFullYear(), month: now.getMonth() + 1 });
  const { data, isLoading } = useBranchKpis(selectedPeriod.year, selectedPeriod.month);
  
  const [sortConfig, setSortConfig] = useState<{ key: keyof NonNullable<typeof data>[0]; direction: "asc" | "desc" }>({
    key: "investmentTotal",
    direction: "desc"
  });

  const monthOptions = getRecentMonthOptions(12);

  const handleSort = (key: keyof NonNullable<typeof data>[0]) => {
    setSortConfig({
      key,
      direction: sortConfig.key === key && sortConfig.direction === "desc" ? "asc" : "desc",
    });
  };

  const sortedData = data ? [...data].sort((a, b) => {
    if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === "asc" ? -1 : 1;
    if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === "asc" ? 1 : -1;
    return 0;
  }) : [];

  const SortIcon = ({ columnKey }: { columnKey: string }) => {
    if (sortConfig.key !== columnKey) return null;
    return sortConfig.direction === "asc" ? <ArrowUp className="w-3 h-3 ml-1" /> : <ArrowDown className="w-3 h-3 ml-1" />;
  };

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm flex flex-col w-full min-h-87.5">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">Branch Performance</h2>
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
                <div className="flex items-center justify-end">Capital <SortIcon columnKey="investmentTotal" /></div>
              </th>
              <th className="px-4 py-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors text-right" onClick={() => handleSort("investmentCount")}>
                <div className="flex items-center justify-end">Inv. Count <SortIcon columnKey="investmentCount" /></div>
              </th>
              <th className="px-4 py-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors text-right" onClick={() => handleSort("clientCount")}>
                <div className="flex items-center justify-end">Clients <SortIcon columnKey="clientCount" /></div>
              </th>
              <th className="px-4 py-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors text-right" onClick={() => handleSort("staffCount")}>
                <div className="flex items-center justify-end">Staff <SortIcon columnKey="staffCount" /></div>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {isLoading ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-500 text-xs">
                  Loading branch data...
                </td>
              </tr>
            ) : sortedData.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-500 text-xs">
                  No branch data found for this period.
                </td>
              </tr>
            ) : (
              sortedData.map((branch) => (
                <tr key={branch.branchId} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <td className="px-4 py-3 font-semibold text-gray-900 dark:text-gray-100">
                    {branch.branchName}
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-[#0f5132] dark:text-[#4ade80]">
                    Rs. {branch.investmentTotal.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right text-xs">
                    {branch.investmentCount}
                  </td>
                  <td className="px-4 py-3 text-right text-xs">
                    {branch.clientCount}
                  </td>
                  <td className="px-4 py-3 text-right text-xs">
                    {branch.staffCount}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
