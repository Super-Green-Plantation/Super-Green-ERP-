import { useQuery } from "@tanstack/react-query";
import { getInvestmentDetails } from "../features/investments/actions";

export const useInvestments = () => {
  return useQuery({
    queryKey: ["investments"],
    //create new function for queryFn and map data matching frontend
    queryFn: async () => {
      const data = await getInvestmentDetails();
      return data.map((inv: any) => ({
        id: inv.id,
        amount: inv.amount,
        investmentDate: inv.investmentDate,
        clientName: inv.client?.fullName || "-",
        planName: inv.plan?.name || "-",
        advisorName: inv.advisor?.name || "-",
        branchName: inv.advisor?.branch?.name || "-",
      }));
    },

    staleTime: 1000 * 60 * 3,
    retry: 1,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
  });
};
