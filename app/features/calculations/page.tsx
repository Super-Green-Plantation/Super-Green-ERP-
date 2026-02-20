"use client";
import React, { useEffect, useState } from "react";
import {
  getFinancialPlanById,
  getFinancialPlans,
} from "../financial_plans/actions";
import { FinancialPlan } from "@/app/types/FinancialPlan";
import FinancialPlanCard from "./FinancialPlanCard";

const Page = () => {
  const [plans, setPlans] = useState<FinancialPlan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<FinancialPlan | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);

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

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800">
          Available Financial Plans
        </h1>
        <p className="text-gray-500">
          Select a plan to view more details or invest.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {plans?.map((plan) => (
          <FinancialPlanCard
            key={plan.id}
            plan={plan}
            isSelected={selectedId === plan.id}
            onSelect={(id: any) => setSelectedId(id)}
          />
        ))}
      </div>

      {selectedId && (
        <div className="mt-8 p-4 bg-gray-100 rounded-lg text-center animate-pulse">
          Plan {selectedId} selected. Ready to proceed?
        </div>
      )}

      <div>
        
      </div>
    </div>
  );
};

export default Page;
