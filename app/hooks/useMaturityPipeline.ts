import { useQuery } from "@tanstack/react-query";
import { getMaturityPipeline } from "../features/dashboard/analytics";

export const useMaturityPipeline = (branchId?: number) => {
  return useQuery({
    queryKey: ["maturity-pipeline", branchId],
    queryFn: async () => {
      return await getMaturityPipeline(branchId);
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10,
    retry: 2,
  });
};
