import { useQuery } from "@tanstack/react-query";
import { categoriesApi, projectsApi } from "@/lib/api/endpoints";
import type { PaginatedResponse, ProjectDto } from "@/lib/api/types";
import type { MessageItem } from "@/lib/types";

export function useProjects(page = 1, filters?: Record<string, any>) {
  return useQuery({
    queryKey: ["projects", "list", page, filters],
    queryFn: () => projectsApi.list({ page, ...filters }) as Promise<PaginatedResponse<ProjectDto>>,
    staleTime: 1000 * 60 * 5,
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
    queryFn: () => projectsApi.get(id) as Promise<ProjectDto>,
    enabled: !!id,
  });
}

export function useMyProjects(role: "client" | "freelancer") {
  return useQuery({
    queryKey: ["projects", "myList", role],
    queryFn: () => projectsApi.myProjects(role) as Promise<PaginatedResponse<ProjectDto>>,
  });
}

export function useProjectMessages(projectId: string | number) {
  return useQuery({
    queryKey: ["projects", "messages", projectId],
    queryFn: () => projectsApi.get(projectId).then((data) => (data?.messages ?? []) as MessageItem[]),
    enabled: !!projectId,
    refetchOnWindowFocus: false,
  });
}
