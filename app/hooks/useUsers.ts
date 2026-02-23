import { useQuery } from "@tanstack/react-query"
import { getUsers } from "../features/users/action"

export const useUsers = () => {
return useQuery({
    queryKey: ["users"],
    queryFn: getUsers,
    staleTime: 1000 * 60 * 3, // 3 minutes cache
    retry: 1,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
})
}