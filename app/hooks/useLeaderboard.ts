import { useQuery } from "@tanstack/react-query";
import { getAchievementLeaderboard } from "../features/dashboard/analytics";

export const useLeaderboard = (year: number, month: number, limit: number = 10) => {
  return useQuery({
    queryKey: ["achievement-leaderboard", year, month, limit],
    queryFn: async () => {
      return await getAchievementLeaderboard(year, month, limit);
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10,
    retry: 2,
  });
};
