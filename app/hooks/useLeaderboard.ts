import { useQuery } from "@tanstack/react-query";
import { getCommissionLeaderboard } from "../features/dashboard/analytics";

export const useLeaderboard = (year: number, month: number, limit: number = 10) => {
  return useQuery({
    queryKey: ["commission-leaderboard", year, month, limit],
    queryFn: async () => {
      return await getCommissionLeaderboard(year, month, limit);
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10,
    retry: 2,
  });
};
