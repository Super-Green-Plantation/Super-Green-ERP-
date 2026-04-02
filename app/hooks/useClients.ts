import { useQuery } from "@tanstack/react-query";
import { getAccessibleClients } from "../features/clients/actions";

export const useClients = (page = 1, pageSize = 10) => {
  return useQuery({
    queryKey: ["clients", page, pageSize], // ← page in key triggers refetch
    queryFn: () => getAccessibleClients(page, pageSize),
    staleTime: 1000 * 60,
    gcTime: 1000 * 60 * 5,
    retry: 3,
  });
};