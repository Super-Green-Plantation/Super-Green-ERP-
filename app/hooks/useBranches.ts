"use client";

import { useQuery } from "@tanstack/react-query";

export const fetchBranches = async () => {
  const res = await fetch("/api/src/branches");
  
  if (!res.ok) throw new Error("Failed to fetch branches");
  const data = await res.json();
  console.log("from hook",data);
  return data.res || [];
};

export const useBranches = () => {
  return useQuery({
    queryKey: ["branches"],
    queryFn: fetchBranches,
    staleTime: 1000 * 60 * 3, // 3 minutes cache
  });
};

