import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { authApi, projectsApi, proposalsApi, escrowApi, adminApi, verificationApi, categoriesApi, profilesApi } from "./api/endpoints";
import { useToastStore } from "./toast-store";

export { useQuery, useMutation, useQueryClient };

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

export function useCategories() {
  return useQuery({
    queryKey: ["categories"],
    queryFn: categoriesApi.list,
    staleTime: 1000 * 60 * 30,
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

export function useProposals(projectId: string | number, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ["proposals", "list", projectId],
    queryFn: () => proposalsApi.listForProject(projectId),
    enabled: options?.enabled ?? !!projectId,
  });
}

export function useProjectProposals(projectId: string | number, options?: { enabled?: boolean }) {
  return useProposals(projectId, options);
}

export function useMyProposals() {
  return useQuery({
    queryKey: ["proposals", "my"],
    queryFn: proposalsApi.myProposals,
  });
}

export function useProjectMessages(projectId: string | number) {
  return useQuery({
    queryKey: ["projects", "messages", projectId],
    queryFn: () => projectsApi.get(projectId).then((data) => data?.messages ?? []),
    enabled: !!projectId,
    refetchOnWindowFocus: false,
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

export function useAdminSnapshot() {
  const users = useQuery({
    queryKey: ["admin", "users"],
    queryFn: adminApi.users,
  });
  const projects = useQuery({
    queryKey: ["admin", "projects"],
    queryFn: adminApi.projects,
  });
  const escrow = useQuery({
    queryKey: ["admin", "escrow"],
    queryFn: () => adminApi.escrow(),
  });
  const disputes = useQuery({
    queryKey: ["admin", "disputes"],
    queryFn: () => adminApi.disputes(),
  });
  const commission = useQuery({
    queryKey: ["admin", "commission"],
    queryFn: adminApi.commission,
  });
  const ledger = useQuery({
    queryKey: ["admin", "ledger"],
    queryFn: adminApi.ledger,
  });

  return { users, projects, escrow, disputes, commission, ledger };
}

export function useMyProfile() {
  return useQuery({
    queryKey: ["profile-me"],
    queryFn: profilesApi.me,
  });
}

export function useProfile(userId: string | number) {
  return useQuery({
    queryKey: ["profile", userId],
    queryFn: () => profilesApi.get(userId),
    enabled: !!userId,
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
