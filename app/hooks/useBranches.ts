"use client";

import { useQuery } from "@tanstack/react-query";
import { getBranches } from "../features/branches/actions";

export const useBranches = () => {
  return useQuery({
    queryKey: ["branches"],
    queryFn: async () => {
      const branches = await getBranches();
      return branches || [];
    },
    staleTime: 1000 * 60 * 3, // 3 minutes cache
    retry: 1,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
  });
};
