// hooks/useInvestments.ts
import { useQuery } from "@tanstack/react-query";
import { getInvestments } from "../features/investments/actions";

export const useInvestments = (page = 1, pageSize = 10) => {
  return useQuery({
    queryKey: ["investments", page, pageSize],
    queryFn: () => getInvestments(page, pageSize),
    staleTime: 1000 * 60,
     gcTime: 1000 * 60 * 5,
    retry: 3,
  });
};