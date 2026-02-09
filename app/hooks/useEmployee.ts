"use client";

import { useQuery } from "@tanstack/react-query";
import { getMembers } from "../services/member.service";

export const useEmployee = (branchId: number) => {
  return useQuery({
    queryKey: ["employees", branchId],
    queryFn: ({ queryKey }) => {
      const [, id] = queryKey;
      return getMembers(id as number);
    },
    staleTime: 1000 * 60 * 3,
    retry: 1,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
  });
};
