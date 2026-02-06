import { useQuery } from "@tanstack/react-query";
import { getClientDetails } from "../services/clients.service";

export const useClient = (clientId: number) => {
  return useQuery({
    queryKey: ["client", clientId],
    queryFn: () => async()=>{
      const data = getClientDetails(clientId)
    },
    staleTime: 1000 * 60, // 1 min cache
    gcTime: 1000 * 60 * 5, //  garbage collection after 5 mins
  });
};
