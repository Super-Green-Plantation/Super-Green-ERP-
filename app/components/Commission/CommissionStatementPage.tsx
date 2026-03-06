"use client";

import React from "react";
import {
  FileText,
  Wallet,
  BadgeCheck,
  UserCheck,
} from "lucide-react";

const CommissionStatementPage = ({ data }: { data: any }) => {
  const commissions = Array.isArray(data) ? data : (data?.res || data?.commissions || []);

  const totalEarned = commissions.reduce((sum: number, item: any) => sum + item.amount, 0);
  const totalSalesVolume = commissions.reduce((sum: number, item: any) => sum + (item.investment?.amount || 0), 0);
  const memberNo = commissions[0]?.memberEmpNo || "N/A";

  return (
    <div className="max-w-5xl mx-auto rounded-2xl bg-white">

      {/* ── Header ── */}
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
          <p className="text-[10px] text-gray-400 font-medium">
            Ref: {commissions[0]?.refNumber || `STAT-2026-00${commissions[0]?.id}`}
          </p>
        </div>
      </div>

      {/* ── Summary Cards ── */}
      <div className="grid grid-cols-3 gap-3 sm:gap-6 mb-8">
        <div className="p-3 sm:p-6 bg-blue-50/50 rounded-2xl sm:rounded-3xl border border-blue-100 relative overflow-hidden">
          <Wallet className="absolute -right-2 -bottom-2 w-12 h-12 sm:w-20 sm:h-20 text-blue-200/40" />
          <p className="text-[9px] sm:text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1 sm:mb-2">
            Earnings
          </p>
          <h2 className="text-base sm:text-3xl font-black text-blue-900">
            <span className="text-[10px] sm:text-sm mr-0.5 sm:mr-1 font-medium">Rs.</span>
            {totalEarned.toLocaleString()}
          </h2>
        </div>
        <div className="p-3 sm:p-6 bg-gray-50 rounded-2xl sm:rounded-3xl border border-gray-100">
          <p className="text-[9px] sm:text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 sm:mb-2">
            Volume
          </p>
          <h2 className="text-base sm:text-3xl font-black text-gray-900">
            <span className="text-[10px] sm:text-sm mr-0.5 sm:mr-1 font-medium text-gray-400">Rs.</span>
            {totalSalesVolume.toLocaleString()}
          </h2>
        </div>
        <div className="p-3 sm:p-6 bg-gray-50 rounded-2xl sm:rounded-3xl border border-gray-100">
          <p className="text-[9px] sm:text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 sm:mb-2">
            Deals
          </p>
          <h2 className="text-base sm:text-3xl font-black text-gray-900">
            {commissions.length}
          </h2>
        </div>
      </div>

      {/* ── Table — desktop ── */}
      <div className="hidden sm:block bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden mb-8">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                Transaction Details
              </th>
              <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                Type
              </th>
              <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">
                Investment
              </th>
              <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">
                Commission
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {commissions.map((item: any) => (
              <tr key={item.id} className="hover:bg-blue-50/20 transition-all">
                <td className="px-6 py-5">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gray-100 rounded-lg text-gray-500 shrink-0">
                      <UserCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900">
                        Client ID: {item.investment.clientId}
                      </p>
                      <p className="text-[10px] text-gray-400 font-medium">
                        Inv ID: #{item.investmentId} • {new Date(item.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-5">
                  <span className="px-2.5 py-1 bg-gray-900 text-white text-[9px] font-black rounded-md tracking-tighter uppercase">
                    {item.type}
                  </span>
                </td>
                <td className="px-6 py-5 text-right font-bold text-gray-500 text-sm">
                  {item.investment.amount.toLocaleString()}.00
                </td>
                <td className="px-6 py-5 text-right">
                  <p className="text-base font-black text-blue-600">
                    +{item.amount.toLocaleString()}.00
                  </p>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-gray-900 text-white">
              <td colSpan={3} className="px-6 py-5 text-right text-[10px] font-black uppercase tracking-widest">
                Total Payout Amount
              </td>
              <td className="px-6 py-5 text-right">
                <p className="text-2xl font-black">
                  <span className="text-xs mr-1 font-medium text-gray-400">Rs.</span>
                  {totalEarned.toLocaleString()}.00
                </p>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* ── Cards — mobile ── */}
      <div className="sm:hidden space-y-3 mb-8">
        {commissions.map((item: any) => (
          <div key={item.id} className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-2 bg-gray-100 rounded-lg text-gray-500 shrink-0">
                  <UserCheck className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-gray-900 truncate">
                    Client {item.investment.clientId}
                  </p>
                  <p className="text-[10px] text-gray-400 font-medium">
                    #{item.investmentId} • {new Date(item.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <span className="px-2 py-0.5 bg-gray-900 text-white text-[9px] font-black rounded-md tracking-tighter uppercase shrink-0">
                {item.type}
              </span>
            </div>
            <div className="mt-3 flex justify-between items-center pt-3 border-t border-gray-50">
              <div>
                <p className="text-[9px] text-gray-400 font-black uppercase mb-0.5">Investment</p>
                <p className="text-xs font-bold text-gray-600">
                  Rs. {item.investment.amount.toLocaleString()}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[9px] text-gray-400 font-black uppercase mb-0.5">Commission</p>
                <p className="text-base font-black text-blue-600">
                  +{item.amount.toLocaleString()}.00
                </p>
              </div>
            </div>
          </div>
        ))}

        {/* Mobile total */}
        <div className="bg-gray-900 rounded-2xl px-5 py-4 flex justify-between items-center">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Payout</p>
          <p className="text-xl font-black text-white">
            <span className="text-xs mr-1 font-medium text-gray-400">Rs.</span>
            {totalEarned.toLocaleString()}.00
          </p>
        </div>
      </div>

      {/* ── Footer ── */}
      <div className="border-t border-gray-100 pt-6 text-center px-4 sm:px-20">
        <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.3em] mb-3">
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