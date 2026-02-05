import { FinancialPlan } from "../types/FinancialPlan";

export const getPlans = async (): Promise<FinancialPlan[]> => {
  const res = await fetch("/api/src/plans");

  if (!res.ok) {
    throw new Error("Failed to fetch plans");
  }

  const data = await res.json();
  return data.plans; 
};


export const getPlansByClient = async (id:number) => {
  const res = await fetch(`/api/src/investments/${id}`);

  if (!res.ok) {
    throw new Error("Failed to fetch plans");
  }

  const data = await res.json();
  return data; 
};

export const getPlanDetails = async(id:number)=>{
  const res = await fetch(`/api/src/plans/${id}`);

  if (!res.ok) {
    throw new Error("Failed to fetch plans");
  }
  return res.json();

}