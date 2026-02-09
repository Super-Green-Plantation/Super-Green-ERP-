import { useQuery } from "@tanstack/react-query";
import { getStats } from "../services/dashboard.service";

export const useDashboard = () => {
  return useQuery({
    queryKey: ["dashboard"],
    queryFn: getStats,
    staleTime: 1000 * 60 * 3,
    retry: 1,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
  });
};
