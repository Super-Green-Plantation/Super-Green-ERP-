import { useQuery } from "@tanstack/react-query";
import { getClients } from "../features/clients/actions";

export const useClients = () => {
  return useQuery({
    queryKey: ["clients"],
    queryFn: getClients,
    staleTime: 1000 * 60 * 3,
    retry: 1,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
  });
};
