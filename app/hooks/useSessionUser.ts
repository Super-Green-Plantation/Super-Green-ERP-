import { useQuery } from "@tanstack/react-query";
import { getSessionUserAction } from "@/app/actions/user";

export const useSessionUser = () => {
  return useQuery({
    queryKey: ["session-user"],
    queryFn: () => getSessionUserAction(),
  });
};