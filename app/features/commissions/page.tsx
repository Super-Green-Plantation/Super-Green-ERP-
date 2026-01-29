"use client";

import InvestmentTable from "@/app/components/Commission/InvestmentTable";
import { Pen, Plus, Wallet, Trash2, User, MapPin, Eye } from "lucide-react";
import Link from "next/link";
import React from "react";

const Commission = () => {
 

  return (
    <div className="max-w-7xl min-h-screen mx-auto">
      {/* Header Container */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <Wallet className="w-6 h-6 text-blue-600" />
          Investments
        </h1>
        <Link 
          href="/features/commissions/create"
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all shadow-md active:scale-95 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Create Commission
        </Link>
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto rounded-xl border border-gray-100 bg-white shadow-sm">
        <InvestmentTable/>
      </div>
    </div>
  );
};

export default Commission;