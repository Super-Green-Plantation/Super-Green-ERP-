"use client";
import React, { useEffect, useState } from "react";
import { getFinancialPlanById, getFinancialPlans } from "../financial_plans/actions";
import { FinancialPlan } from "@/app/types/FinancialPlan";
import FinancialPlanCard from "./FinancialPlanCard";
import { X } from "lucide-react";
import Heading from "@/app/components/Heading";

const formatLKR = (val: number) =>
  new Intl.NumberFormat("en-LK", {
    style: "currency",
    currency: "LKR",
    minimumFractionDigits: 2,
  }).format(val);

const Page = () => {
  const [plans, setPlans] = useState<FinancialPlan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<FinancialPlan | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [investmentAmount, setInvestmentAmount] = useState<number>(0);

  useEffect(() => {
    getFinancialPlans().then(setPlans);
  }, []);

  useEffect(() => {
    if (!selectedId) return;
    getFinancialPlanById(selectedId).then(setSelectedPlan);
  }, [selectedId]);

  const handleSelectPlan = (id: number) => {
    if (selectedId === id) {
      setSelectedId(null);
      setSelectedPlan(null);
      setInvestmentAmount(0);
    } else {
      setSelectedId(id);
    }
  };

  // ── per-year calculations ──────────────────────────────────────────────────
  const rates = Array.isArray(selectedPlan?.rate) ? selectedPlan.rate : [];
  const months = selectedPlan?.duration ?? 0;
  const years = rates.length;
  const monthsPerYear = years > 0 ? months / years : 0;

  const yearlyBreakdown = rates.map((rate, i) => {
    const harvest = investmentAmount * (rate / 100) * (monthsPerYear / 12);
    return {
      year: i + 1,
      rate,
      monthlyYield: harvest / monthsPerYear,
      yearlyYield: harvest,
    };
  });

  const totalHarvest = yearlyBreakdown.reduce((s, y) => s + y.yearlyYield, 0);
  const totalReturn = totalHarvest + investmentAmount;

  return (
    <div className="max-w-7xl mx-auto sm:space-y-8 space-y-2 sm:p-4 md:p-8 min-h-screen">
      <header className="mb-8">
        <Heading>Available Financial Plans</Heading>
        <p className="text-slate-500 mt-1 font-medium">
          Select a plan to initialize the projection engine.
        </p>
      </header>

      <div className="flex-1 overflow-y-auto pb-6 scrollbar-hide">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plans?.map(plan => (
            <FinancialPlanCard
              key={plan.id}
              plan={plan}
              isSelected={selectedId === plan.id}
              onSelect={() => handleSelectPlan(plan.id)}
            />
          ))}
        </div>
      </div>

      {/* Calculator */}
      <div className="bg-white border-t border-slate-200 rounded-2xl p-6 z-20">
        <div className="max-w-5xl mx-auto">
          {selectedPlan ? (
            <div className="flex flex-col gap-6 animate-in slide-in-from-bottom-4 duration-500">

              {/* Amount input row */}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-3 flex-1 max-w-xs">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h2 className="text-sm font-bold uppercase tracking-widest text-slate-700">
                        {selectedPlan.name}
                      </h2>
                      <button
                        onClick={() => { setSelectedId(null); setSelectedPlan(null); }}
                        className="p-1 bg-red-50 rounded-lg text-red-400 hover:bg-red-100 transition-colors"
                      >
                        <X size={16} />
                      </button>
                    </div>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">Rs.</span>
                      <input
                        type="number"
                        className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all outline-none text-md font-semibold text-slate-900"
                        placeholder="Enter Amount"
                        value={investmentAmount || ""}
                        onChange={e => setInvestmentAmount(Number(e.target.value))}
                      />
                    </div>
                  </div>
                </div>

                {/* Summary totals */}
                {investmentAmount > 0 && (
                  <div className="flex gap-3 flex-wrap">
                    <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                      <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-widest mb-1">
                        Total Harvest
                      </p>
                      <p className="text-sm font-bold text-emerald-700 tabular-nums">
                        {formatLKR(totalHarvest)}
                      </p>
                    </div>
                    <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100">
                      <p className="text-[10px] text-blue-600 font-bold uppercase tracking-widest mb-1">
                        Maturity Return
                      </p>
                      <p className="text-sm font-bold text-blue-700 tabular-nums">
                        {formatLKR(totalReturn)}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Per-year breakdown table */}
              {investmentAmount > 0 && yearlyBreakdown.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-100">
                        <th className="text-left text-[10px] font-black uppercase tracking-widest text-slate-400 pb-2 pr-4">Year</th>
                        <th className="text-right text-[10px] font-black uppercase tracking-widest text-slate-400 pb-2 px-4">Rate</th>
                        <th className="text-right text-[10px] font-black uppercase tracking-widest text-slate-400 pb-2 px-4">Monthly Yield</th>
                        <th className="text-right text-[10px] font-black uppercase tracking-widest text-slate-400 pb-2 pl-4">Yearly Yield</th>
                      </tr>
                    </thead>
                    <tbody>
                      {yearlyBreakdown.map(row => (
                        <tr key={row.year} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                          <td className="py-2.5 pr-4 font-bold text-slate-700">Year {row.year}</td>
                          <td className="py-2.5 px-4 text-right">
                            <span className="inline-flex items-center px-2 py-0.5 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold">
                              {row.rate}%
                            </span>
                          </td>
                          <td className="py-2.5 px-4 text-right font-semibold text-slate-700 tabular-nums">
                            {formatLKR(row.monthlyYield)}
                          </td>
                          <td className="py-2.5 pl-4 text-right font-semibold text-slate-700 tabular-nums">
                            {formatLKR(row.yearlyYield)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t-2 border-slate-200">
                        <td colSpan={3} className="pt-3 font-black text-slate-600 text-xs uppercase tracking-widest">
                          Total Harvest
                        </td>
                        <td className="pt-3 text-right font-black text-slate-800 tabular-nums">
                          {formatLKR(totalHarvest)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}

            </div>
          ) : (
            <div className="py-6 text-center">
              <p className="text-sm font-bold text-slate-400 uppercase tracking-widest animate-pulse">
                Please select a plan above to calculate returns
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Page;