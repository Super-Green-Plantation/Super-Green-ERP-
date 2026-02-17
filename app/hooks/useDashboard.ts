import { useQuery } from "@tanstack/react-query";
import { getDashboardStats } from "../features/dashboard/actions";

export const useDashboard = () => {
  return useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      return await getDashboardStats();
    },
    staleTime: 1000 * 60 * 5,
  });
};
