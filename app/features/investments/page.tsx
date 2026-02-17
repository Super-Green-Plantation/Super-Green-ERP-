"use client";

import InvestmentTable from "@/app/components/InvestmentTable";
import Loading from "@/app/components/Loading";
import Error from "@/app/components/Error";
import { Plus, Wallet } from "lucide-react";
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
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <Wallet className="w-6 h-6 text-blue-600" />
          Investments
        </h1>
        <Link
          href="/features/investments/create"
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all shadow-md active:scale-95 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Investment with existing client
        </Link>
      </div>

      {investments.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-12 text-center">
          <Wallet className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-700 mb-2">No investments yet</h3>
          <p className="text-sm text-slate-500 mb-6">Get started by creating your first investment</p>
          <Link
            href="/features/investments/create"
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-all shadow-md active:scale-95"
          >
            <Plus className="w-4 h-4" /> Create Investment
          </Link>
        </div>
      ) : (
        <InvestmentTable investments={{ getAllInvestment: investments }} />
      )}
    </div>
  );
};

export default page;
