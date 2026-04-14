import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { proposalsApi } from "@/lib/api/endpoints";
import { extractApiErrorMessage } from "@/lib/api/errors";
import type { PaginatedResponse, ProposalDto } from "@/lib/api/types";
import { useToastStore } from "@/lib/stores/toast-store";

export function useProposals(projectId: string | number, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ["proposals", "list", projectId],
    queryFn: () => proposalsApi.listForProject(projectId) as Promise<ProposalDto[] | PaginatedResponse<ProposalDto>>,
    enabled: options?.enabled ?? !!projectId,
  });
}

export function useProjectProposals(projectId: string | number, options?: { enabled?: boolean }) {
  return useProposals(projectId, options);
}

export function useMyProposals() {
  return useQuery({
    queryKey: ["proposals", "my"],
    queryFn: proposalsApi.myProposals as () => Promise<PaginatedResponse<ProposalDto>>,
  });
}

export function useSubmitProposal(projectId: string | number) {
  const queryClient = useQueryClient();
  const pushToast = useToastStore((s) => s.push);

  return useMutation({
    mutationFn: (data: any) => proposalsApi.submit(projectId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["proposals", "list", projectId] });
      pushToast("success", "Proposal submitted successfully!");
    },
    onError: (err: any) => {
      const limitReached = err?.response?.data?.code === "proposal_limit_reached";
      pushToast(
        "error",
        limitReached ? "Proposal limit reached" : "Submission failed",
        limitReached
          ? "Сарын саналын лимит дууссан. PRO багц руу орж лимитээ 50 болгож өсгөнө үү (/pro)."
          : extractApiErrorMessage(err, "Could not submit proposal."),
      );
    },
  });
}
