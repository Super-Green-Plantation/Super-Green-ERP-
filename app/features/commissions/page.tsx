"use client";

import InvestmentTable from "@/app/components/Commission/InvestmentTable";
import { Plus, Wallet } from "lucide-react";
import Link from "next/link";

const Commission = () => {
 

  return (
    <div className="max-w-7xl min-h-screen mx-auto">
      {/* Header Container */}
      <div className="flex flex-col space-y-3 sm:flex-row sm:space-y-0 sm:space-x-3 sm:items-center">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <Wallet className="w-6 h-6 text-blue-600" />
          Commission
        </h1>
        <Link 
          href="/features/commissions/create"
          className="mb-6 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all shadow-md active:scale-95 flex items-center gap-2"
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