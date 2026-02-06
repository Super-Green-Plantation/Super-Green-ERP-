import { useQuery } from "@tanstack/react-query";
import {  getClients } from "../services/clients.service";

export const useClients = () => {
  return useQuery({
    queryKey: ["clients"],
    queryFn: getClients,
    staleTime: 1000 * 60 * 3,
  });
};

