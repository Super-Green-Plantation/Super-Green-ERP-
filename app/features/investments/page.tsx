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
      <div className="sm:flex justify-between items-center mb-6 space-y-6">
          <Heading>

            Investments
          </Heading>
        <div className="flex gap-3">

          <Link
            href="/features/investments/create"
             className="flex-1 sm:flex-none flex items-center justify-center uppercase gap-2 px-4 py-3 bg-slate-900 hover:bg-blue-600 text-white text-xs sm:font-black font-bold tracking-widest rounded-xl transition-all shadow-xl shadow-slate-200 active:scale-95"
          >
           Investment with existing client
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
