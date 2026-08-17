import { useQuery } from "@tanstack/react-query";
import { getIncentiveForecast } from "../features/dashboard/analytics";

export const useIncentiveForecast = (year: number, month: number, branchId?: number) => {
  return useQuery({
    queryKey: ["incentive-forecast", year, month, branchId],
    queryFn: async () => {
      return await getIncentiveForecast(year, month, branchId);
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10,
    retry: 2,
  });
};
