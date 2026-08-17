import { useQuery } from "@tanstack/react-query";
import { getBranchKPIs } from "../features/dashboard/analytics";

export const useBranchKpis = (year: number, month: number) => {
  return useQuery({
    queryKey: ["branch-kpis", year, month],
    queryFn: async () => {
      return await getBranchKPIs(year, month);
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10,
    retry: 2,
  });
};
