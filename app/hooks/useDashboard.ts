import { useQuery } from "@tanstack/react-query";
import { getDashboardStats } from "../features/dashboard/analytics";

export const useDashboard = () => {
  return useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      return await getDashboardStats();
    },
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 5,
    retry: (failureCount, error: any) => {
      if (error?.message?.includes("Unauthorized")) return false;
      return failureCount < 2;
    },
  });
};
