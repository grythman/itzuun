import { useQuery } from "@tanstack/react-query";
import { escrowApi } from "@/lib/api/endpoints";

export function useEscrowDetail(projectId: string | number) {
  return useQuery({
    queryKey: ["escrow", "detail", projectId],
    queryFn: () => escrowApi.getForProject(projectId),
    enabled: !!projectId,
  });
}
