"use client";

import React from "react";
import { 
  ArrowUpRight, 
  Fingerprint, 
  ShieldCheck, 
  Globe, 
  QrCode,
  FileText
} from "lucide-react";
import { useIsMounted } from "@/app/hooks/useIsMounted";

/* ---------------- Types ---------------- */
interface CommissionItem {
  amount: number;
  type: string;
  member?: {
    nameWithInitials: string;
    position: {
      title: string;
    };
  };
}

interface ReceiptData {
  investment: {
    refNumber: string;
    amount: number;
    planName?: string;
  };
  commissions: CommissionItem[];
  alreadyProcessed: boolean;
}

interface Props {
  data: ReceiptData | null;
}

const CommissionReceipt = ({ data }: Props) => {
  const isMounted = useIsMounted();
  
  if (!data) return null;

  const { investment, commissions } = data;
  const totalPayout = commissions.reduce((acc, curr) => acc + curr.amount, 0);

  return (
    <div className="max-w-3xl mx-auto my-12 group relative">
      {/* Enhanced Print Logic */}
      <style jsx global>{`
        @media print {
          body { background: white !important; }
          .hide-on-print { display: none !important; }
          #payout-receipt {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            border: none !important;
            box-shadow: none !important;
            -webkit-print-color-adjust: exact;
          }
          .receipt-shadow { box-shadow: none !important; }
        }
      `}</style>

      {/* Designation Label */}
      <div className="flex justify-between items-center mb-2 px-1">
        <span className="text-[10px] font-black uppercase tracking-tighter text-slate-400">
          System Generated Document • Internal Use Only
        </span>
        <span className="text-[10px] font-black uppercase tracking-tighter text-blue-600">
          Original Copy
        </span>
      </div>

      <div
        id="payout-receipt"
        className="bg-white border border-slate-200 rounded-lg shadow-2xl shadow-slate-200/50 overflow-hidden font-sans relative "
      >
        {/* Subtle Watermark */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.03] rotate-12">
          <Globe className="w-96 h-96" />
        </div>

        {/* 1. Header Section */}
        <div className="p-8 border-b border-slate-100 flex justify-between items-start bg-slate-50/50">
          <div className="space-y-3">
           
            <h1 className="text-4xl font-black tracking-tight text-slate-900 leading-none">
              COMMISSION RECEIPT<br />
            </h1>
            <p className="text-[8px] font-bold text-slate-400 mt-2 uppercase tracking-widest">Trace ID: {investment.refNumber}</p>
          </div>
          <div className="text-right">
    
          </div>
        </div>

        {/* 2. Transaction Metadata Grid */}
        <div className="grid grid-cols-3 gap-0 border-b border-slate-100">
          <MetaTile 
            label="Issue Date" 
            value={isMounted ? new Date().toLocaleDateString("en-GB", { day: '2-digit', month: 'short', year: 'numeric' }) : "—"} 
          />
          <MetaTile 
            label="Reference ID" 
            value={investment.refNumber} 
            isMono 
          />
          <MetaTile 
            label="Investment Base" 
            value={`LKR ${investment.amount.toLocaleString()}`} 
          />
        </div>

        {/* 3. Breakdown Table */}
        <div className="p-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-slate-400" />
              <h3 className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Distribution Analysis</h3>
            </div>
            <span className="h-1 w-24 bg-slate-100 rounded-full" />
          </div>

          <div className="space-y-2">
            {commissions.map((comm, idx) => (
              <div
                key={idx}
                className="group/row flex items-center justify-between p-4 rounded-xl border border-transparent hover:border-slate-100 hover:bg-slate-50/50 transition-all"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 font-bold text-xs group-hover/row:bg-blue-600 group-hover/row:text-white transition-colors">
                    {idx + 1}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900 leading-none mb-1">
                      {comm.member?.nameWithInitials}
                    </p>
                    <p className="text-[10px] font-medium text-slate-400 uppercase tracking-tighter">
                      {comm.member?.position.title} • <span className="text-slate-600">{comm.type}</span>
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center justify-end gap-1 text-slate-900">
                    <span className="text-[10px] font-bold text-slate-400">LKR</span>
                    <span className="text-base font-black tracking-tight">
                      {comm.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                    <ArrowUpRight className="w-3 h-3 text-emerald-500 opacity-0 group-hover/row:opacity-100 transition-opacity" />
                  </div>
                  <div className="inline-block px-1.5 py-0.5 bg-emerald-50 text-emerald-700 text-[9px] font-bold rounded mt-1">
                    {((comm.amount / investment.amount) * 100).toFixed(2)}% CONTRIBUTION
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 4. Footer Summary */}
        <div className="bg-slate-900 p-8 text-white relative">
          <div className="absolute top-0 right-0 w-32 h-full bg-blue-600/10 skew-x-[-20deg] translate-x-16" />
          
          <div className="flex justify-between items-end relative z-10">
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                
               
              </div>
             
            </div>

            <div className="text-right">
              <p className="text-[11px] font-bold uppercase tracking-widest text-blue-400 mb-2">Total Disbursed</p>
              <div className="flex items-baseline justify-end gap-2">
                <span className="text-xl font-light text-slate-400">LKR</span>
                <span className="text-4xl font-black tracking-tighter text-white">
                  {totalPayout.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Anti-Tamper Bar */}
        <div className="h-1.5 w-full flex">
          <div className="h-full w-1/3 bg-blue-600" />
          <div className="h-full w-1/3 bg-blue-400" />
          <div className="h-full w-1/3 bg-emerald-500" />
        </div>
      </div>
    </div>
  );
};

/* --- Helper Component --- */
const MetaTile = ({ label, value, isMono = false }: { label: string; value: string; isMono?: boolean }) => (
  <div className="p-6 border-r border-slate-100 last:border-r-0 bg-white">
    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.15em] mb-2">{label}</p>
    <p className={`text-sm font-bold text-slate-800 ${isMono ? 'font-mono' : ''}`}>
      {value}
    </p>
  </div>
);

export default CommissionReceipt;