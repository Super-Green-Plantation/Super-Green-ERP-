"use client";

import React, { useMemo } from "react";
import {
  FileText, Wallet, BadgeCheck, UserCheck, TrendingUp,
} from "lucide-react";

const fmt = (n: number) => n.toLocaleString("en-LK", { minimumFractionDigits: 2 });

const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

const CommissionStatementPage = ({ data }: { data: any }) => {
  const commissions: any[] = Array.isArray(data) ? data : (data?.res || data?.commissions || []);

  const totalEarned = commissions.reduce((sum, c) => sum + c.amount, 0);
  const totalVolume = commissions.reduce((sum, c) => sum + (c.investment?.amount || 0), 0);
  const memberNo = commissions[0]?.memberEmpNo || "N/A";

  // Group by year-month, sorted newest first
  const grouped = useMemo(() => {
    const map: Record<string, { year: number; month: number; items: any[] }> = {};

    for (const c of commissions) {
      const date = new Date(c.createdAt);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      if (!map[key]) map[key] = { year: date.getFullYear(), month: date.getMonth() + 1, items: [] };
      map[key].items.push(c);
    }

    return Object.entries(map)
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([, v]) => v);
  }, [commissions]);

  if (commissions.length === 0) {
    return (
      <div className="text-center py-16 text-gray-300">
        <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
        <p className="text-sm font-bold uppercase tracking-widest">No commission records</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto rounded-2xl bg-white">

      {/* Header */}
      <div className="border-b-4 border-gray-900 pb-6 mb-8 flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4">
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 sm:p-3 bg-gray-900 rounded-2xl shrink-0">
              <FileText className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
            </div>
            <div>
              <h1 className="text-xl sm:text-3xl font-black text-gray-900 uppercase tracking-tighter">
                Commission Statement
              </h1>
            </div>
          </div>
          <div className="flex gap-6 sm:gap-8">
            <div>
              <p className="text-[10px] text-gray-400 font-black uppercase mb-1">Advisor ID</p>
              <p className="text-sm font-bold text-gray-900">#EMP-{memberNo}</p>
            </div>
            <div>
              <p className="text-[10px] text-gray-400 font-black uppercase mb-1">Statement Date</p>
              <p className="text-sm font-bold text-gray-900">
                {new Date().toLocaleDateString("en-GB")}
              </p>
            </div>
          </div>
        </div>
        <div className="sm:text-right">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full border border-emerald-100 mb-1">
            <BadgeCheck className="w-4 h-4" />
            <span className="text-[10px] font-black uppercase">Verified Payout</span>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-3 sm:gap-6 mb-10">
        <div className="p-3 sm:p-6 bg-blue-50/50 rounded-2xl border border-blue-100 relative overflow-hidden">
          <Wallet className="absolute -right-2 -bottom-2 w-12 h-12 sm:w-20 sm:h-20 text-blue-200/40" />
          <p className="text-[9px] sm:text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1 sm:mb-2">Total Earned</p>
          <h2 className="text-base sm:text-3xl font-black text-blue-900">
            <span className="text-[10px] sm:text-sm mr-0.5 font-medium">Rs.</span>
            {totalEarned.toLocaleString()}
          </h2>
        </div>
        <div className="p-3 sm:p-6 bg-gray-50 rounded-2xl border border-gray-100">
          <p className="text-[9px] sm:text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 sm:mb-2">Total Volume</p>
          <h2 className="text-base sm:text-3xl font-black text-gray-900">
            <span className="text-[10px] sm:text-sm mr-0.5 font-medium text-gray-400">Rs.</span>
            {totalVolume.toLocaleString()}
          </h2>
        </div>
        <div className="p-3 sm:p-6 bg-gray-50 rounded-2xl border border-gray-100">
          <p className="text-[9px] sm:text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 sm:mb-2">Transactions</p>
          <h2 className="text-base sm:text-3xl font-black text-gray-900">{commissions.length}</h2>
        </div>
      </div>

      {/* Monthly Sections */}
      <div className="space-y-8">
        {grouped.map(({ year, month, items }) => {
          const monthTotal = items.reduce((s, c) => s + c.amount, 0);
          const monthVolume = items.reduce((s, c) => s + (c.investment?.amount || 0), 0);

          return (
            <div key={`${year}-${month}`} className="border border-gray-100 rounded-2xl overflow-hidden shadow-sm">

              {/* Month header — receipt tape style */}
              <div className="bg-gray-900 px-5 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <TrendingUp className="w-4 h-4 text-gray-400" />
                  <span className="text-xs font-black text-white uppercase tracking-widest">
                    {MONTHS[month - 1]} {year}
                  </span>
                  <span className="text-[10px] text-gray-500 font-medium">
                    {items.length} transaction{items.length !== 1 ? "s" : ""}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-gray-500 font-bold uppercase mr-2">Month Total</span>
                  <span className="text-sm font-black text-emerald-400">Rs. {fmt(monthTotal)}</span>
                </div>
              </div>

              {/* Desktop table */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      <th className="px-5 py-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">Client</th>
                      <th className="px-5 py-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">Ref</th>
                      <th className="px-5 py-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">Type</th>
                      <th className="px-5 py-3 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Investment</th>
                      <th className="px-5 py-3 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Commission</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {items.map((item: any) => (
                      <tr key={item.id} className="hover:bg-blue-50/20 transition-colors">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="p-1.5 bg-gray-100 rounded-lg shrink-0">
                              <UserCheck className="w-3.5 h-3.5 text-gray-500" />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-gray-900">
                                {item.investment?.client?.fullName || `Client #${item.investment?.clientId}`}
                              </p>
                              <p className="text-[10px] text-gray-400">
                                {new Date(item.createdAt).toLocaleDateString("en-GB")}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <p className="text-[10px] text-gray-400 font-mono">{item.refNumber}</p>
                        </td>
                        <td className="px-5 py-4">
                          <span className={`px-2 py-0.5 text-[9px] font-black rounded uppercase tracking-wider
                            ${item.type === "PERSONAL"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-violet-100 text-violet-700"
                            }`}>
                            {item.type}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-right text-sm font-bold text-gray-500">
                          Rs. {fmt(item.investment?.amount ?? 0)}
                        </td>
                        <td className="px-5 py-4 text-right">
                          <p className="text-sm font-black text-blue-600">+Rs. {fmt(item.amount)}</p>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-gray-50 border-t border-gray-100">
                      <td colSpan={3} className="px-5 py-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                        Volume: Rs. {fmt(monthVolume)}
                      </td>
                      <td className="px-5 py-3 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">
                        Month Total
                      </td>
                      <td className="px-5 py-3 text-right text-sm font-black text-emerald-600">
                        Rs. {fmt(monthTotal)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Mobile cards */}
              <div className="sm:hidden divide-y divide-gray-50">
                {items.map((item: any) => (
                  <div key={item.id} className="p-4">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div>
                        <p className="text-sm font-bold text-gray-900">
                          {item.investment?.client?.fullName || `Client #${item.investment?.clientId}`}
                        </p>
                        <p className="text-[10px] text-gray-400">
                          {new Date(item.createdAt).toLocaleDateString("en-GB")} • {item.refNumber}
                        </p>
                      </div>
                      <span className={`px-2 py-0.5 text-[9px] font-black rounded uppercase shrink-0
                        ${item.type === "PERSONAL" ? "bg-blue-100 text-blue-700" : "bg-violet-100 text-violet-700"}`}>
                        {item.type}
                      </span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-gray-50">
                      <div>
                        <p className="text-[9px] text-gray-400 font-black uppercase mb-0.5">Investment</p>
                        <p className="text-xs font-bold text-gray-600">Rs. {fmt(item.investment?.amount ?? 0)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[9px] text-gray-400 font-black uppercase mb-0.5">Commission</p>
                        <p className="text-sm font-black text-blue-600">+Rs. {fmt(item.amount)}</p>
                      </div>
                    </div>
                  </div>
                ))}
                <div className="px-4 py-3 bg-gray-50 flex justify-between">
                  <span className="text-[10px] font-black text-gray-400 uppercase">Month Total</span>
                  <span className="text-sm font-black text-emerald-600">Rs. {fmt(monthTotal)}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Grand total footer */}
      <div className="mt-8 bg-gray-900 rounded-2xl px-6 py-5 flex justify-between items-center">
        <div>
          <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">All Time Total</p>
          <p className="text-[10px] text-gray-500">
            {commissions.length} transactions • Rs. {fmt(totalVolume)} volume
          </p>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-gray-500 font-black uppercase mb-1">Total Payout</p>
          <p className="text-2xl font-black text-white">
            <span className="text-xs mr-1 font-medium text-gray-400">Rs.</span>
            {fmt(totalEarned)}
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-6 border-t border-gray-100 pt-6 text-center px-4 sm:px-20">
        <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.3em] mb-2">
          Confidential Document
        </p>
        <p className="text-[10px] leading-relaxed text-gray-400 font-medium italic">
          This statement is a system-generated record of commissions earned based on successfully
          processed investments.
        </p>
      </div>
    </div>
  );
};

export default CommissionStatementPage;