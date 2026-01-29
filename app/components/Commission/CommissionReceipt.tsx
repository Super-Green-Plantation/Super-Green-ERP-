"use client";

import { Check, Printer } from "lucide-react";

const CommissionReceipt = ({ data }: { data: any }) => {
  if (!data) return null;
  const { investment, commissions, alreadyProcessed } = data;
  const total = commissions.reduce((acc: number, curr: any) => acc + curr.amount, 0);

  return (
    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden print:border-none print:shadow-none max-w-7xl mx-auto">
      {/* Subtle Status Header */}
      <div className="px-6 py-4 bg-gray-50/50 border-b border-gray-100 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-emerald-500" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
            {alreadyProcessed ? "Duplicate Receipt" : "Transaction Confirmed"}
          </span>
        </div>
        <button 
          onClick={() => window.print()}
          className="text-gray-400 hover:text-gray-900 transition-colors"
        >
          <Printer className="w-4 h-4" />
        </button>
      </div>

      <div className="p-8">
        {/* Header Section */}
        <div className="flex justify-between items-start mb-10">
          <div>
            <h2 className="text-sm font-black uppercase tracking-[0.2em] text-gray-400 mb-1">Commission Payout</h2>
            <p className="text-2xl font-light text-gray-900">
              LKR <span className="font-bold">{total.toLocaleString()}</span>
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-bold text-gray-400 uppercase">Investment Ref</p>
            <p className="text-sm font-mono font-bold text-gray-900">#{investment.id}</p>
          </div>
        </div>

        {/* Minimal Table */}
        <div className="space-y-4">
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 border-b border-gray-50 pb-2">
            Allocation Details
          </p>
          
          <div className="divide-y divide-gray-50">
            {commissions.map((comm: any) => (
              <div key={comm.id} className="py-4 flex justify-between items-center">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-gray-800">{comm.member?.name}</p>
                    <span className="text-[9px] px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded font-bold uppercase">
                      {comm.member?.position.title}
                    </span>
                  </div>
                  <p className="text-[10px] text-gray-400 mt-0.5">Emp ID: {comm.memberEmpNo} • {comm.type}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-gray-900">
                    {comm.amount?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </p>
                  <p className="text-[9px] text-emerald-600 font-bold">
                    + {((comm.amount / investment.amount) * 100).toFixed(1)}%
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Grand Total Footer */}
        <div className="mt-8 pt-6 border-t border-gray-100 flex justify-between items-end">
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Authorized By</p>
            <div className="flex items-center gap-2 text-emerald-600">
              <Check className="w-3 h-3" />
              <span className="text-xs font-bold uppercase">Digital Ledger Verified</span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-bold text-gray-400 uppercase">Total Distribution</p>
            <p className="text-xl font-black text-gray-900 tracking-tighter">
              Rs. {total.toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* Very thin bottom edge */}
      <div className="h-1 bg-gray-900" />
    </div>
  );
};

export default CommissionReceipt;