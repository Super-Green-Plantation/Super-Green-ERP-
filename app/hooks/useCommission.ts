import { useQuery } from "@tanstack/react-query";
import { getCommissionDetails } from "../features/commissions/actions";

export const useCommission = () => {
  return useQuery({
    queryKey: ["commissions"],
    queryFn: getCommissionDetails,
    staleTime: 1000 * 60 * 3,
    retry: 1,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
  });
};