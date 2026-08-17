import { useQuery } from "@tanstack/react-query";
import { getPayrollCostBreakdown } from "../features/dashboard/analytics";

export const usePayrollBreakdown = (year: number, month: number) => {
  return useQuery({
    queryKey: ["payroll-breakdown", year, month],
    queryFn: async () => {
      return await getPayrollCostBreakdown(year, month);
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10,
    retry: 2,
  });
};
