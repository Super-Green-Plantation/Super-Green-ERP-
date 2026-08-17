"use client";

import { useState } from "react";
import { MaturityInvestment } from "@/app/features/dashboard/analytics";

type TabOption = "30" | "60" | "90";

const getDaysRemaining = (maturityDate: Date | null | string) => {
  if (!maturityDate) return 0;
  const diffTime = Math.abs(new Date(maturityDate).getTime() - new Date().getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

export const MaturityPipeline = ({ investments }: { investments: MaturityInvestment[] }) => {
  const [activeTab, setActiveTab] = useState<TabOption>("30");

  const filteredInvestments = investments.filter(inv => {
    const days = getDaysRemaining(inv.maturityDate);
    if (activeTab === "30") return days <= 30;
    if (activeTab === "60") return days > 30 && days <= 60;
    if (activeTab === "90") return days > 60 && days <= 90;
    return false;
  });

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm flex flex-col w-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">Maturity Pipeline</h2>
        <div className="flex items-center gap-1 bg-muted/40 rounded-lg p-0.5">
          <button
            onClick={() => setActiveTab("30")}
            className={`text-[10px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-md transition-all ${
              activeTab === "30" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            ≤30 Days
          </button>
          <button
            onClick={() => setActiveTab("60")}
            className={`text-[10px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-md transition-all ${
              activeTab === "60" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            31-60 Days
          </button>
          <button
            onClick={() => setActiveTab("90")}
            className={`text-[10px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-md transition-all ${
              activeTab === "90" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            61-90 Days
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-gray-600 dark:text-gray-400">
          <thead className="text-[10px] uppercase tracking-wider font-bold text-gray-500 bg-gray-50 dark:bg-gray-800/50 border-y border-gray-100 dark:border-gray-800">
            <tr>
              <th className="px-4 py-3">Client</th>
              <th className="px-4 py-3">Amount</th>
              <th className="px-4 py-3">Plan</th>
              <th className="px-4 py-3">Advisor / Branch</th>
              <th className="px-4 py-3 text-right">Remaining</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {filteredInvestments.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                  No upcoming maturities in this period.
                </td>
              </tr>
            ) : (
              filteredInvestments.map((inv) => {
                const days = getDaysRemaining(inv.maturityDate);
                const isUrgent = days <= 14;
                const isSoon = days > 14 && days <= 30;

                return (
                  <tr key={inv.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-gray-900 dark:text-gray-100">{inv.client.fullName}</div>
                      <div className="text-[10px] text-gray-500">{inv.client.phoneMobile || "No phone"}</div>
                    </td>
                    <td className="px-4 py-3 font-bold text-[#0f5132] dark:text-[#4ade80]">
                      Rs. {inv.amount.toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <span className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-[10px] font-medium">
                        {inv.plan?.name || "N/A"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs">
                      <div>{inv.advisor?.nameWithInitials || "Unassigned"}</div>
                      <div className="text-[10px] text-gray-500 uppercase">{inv.branch.name}</div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex flex-col items-end gap-1">
                        <span
                          className={`px-2 py-1 rounded-full text-[10px] font-bold ${
                            isUrgent
                              ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                              : isSoon
                              ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                              : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                          }`}
                        >
                          {days} Days
                        </span>
                        <span className="text-[10px] text-gray-500">
                          {inv.maturityDate ? new Intl.DateTimeFormat("en-US", { month: "short", day: "2-digit", year: "numeric" }).format(new Date(inv.maturityDate)) : ""}
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
