import { useQuery } from "@tanstack/react-query";
import { getAccessibleClients } from "../features/clients/actions";

export const useClients = () => {
  return useQuery({
    queryKey: ["clients"],
    queryFn: getAccessibleClients,
    enabled: true,
    staleTime: 1000 * 60,
  });
};