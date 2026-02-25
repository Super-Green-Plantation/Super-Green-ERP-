"use client";
import React, { useEffect, useState } from "react";
import { getFinancialPlanById, getFinancialPlans } from "../financial_plans/actions";
import { FinancialPlan } from "@/app/types/FinancialPlan";
import FinancialPlanCard from "./FinancialPlanCard";
import { Calculator, Cross, RemoveFormatting, X } from "lucide-react";
import Heading from "@/app/components/Heading";

const Page = () => {
  const [plans, setPlans] = useState<FinancialPlan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<FinancialPlan | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [investmentAmount, setInvestmentAmount] = useState<number>(0);

  useEffect(() => {
    const fetchPlans = async () => {
      const res = await getFinancialPlans();
      setPlans(res);
    };
    fetchPlans();
  }, []);

  useEffect(() => {
    if (!selectedId) return;
    const fetchSelectedPlan = async () => {
      const res = await getFinancialPlanById(selectedId);
      setSelectedPlan(res);
    };
    fetchSelectedPlan();
  }, [selectedId]);

  // Calculations
  const rateDecimal = (selectedPlan?.rate || 0) / 100;
  const monthlyReturn = (investmentAmount * rateDecimal) / 12;
  const yearlyReturn = investmentAmount * rateDecimal;

  // LKR Formatter
  const formatLKR = (val: number) =>
    new Intl.NumberFormat('en-LK', {
      style: 'currency',
      currency: 'LKR',
      minimumFractionDigits: 2
    }).format(val);

  const handleSelectPlan = (id: number) => {
    if (selectedId === id) {
      // Unselect if clicking the same card
      setSelectedId(null);
      setSelectedPlan(null);
      setInvestmentAmount(0); // Optional: Reset amount on unselect
    } else {
      // Select new plan
      setSelectedId(id);
    }
  };
  return (
    /* 1. Main Container: Fixed height, no scroll, flex layout */
    <div className="max-w-7xl mx-auto sm:space-y-8 space-y-2 sm:p-4 md:p-8 min-h-screen">
      <header className="mb-8">
        <Heading>

          Available Financial Plans
        </Heading>
        <p className="text-slate-500 mt-1 font-medium">
          Select a plan to initialize the projection engine.
        </p>
      </header>
      {/* 2. Scrollable Header & Plans Section */}
      <div className="flex-1 overflow-y-auto pb-6 scrollbar-hide">


        {/* Plan Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plans?.map((plan) => (
            <FinancialPlanCard
              key={plan.id}
              plan={plan}
              isSelected={selectedId === plan.id}
              onSelect={() => handleSelectPlan(plan.id)}
            />
          ))}
        </div>
      </div>

      {/* 3. Fixed Calculation Section */}
      <div className="bg-white border-t border-slate-200 rounded-2xl p-6 z-20">
        <div className="max-w-5xl mx-auto">
          {selectedPlan ? (
            <div className="flex flex-col lg:flex-row items-center gap-8 animate-in slide-in-from-bottom-4 duration-500">
              <div className="w-full lg:w-1/3">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <h2 className="text-sm font-black uppercase tracking-widest text-slate-700">
                      {selectedPlan.name}
                    </h2>
                  </div>

                  {/* Unselect Button inside the Calculator */}
                  <button
                    onClick={() => { setSelectedId(null); setSelectedPlan(null); }}
                    className="bg-red-100 flex items-center justify-center px-1 py-1 rounded-md text-[10px] font-black text-slate-400 hover:text-rose-500 uppercase tracking-tighter transition-colors"
                  >
                    <X size={20} className="inline text-red-400" />
                  </button>
                </div>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">Rs.</span>
                  <input
                    type="number"
                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all outline-none text-md font-semibold text-slate-900"
                    placeholder="Enter Amount"
                    value={investmentAmount || ""}
                    onChange={(e) => setInvestmentAmount(Number(e.target.value))}
                  />
                </div>
              </div>

              {/* Right: Results Grid */}
              <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 flex flex-col justify-center">
                  <p className="text-[10px] text-emerald-600 font-black uppercase tracking-widest mb-1">Monthly Yield</p>
                  <p className="text-md font-semibold text-emerald-700 tabular-nums">
                    {formatLKR(monthlyReturn)}
                  </p>
                </div>

                <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 flex flex-col justify-center">
                  <p className="text-[10px] text-blue-600 font-black uppercase tracking-widest mb-1">Yearly Yield</p>
                  <p className="text-md font-semibold text-blue-700 tabular-nums">
                    {formatLKR(yearlyReturn)}
                  </p>
                </div>
              </div>

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