"use client";

import InvestmentTable from "@/app/components/Commission/InvestmentTable";
import { Plus, Wallet } from "lucide-react";
import Link from "next/link";

const Commission = () => {
 

  return (
    <div className="max-w-7xl mx-auto sm:space-y-8 space-y-2 sm:p-4 md:p-8 min-h-screen">
      {/* Header Container */}
      <div className="flex flex-col sm:justify-between space-y-3 sm:flex-row sm:space-y-0 sm:space-x-3 sm:items-center">
        <h1 className="sm:text-2xl text-lg font-semibold md:text-3xl text-slate-900 tracking-tighter flex items-center">
          Commission
        </h1>
        <Link 
          href="/features/commissions/create"
           className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-slate-900 hover:bg-blue-600 text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all shadow-xl shadow-slate-200 active:scale-95 mb-5"
        >
          <Plus className="w-4 h-4" /> Create Commission
        </Link>
      </div>

      {/* Table Container */}
      <div className="">
        <InvestmentTable/>
      </div>
    </div>
  );
};

export default Commission;