import { useQuery } from "@tanstack/react-query";
import { getManagerDashboardStats } from "../features/dashboard/analytics";

export const useManagerDashboard = () =>
  useQuery({
    queryKey: ["manager-dashboard-stats"],
    queryFn: getManagerDashboardStats,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 5,
    retry: 2,
  });
