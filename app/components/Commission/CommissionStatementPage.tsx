"use client";

import React from "react";
import {
  FileText,
  Printer,
  Download,
  Wallet,
  TrendingUp,
  BadgeCheck,
  ArrowLeft,
  Calendar,
  UserCheck,
} from "lucide-react";

const CommissionStatementPage = ({ data }: { data: any }) => {
  // Ensure we are hitting the 'res' array from your JSON
  const commissions = data?.res || [];
  console.log("from receipt", data);

  // Aggregated Totals
  const totalEarned = commissions.reduce(
    (sum: number, item: any) => sum + item.amount,
    0,
  );
  const totalSalesVolume = commissions.reduce(
    (sum: number, item: any) => sum + (item.investment?.amount || 0),
    0,
  );
  const memberNo = commissions[0]?.memberEmpNo || "N/A";

  return (
    <div className="max-w-5xl mx-auto p-6 md:p-10 rounded-2xl bg-white min-h-screen">
      {/* Main Invoice Header */}
      <div className="border-b-4 border-gray-900 pb-8 mb-10 flex justify-between items-end">
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-gray-900 rounded-2xl">
              <FileText className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-gray-900 uppercase tracking-tighter">
                Commission Statement
              </h1>
              <p className="text-gray-400 font-bold text-xs uppercase tracking-[0.2em]">
                Official Earnings Record
              </p>
            </div>
          </div>
          <div className="flex gap-8 mt-6">
            <div>
              <p className="text-[10px] text-gray-400 font-black uppercase mb-1">
                Advisor ID
              </p>
              <p className="text-sm font-bold text-gray-900">#EMP-{memberNo}</p>
            </div>
            <div>
              <p className="text-[10px] text-gray-400 font-black uppercase mb-1">
                Statement Date
              </p>
              <p className="text-sm font-bold text-gray-900">
                {new Date().toLocaleDateString("en-GB")}
              </p>
            </div>
          </div>
        </div>

        <div className="text-right hidden md:block">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full border border-emerald-100 mb-2">
            <BadgeCheck className="w-4 h-4" />
            <span className="text-[10px] font-black uppercase">
              Verified Payout
            </span>
          </div>
          <p className="text-[10px] text-gray-400 font-medium">
            Ref: STAT-2026-00{commissions[0]?.id}
          </p>
        </div>
      </div>

      {/* Summary Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="p-6 bg-blue-50/50 rounded-3xl border border-blue-100 relative overflow-hidden">
          <Wallet className="absolute -right-2 -bottom-2 w-20 h-20 text-blue-200/40" />
          <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-2">
            Total Earnings
          </p>
          <h2 className="text-3xl font-black text-blue-900">
            <span className="text-sm mr-1 font-medium">Rs.</span>
            {totalEarned.toLocaleString()}
          </h2>
        </div>
        <div className="p-6 bg-gray-50 rounded-3xl border border-gray-100">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
            Portfolio Volume
          </p>
          <h2 className="text-3xl font-black text-gray-900">
            <span className="text-sm mr-1 font-medium text-gray-400">Rs.</span>
            {totalSalesVolume.toLocaleString()}
          </h2>
        </div>
        <div className="p-6 bg-gray-50 rounded-3xl border border-gray-100">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
            Closed Deals
          </p>
          <h2 className="text-3xl font-black text-gray-900">
            {commissions.length}
          </h2>
        </div>
      </div>

      {/* Invoice Ledger Table */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden mb-10">
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
                Investment Amount
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
                    <div className="p-2 bg-gray-100 rounded-lg text-gray-500">
                      <UserCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900">
                        Client ID: {item.investment.clientId}
                      </p>
                      <p className="text-[10px] text-gray-400 font-medium">
                        Inv ID: #{item.investmentId} •{" "}
                        {new Date(item.createdAt).toLocaleDateString()}
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
              <td
                colSpan={3}
                className="px-6 py-6 text-right text-[10px] font-black uppercase tracking-widest"
              >
                Total Payout Amount
              </td>
              <td className="px-6 py-6 text-right">
                <p className="text-2xl font-black">
                  <span className="text-xs mr-1 font-medium text-gray-400">
                    Rs.
                  </span>
                  {totalEarned.toLocaleString()}.00
                </p>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Legal Footer */}
      <div className="border-t border-gray-100 pt-8 text-center md:px-20">
        <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.3em] mb-4">
          Confidential Document
        </p>
        <p className="text-[10px] leading-relaxed text-gray-400 font-medium italic">
          This statement is a system-generated record of commissions earned
          based on successfully processed investments. The amounts shown are
          gross and may be subject to statutory withholdings or deductions as
          per member agreements. In case of discrepancies, contact the finance
          department within 48 hours.
        </p>
      </div>
    </div>
  );
};

export default CommissionStatementPage;
