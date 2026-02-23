"use client";
import React, { useEffect, useState } from "react";
import { getFinancialPlanById, getFinancialPlans } from "../financial_plans/actions";
import { FinancialPlan } from "@/app/types/FinancialPlan";
import FinancialPlanCard from "./FinancialPlanCard";

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

  return (
    <div className="max-w-7xl mx-auto min-h-screen">
      <header className="mb-10">
        <h1 className="text-3xl font-bold text-slate-900">Available Financial Plans</h1>
        <p className="text-slate-500 mt-2">Select a plan and enter an amount to see projected returns.</p>
      </header>

      {/* Grid Layout for Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
        {plans?.map((plan) => (
          <FinancialPlanCard
            key={plan.id}
            plan={plan}
            isSelected={selectedId === plan.id}
            onSelect={(id: number) => setSelectedId(id)}
          />
        ))}
      </div>

      {/* Calculator Section - Now centered and properly spaced */}
      {selectedPlan && (
        <div className="max-w-3xl mx-auto transition-all duration-300">
          <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-xl shadow-slate-200/50">
            <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
              <span className="w-2 h-6 bg-blue-600 rounded-full"></span>
              Investment Calculator: {selectedPlan.name}
            </h2>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-slate-600 mb-2 uppercase tracking-wider">
                  Investment Amount (LKR)
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium">Rs.</span>
                  <input
                    type="number"
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all outline-none text-lg font-semibold"
                    placeholder="0.00"
                    value={investmentAmount || ""}
                    onChange={(e) => setInvestmentAmount(Number(e.target.value))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
                <div className="p-5 bg-emerald-50 rounded-2xl border border-emerald-100">
                  <p className="text-xs text-emerald-600 font-bold uppercase tracking-widest mb-1">Est. Monthly Return</p>
                  <p className="text-2xl font-black text-emerald-700">
                    {formatLKR(monthlyReturn)}
                  </p>
                </div>
                
                <div className="p-5 bg-blue-50 rounded-2xl border border-blue-100">
                  <p className="text-xs text-blue-600 font-bold uppercase tracking-widest mb-1">Est. Yearly Return</p>
                  <p className="text-2xl font-black text-blue-700">
                    {formatLKR(yearlyReturn)}
                  </p>
                </div>
              </div>

              <p className="text-sm text-slate-400 text-center bg-slate-50 py-2 rounded-lg">
                Calculated based on an annual rate of <span className="font-bold text-slate-600">{selectedPlan.rate}%</span>
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Page;