"use client";

import { useState } from "react";
import { useLeaderboard } from "@/app/hooks/useLeaderboard";
import { getRecentMonthOptions } from "@/lib/monthOptions";
import { Trophy, Medal, Award } from "lucide-react";

export const CommissionLeaderboard = () => {
  const now = new Date();
  const [selectedPeriod, setSelectedPeriod] = useState({ year: now.getFullYear(), month: now.getMonth() + 1 });
  const { data, isLoading } = useLeaderboard(selectedPeriod.year, selectedPeriod.month);

  const monthOptions = getRecentMonthOptions(12);

  const renderRankIcon = (index: number) => {
    if (index === 0) return <Trophy className="w-5 h-5 text-yellow-500 drop-shadow-md" />;
    if (index === 1) return <Medal className="w-5 h-5 text-gray-400 drop-shadow-sm" />;
    if (index === 2) return <Award className="w-5 h-5 text-amber-700 drop-shadow-sm" />;
    return <span className="font-extrabold text-gray-400 w-5 text-center text-sm">{index + 1}</span>;
  };

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm flex flex-col w-full h-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 tracking-tight flex items-center gap-2">
          Top Performers
        </h2>
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

      <div className="flex-1 overflow-y-auto pr-2">
        {isLoading ? (
          <div className="flex justify-center items-center h-40 text-xs text-gray-500">
            Loading leaderboard...
          </div>
        ) : !data || data.length === 0 ? (
          <div className="flex justify-center items-center h-40 text-xs text-gray-500">
            No commission data for this period.
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {data.map((entry, index) => (
              <div 
                key={entry.empNo} 
                className="flex items-center justify-between p-3 rounded-xl bg-[#FAFBF9] dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 flex justify-center shrink-0">
                    {renderRankIcon(index)}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-gray-900 dark:text-gray-100 line-clamp-1">
                      {entry.member?.nameWithInitials || "Unknown Advisor"}
                    </span>
                    <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
                      {entry.member?.position?.title || "FA"}
                    </span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-sm font-black text-[#0f5132] dark:text-[#4ade80]">
                    Rs. {entry.total.toLocaleString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
