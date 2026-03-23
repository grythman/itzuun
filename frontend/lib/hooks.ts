import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { authApi, projectsApi, proposalsApi, escrowApi, adminApi, verificationApi } from "./api/endpoints";
import { useToastStore } from "./toast-store";

// --- AUTH HOOKS ---

export function useMe(options?: { enabled?: boolean; retryOnAuth?: boolean }) {
  const retry = options?.retryOnAuth ? 1 : false;
  return useQuery({
    queryKey: ["auth", "me"],
    queryFn: () => authApi.me(),
    enabled: options?.enabled !== false,
    retry,
  });
}

// --- PROJECT HOOKS ---

export function useProjects(page = 1, filters?: Record<string, any>) {
  return useQuery({
    queryKey: ["projects", "list", page, filters],
    queryFn: () => projectsApi.list({ page, ...filters }),
    staleTime: 1000 * 60 * 5, // 5 minutes cache
  });
}

export function useProjectDetail(id: string | number) {
  return useQuery({
    queryKey: ["projects", "detail", id],
    queryFn: () => projectsApi.get(id),
    enabled: !!id,
  });
}

export function useMyProjects(role: "client" | "freelancer") {
  return useQuery({
    queryKey: ["projects", "myList", role],
    queryFn: () => projectsApi.myProjects(role),
  });
}

// --- PROPOSAL HOOKS ---

export function useProposals(projectId: string | number) {
  return useQuery({
    queryKey: ["proposals", "list", projectId],
    queryFn: () => proposalsApi.listForProject(projectId),
    enabled: !!projectId,
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
      pushToast(
        "error", 
        "Submission failed", 
        err.response?.data?.detail || "Could not submit proposal." 
      );
    }
  });
}

// --- ESCROW HOOKS ---

export function useEscrowDetail(projectId: string | number) {
  return useQuery({
    queryKey: ["escrow", "detail", projectId],
    queryFn: () => escrowApi.getForProject(projectId),
    enabled: !!projectId,
  });
}

// --- ADMIN HOOKS ---

export function useAdminSnapshots() {
  return useQuery({
    queryKey: ["admin", "snapshots"],
    queryFn: adminApi.snapshots,
  });
}

export function useAdminLedger() {
  return useQuery({
    queryKey: ["admin", "ledger"],
    queryFn: adminApi.ledger,
  });
}

// --- VERIFICATION HOOKS ---

export function useSubmitVerification() {
  const queryClient = useQueryClient();
  const pushToast = useToastStore(s => s.push);

  return useMutation({
    mutationFn: verificationApi.submit,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["auth", "me"]});
      pushToast("success", "Verification submitted", "Your profile is under review.");
    },
    onError: () => {
      pushToast("error", "Verification failed", "Failed to submit verification request.");
    }
  });
}
