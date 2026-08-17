"use client";

import { useState } from "react";
import { usePayrollBreakdown } from "@/app/hooks/usePayrollBreakdown";
import { getRecentMonthOptions } from "@/lib/monthOptions";
import { DollarSign, TrendingUp, TrendingDown, Minus } from "lucide-react";

export const PayrollBreakdown = () => {
  const now = new Date();
  const [selectedPeriod, setSelectedPeriod] = useState({ year: now.getFullYear(), month: now.getMonth() + 1 });
  const { data, isLoading } = usePayrollBreakdown(selectedPeriod.year, selectedPeriod.month);

  const monthOptions = getRecentMonthOptions(12);

  const renderTrend = (current: number, previous: number) => {
    if (previous === 0) return null;
    const pct = ((current - previous) / previous) * 100;
    
    if (Math.abs(pct) < 0.1) return <Minus className="w-3 h-3 text-gray-400" />;
    
    return pct > 0 ? (
      <div className="flex items-center gap-0.5 text-red-500">
        <TrendingUp className="w-3 h-3" />
        <span className="text-[10px] font-bold">{pct.toFixed(1)}%</span>
      </div>
    ) : (
      <div className="flex items-center gap-0.5 text-green-500">
        <TrendingDown className="w-3 h-3" />
        <span className="text-[10px] font-bold">{Math.abs(pct).toFixed(1)}%</span>
      </div>
    );
  };

  const costItems = data ? [
    { label: "Net Pay", value: data.current.netPay, prev: data.previous.netPay },
    { label: "Commissions", value: data.current.commissionEarned, prev: data.previous.commissionEarned },
    { label: "Incentives", value: data.current.incentiveEarned, prev: data.previous.incentiveEarned },
    { label: "Allowances", value: data.current.allowanceEarned, prev: data.previous.allowanceEarned },
    { label: "ORC", value: data.current.orcEarned, prev: data.previous.orcEarned },
    { label: "EPF (Employer)", value: data.current.epfEmployer, prev: data.previous.epfEmployer },
    { label: "ETF (Employer)", value: data.current.etfEmployer, prev: data.previous.etfEmployer },
  ] : [];

  const totalCost = data ? Object.values(data.current).reduce((a, b) => a + b, 0) : 0;
  const prevTotalCost = data ? Object.values(data.previous).reduce((a, b) => a + b, 0) : 0;

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm flex flex-col w-full min-h-87.5">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 tracking-tight flex items-center gap-2">
          Payroll Cost Breakdown
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

      <div className="flex-1 flex flex-col">
        {isLoading ? (
          <div className="flex-1 flex justify-center items-center text-xs text-gray-500">
            Loading breakdown...
          </div>
        ) : !data ? (
          <div className="flex-1 flex justify-center items-center text-xs text-gray-500">
            No payroll data available.
          </div>
        ) : (
          <>
            <div className="mb-6 flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 border border-gray-100 dark:border-gray-800">
              <span className="text-[10px] uppercase font-bold tracking-widest text-gray-500 mb-1">Total Payroll Cost</span>
              <div className="flex items-center gap-3">
                <span className="text-3xl font-black text-gray-900 dark:text-gray-100">
                  Rs. {(totalCost / 1000000).toFixed(2)}M
                </span>
                {renderTrend(totalCost, prevTotalCost)}
              </div>
            </div>

            <div className="space-y-3">
              {costItems.map((item, idx) => {
                const pctOfTotal = totalCost > 0 ? (item.value / totalCost) * 100 : 0;
                
                return (
                  <div key={idx} className="flex flex-col gap-1">
                    <div className="flex justify-between items-center text-sm">
                      <span className="font-semibold text-gray-700 dark:text-gray-300">{item.label}</span>
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-gray-900 dark:text-gray-100">
                          Rs. {item.value.toLocaleString()}
                        </span>
                        <div className="w-12 flex justify-end">
                          {renderTrend(item.value, item.prev)}
                        </div>
                      </div>
                    </div>
                    <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-1.5 overflow-hidden">
                      <div 
                        className="bg-[#0f5132] dark:bg-[#4ade80] h-1.5 rounded-full opacity-80" 
                        style={{ width: `${pctOfTotal}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
