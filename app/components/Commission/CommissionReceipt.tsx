"use client";

import React from "react";
import { Check, Printer, ShieldCheck, ArrowUpRight, Fingerprint } from "lucide-react";

const CommissionReceipt = ({ data }: { data: any }) => {
  if (!data) return null;
  const { investment, commissions, alreadyProcessed } = data;
  const total = commissions.reduce((acc: number, curr: any) => acc + curr.amount, 0);

  return (
    <div className="max-w-xl mx-auto my-12 group relative">
      {/* Print Utility CSS */}
      <style jsx global>{`
        @media print {
          body * { visibility: hidden; }
          #payout-receipt, #payout-receipt * { visibility: visible; }
          #payout-receipt { 
            position: absolute; left: 0; top: 0; width: 100%; 
            border: none !important; shadow: none !important;
          }
          .hide-on-print { display: none !important; }
        }
      `}</style>

      {/* Main Receipt Container */}
      <div 
        id="payout-receipt"
        className="bg-[#FAFAFA] border border-gray-200 rounded-sm shadow-sm overflow-hidden font-sans"
      >
        {/* Top Header / Branding */}
        <div className="bg-white p-8 pb-0 flex justify-between items-start">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-2 py-1 bg-black text-white rounded-xs">
              <ShieldCheck className="w-4 h-4" />
              <span className="text-[10px] font-black uppercase tracking-widest">Secure Payout</span>
            </div>
            <h1 className="text-3xl font-light tracking-tighter text-gray-900">
              Commission <span className="font-bold">Statement</span>
            </h1>
          </div>
          <button 
            onClick={() => window.print()}
            className="hide-on-print p-3 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-black"
          >
            <Printer className="w-5 h-5" />
          </button>
        </div>

        {/* Transaction Meta */}
        <div className="p-8 grid grid-cols-2 gap-8 border-b border-gray-100 bg-white">
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Issue Date</p>
            <p className="text-sm font-semibold text-gray-900">{new Date().toLocaleDateString('en-GB')}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Reference ID</p>
            <p className="text-sm font-mono font-bold text-gray-900 uppercase">#TRX-{investment.id}</p>
          </div>
        </div>

        {/* The Breakdown */}
        <div className="p-8 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black uppercase tracking-widest text-gray-400">Distribution Logic</h3>
            <span className="text-[10px] font-medium px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full">Verified</span>
          </div>

          <div className="space-y-3">
            {commissions.map((comm: any) => (
              <div 
                key={comm.id} 
                className="relative p-4 bg-white border border-gray-100 rounded-md hover:border-gray-300 transition-all group/item"
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-gray-900 uppercase">{comm.member?.name}</p>
                    <ArrowUpRight className="w-3 h-3 text-gray-300 group-hover/item:text-emerald-500 transition-colors" />
                  </div>
                  <p className="text-sm font-mono font-bold text-gray-900">
                    {comm.amount?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-tight">
                  <span className="text-gray-400">{comm.member?.position.title} • {comm.type}</span>
                  <span className="text-emerald-600 bg-emerald-50 px-1.5 py-0.5">
                    {((comm.amount / investment.amount) * 100).toFixed(2)}% SHARE
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Summary Footer */}
        <div className="p-8 bg-gray-900 text-white relative">
          {/* Decorative Corner */}
          <div className="absolute top-0 right-0 w-16 h-16 bg-white/5 clip-path-triangle" />
          
          <div className="flex justify-between items-end">
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-emerald-400">
                <Fingerprint className="w-6 h-6" />
                <div className="leading-none">
                  <p className="text-[8px] font-black uppercase tracking-[0.2em]">Auth Signature</p>
                  <p className="text-[10px] font-mono text-white opacity-50 uppercase">{Math.random().toString(36).substring(7)}</p>
                </div>
              </div>
              <p className="text-[9px] font-medium text-gray-400 max-w-50 leading-relaxed">
                This document serves as formal confirmation of funds processed via the internal ledger.
              </p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-400 mb-1">Grand Payout</p>
              <p className="text-4xl font-light tracking-tighter">
                LKR <span className="font-bold">{total.toLocaleString()}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Edge Branding */}
        <div className="bg-emerald-500 h-1 w-full" />
      </div>

      {/* Decorative Background Elements */}
      <div className="absolute -z-10 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full border border-gray-100 rounded-xl scale-110 opacity-50" />
    </div>
  );
};

export default CommissionReceipt;