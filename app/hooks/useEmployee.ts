"use client";

import { useInfiniteQuery, InfiniteData } from "@tanstack/react-query";
import { getEmployeesByBranch } from "../features/employees/actions";
import { EmployeesPage } from "@/app/types/member";

export const useEmployees = (branchId: number) => {
  return useInfiniteQuery<
  EmployeesPage,
  Error,
  InfiniteData<EmployeesPage>,
  (string | number)[],
  number | undefined
>({
    queryKey: ["employees", branchId],
    queryFn: ({ pageParam }) =>
      getEmployeesByBranch(branchId, pageParam),
    initialPageParam: undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    staleTime: 1000 * 60 * 3,
    retry: 1,
    refetchOnWindowFocus: false,
  });
};
