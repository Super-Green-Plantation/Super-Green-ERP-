import { FinancialPlan } from "../types/FinancialPlan";

export const getPlans = async (): Promise<FinancialPlan[]> => {
  const res = await fetch("/api/src/plans");

  if (!res.ok) {
    throw new Error("Failed to fetch plans");
  }

  const data = await res.json();
  return data.plans; // ✅ return array only
};
