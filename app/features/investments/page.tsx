"use client";

import InvestmentTable from "@/app/components/InvestmentTable";
import Loading from "@/app/components/Loading";
import Error from "@/app/components/Error";
import { generateInvestmentsReportPDF } from "@/app/utils/pdfGenerator";
import { Download, Plus, Wallet } from "lucide-react";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import { getInvestments } from "./actions";
import Heading from "@/app/components/Heading";

const page = () => {
  const [investments, setInvestments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    const fetchInvestments = async () => {
      try {
        setIsLoading(true);
        const data = await getInvestments();
        setInvestments(data);
      } catch (error) {
        console.error("Error fetching investments:", error);
        setIsError(true);
      } finally {
        setIsLoading(false);
      }
    };

    fetchInvestments();
  }, []);

  if (isLoading) return <Loading />;
  if (isError) return <Error />;

  return (
    <div className="max-w-7xl mx-auto sm:space-y-8 space-y-2 sm:p-4 md:p-8 min-h-screen">
  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8">
  {/* Heading Area */}
  <Heading className=" drop-shadow-sm">
    Investments
  </Heading>

  {/* Actions Area */}
  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
    
    {/* Create Button: High Contrast Slate/Blue */}
    <Link
      href="/features/investments/create"
      className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-slate-900 hover:bg-blue-600 border border-white/10 text-white text-[11px] font-black uppercase tracking-[0.15em] rounded-xl transition-all shadow-lg shadow-slate-900/40 active:scale-95"
    >
      <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse md:block hidden" />
      Investment with existing client
    </Link>

    {/* Export Button: High Contrast Slate/Emerald */}
    {investments.length > 0 && (
      <button
        onClick={() => generateInvestmentsReportPDF(investments)}
        className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-slate-900 hover:bg-emerald-600 border border-white/10 text-white text-[11px] font-black uppercase tracking-[0.15em] rounded-xl transition-all shadow-lg shadow-slate-900/40 active:scale-95"
      >
        <Download className="w-4 h-4 text-emerald-400" />
        <span>Export List</span>
      </button>
    )}
  </div>
</div>

      {investments.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-12 text-center">
          <Wallet className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-700 mb-2">No investments yet</h3>
          <p className="text-sm text-slate-500 mb-6">Get started by creating your first investment</p>
          <Link
            href="/features/investments/create"
            className="flex-1 sm:flex-none flex items-center justify-center uppercase gap-2 px-4 py-3 bg-slate-900 hover:bg-blue-600 text-white text-xs sm:font-black font-bold tracking-widest rounded-xl transition-all shadow-xl shadow-slate-200 active:scale-95"
          >
            <Plus className="w-4 h-4" /> Create
          </Link>
        </div>
      ) : (
        <InvestmentTable investments={{ getAllInvestment: investments }} />
      )}
    </div>
  );
};

export default page;
