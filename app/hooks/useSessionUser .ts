import { getCurrentUser } from "@/lib/auth";
import { useQuery } from "@tanstack/react-query";

export const useSessionUser = () => {
  return useQuery({
    queryKey: ["session-user"],
    queryFn: getCurrentUser,
  });
};