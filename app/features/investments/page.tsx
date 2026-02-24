"use client";

import InvestmentTable from "@/app/components/InvestmentTable";
import Loading from "@/app/components/Loading";
import Error from "@/app/components/Error";
import { generateInvestmentsReportPDF } from "@/app/utils/pdfGenerator";
import { Download, Plus, Wallet } from "lucide-react";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import { getInvestments } from "./actions";

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
    <div className="max-w-7xl mx-auto">
      <div className="sm:flex justify-between items-center mb-6 space-y-6">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <Wallet className="w-6 h-6 text-blue-600" />
          Investments
        </h1>
        <div className="flex gap-3">

        <Link
          href="/features/investments/create"
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all shadow-md active:scale-95 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Investment with existing client
        </Link>
        {investments.length > 0 && (
          <button
            onClick={() => generateInvestmentsReportPDF(investments)}
            className="group flex flex-col md:flex-row items-center justify-center gap-2 px-6 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-semibold transition-all active:scale-95 ml-2"
          >
            <Download className="w-4 h-4 group-hover:text-blue-600 transition-colors" />
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
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all shadow-md active:scale-95 flex items-center justify-center gap-2"
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
