import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteClientDocument } from "../features/clients/actions";

export const useDeleteDoc = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ nic, docKey }: { nic: string; docKey: string }) =>
      deleteClientDocument(nic, docKey),

    onSuccess: (_, variables) => {
      // invalidate client data so UI refreshes
      queryClient.invalidateQueries({
        queryKey: ["client", variables.nic],
        
      });
    },
  });
};
