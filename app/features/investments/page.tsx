"use client";

import InvestmentTable from "@/app/components/InvestmentTable";
import { useDashboard } from "@/app/hooks/useDashboard";
import { Plus, Wallet } from "lucide-react";
import Link from "next/link";
import React from "react";

const page = () => {
//   const { data } = useDashboard();
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <Wallet className="w-6 h-6 text-blue-600" />
          Investments
        </h1>
        <Link
          href="/features/commissions/create"
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all shadow-md active:scale-95 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Investment with existing client
        </Link>
      </div>

      {/* <InvestmentTable investments={data} /> */}
    </div>
  );
};

export default page;
