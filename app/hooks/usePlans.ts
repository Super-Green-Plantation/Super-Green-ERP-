"use client";

import { useQuery } from "@tanstack/react-query";
import { getFinancialPlans } from "../features/financial_plans/actions";

export const usePlans = () => {
  return useQuery({
    queryKey: ["plans"],
    queryFn: getFinancialPlans,
    staleTime: 1000 * 60 * 5,
  });
};

