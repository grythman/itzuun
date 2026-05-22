import axios from "axios";
import type {
  AdminPaymentDto,
  AdminUserDto,
  AuthUser,
  CategoryDto,
  DisputeDto,
  EscrowDto,
  LedgerEntryDto,
  PaginatedResponse,
  PaymentCreateResponse,
  PaymentStatusResponse,
  PremiumMeResponse,
  PremiumSubscribeResponse,
  ProjectDto,
  ProposalDto,
  RatingSummaryDto,
  ReviewDto,
} from "./types";

// Core Axios instance
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "/api/v1";

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Crucial for sending/receiving HTTPOnly cookies
  headers: {
    "Content-Type": "application/json",
  },
});

// Interceptor for generalized error handling (Optional but recommended)
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // If a 401 is encountered globally, can redirect or handle token refresh here
    return Promise.reject(error);
  }
);

export default apiClient;

export const API_BASE = API_BASE_URL;

export function toArray<T>(obj: T[] | PaginatedResponse<T> | null | undefined): T[] {
  if (!obj) return [];
  if (Array.isArray(obj)) return obj;
  if (Array.isArray(obj.results)) return obj.results;
  return [];
}

// --- API Service Models ---

export const authApi = {
  login: async (credentials: any) => {
    const res = await apiClient.post("/auth/login/", credentials);
    return res.data;
  },
  register: async (data: any) => {
    const res = await apiClient.post("/auth/register/", data);
    return res.data;
  },
  google: async (payload: { credential: string; role?: "client" | "freelancer" }) => {
    const res = await apiClient.post("/auth/google/", payload);
    return res.data;
  },
  logout: async () => {
    const res = await apiClient.post("/auth/logout/");
    return res.data;
  },
  requestOtp: async (email: string) => {
    const res = await apiClient.post("/auth/request-otp/", { email });
    return res.data;
  },
  verifyOtp: async (email: string, otp: string, otp_token?: string) => {
    const res = await apiClient.post("/auth/verify-otp/", { email, otp, otp_token });
    return res.data;
  },
  resendOtp: async (data: any) => {
    const res = await apiClient.post("/auth/resend-otp/", data);
    return res.data;
  },
  me: async (skipCache: boolean = false): Promise<AuthUser> => {
    const params = skipCache ? { refresh: Date.now() } : {};
    const res = await apiClient.get<AuthUser>("/auth/me/", { params });
    return res.data;
  },
  submitVerification: async (data: any) => {
    const res = await apiClient.post("/users/me/verification/", data);
    return res.data;
  }
};

export const projectsApi = {
  list: async (params?: Record<string, any>): Promise<PaginatedResponse<ProjectDto>> => {
    const res = await apiClient.get<PaginatedResponse<ProjectDto>>("/projects/", { params });
    return res.data;
  },
  get: async (id: string | number): Promise<ProjectDto> => {
    const res = await apiClient.get<ProjectDto>(`/projects/${id}/`);
    return res.data;
  },
  create: async (data: any) => {
    const res = await apiClient.post("/projects/", data);
    return res.data;
  },
  update: async (id: string | number, data: any) => {
    const res = await apiClient.patch(`/projects/${id}/`, data);
    return res.data;
  },
  myProjects: async (role: "client" | "freelancer"): Promise<PaginatedResponse<ProjectDto>> => {
    const params = role === "client" ? { client: "me" } : { freelancer: "me" };
    const res = await apiClient.get<PaginatedResponse<ProjectDto>>("/projects/", { params });
    return res.data;
  },
  updateStatus: async (id: string | number, status: string) => {
    const res = await apiClient.patch(`/projects/${id}/`, { status });
    return res.data;
  },
  submitDeliverable: async (projectId: string | number, data: any) => {
    const res = await apiClient.post(`/projects/${projectId}/deliverables/`, data);
    return res.data;
  },
  suggestDescription: async (payload: any) => {
    const res = await apiClient.post("/projects/ai-description-suggest/", payload);
    return res.data;
  },
  submitProposal: async (projectId: string | number, data: any) => {
    const res = await apiClient.post(`/projects/${projectId}/proposals/`, data);
    return res.data;
  },
  selectFreelancer: async (projectId: string | number, proposalId: string | number) => {
    const res = await apiClient.post(`/projects/${projectId}/select-freelancer/`, { proposal_id: proposalId });
    return res.data;
  },
  confirmCompletion: async (projectId: string | number) => {
    const res = await apiClient.post(`/projects/${projectId}/confirm-completion/`);
    return res.data;
  },
  createDispute: async (projectId: string | number, payload: any) => {
    const res = await apiClient.post(`/projects/${projectId}/dispute/`, payload);
    return res.data;
  },
  sendMessage: async (projectId: string | number, text: string, type: "text" | "file" = "text") => {
    const res = await apiClient.post(`/projects/${projectId}/messages/`, { text, type });
    return res.data;
  },
  uploadMessageFile: async (projectId: string | number, file: File, onUploadProgress?: (percent: number) => void) => {
    const form = new FormData();
    form.append("file", file);
    const res = await apiClient.post(`/projects/${projectId}/files`, form, {
      headers: { "Content-Type": "multipart/form-data" },
      onUploadProgress: (event) => {
        if (!onUploadProgress || !event.total) return;
        onUploadProgress(Math.round((event.loaded * 100) / event.total));
      },
    });
    return res.data;
  },
  uploadDeliverable: async (projectId: string | number, data: any) => {
    const res = await apiClient.post(`/projects/${projectId}/deliverables/`, data);
    return res.data;
  },
  submitResult: async (projectId: string | number, payload: any) => {
    const res = await apiClient.post(`/projects/${projectId}/submit-result/`, payload);
    return res.data;
  },
  review: async (projectId: string | number, payload: any) => {
    const res = await apiClient.post(`/projects/${projectId}/reviews/`, payload);
    return res.data;
  },
  createPayment: async (projectId: string | number): Promise<PaymentCreateResponse> => {
    const res = await apiClient.post<PaymentCreateResponse>(`/payments/project/${projectId}/create/`);
    return res.data;
  },
  paymentStatus: async (projectId: string | number): Promise<PaymentStatusResponse> => {
    const res = await apiClient.get<PaymentStatusResponse>(`/payments/project/${projectId}/status/`);
    return res.data;
  },
  ratingSummary: async (userId: string | number): Promise<RatingSummaryDto> => {
    const res = await apiClient.get<RatingSummaryDto>(`/users/${userId}/rating-summary`);
    return res.data;
  },
  userReviews: async (userId: string | number): Promise<PaginatedResponse<ReviewDto>> => {
    const res = await apiClient.get<PaginatedResponse<ReviewDto>>(`/users/${userId}/reviews`);
    return res.data;
  },
  updateProposal: async (proposalId: string | number, payload: any) => {
    const res = await apiClient.patch(`/proposals/${proposalId}/`, payload);
    return res.data;
  },
  withdrawProposal: async (proposalId: string | number) => {
    const res = await apiClient.post(`/proposals/${proposalId}/withdraw/`);
    return res.data;
  }
};

export const proposalsApi = {
  listForProject: async (projectId: string | number): Promise<ProposalDto[] | PaginatedResponse<ProposalDto>> => {
    const res = await apiClient.get<ProposalDto[] | PaginatedResponse<ProposalDto>>(`/projects/${projectId}/proposals/`);
    return res.data;
  },
  submit: async (projectId: string | number, data: any) => {
    const res = await apiClient.post(`/projects/${projectId}/proposals/`, data);
    return res.data;
  },
  select: async (projectId: string | number, proposalId: string | number) => {
    const res = await apiClient.post(`/projects/${projectId}/select-freelancer/`, { proposal_id: proposalId });
    return res.data;
  },
  myProposals: async (): Promise<PaginatedResponse<ProposalDto>> => {
    const res = await apiClient.get<PaginatedResponse<ProposalDto>>("/me/proposals/");
    return res.data;
  },
};

export const escrowApi = {
  getForProject: async (projectId: string | number) => {
    const res = await apiClient.get(`/payments/escrow/project/${projectId}/`);
    return res.data;
  },
  fund: async (id: string | number) => {
    const res = await apiClient.post(`/payments/escrow/${id}/fund/`);
    return res.data;
  },
  release: async (id: string | number) => {
    const res = await apiClient.post(`/payments/escrow/${id}/release/`);
    return res.data;
  },
};

export const premiumApi = {
  me: async (): Promise<PremiumMeResponse> => {
    const res = await apiClient.get<PremiumMeResponse>("/premium/me/");
    return res.data;
  },
  subscribe: async (plan_type: string = "pro_monthly"): Promise<PremiumSubscribeResponse> => {
    const res = await apiClient.post<PremiumSubscribeResponse>("/premium/subscribe/", { plan_type });
    return res.data;
  },
  cancel: async (): Promise<{ canceled: boolean; tier: "free" }> => {
    const res = await apiClient.post<{ canceled: boolean; tier: "free" }>("/premium/cancel/", {});
    return res.data;
  },
};

export const adminApi = {
  snapshots: async () => {
    const res = await apiClient.get("/admin/metrics/snapshot");
    return res.data;
  },
  users: async (): Promise<AdminUserDto[] | PaginatedResponse<AdminUserDto>> => {
    const res = await apiClient.get<AdminUserDto[] | PaginatedResponse<AdminUserDto>>("/admin/users");
    return res.data;
  },
  projects: async () => {
    const res = await apiClient.get("/admin/projects");
    return res.data;
  },
  escrow: async (status?: string): Promise<EscrowDto[] | PaginatedResponse<EscrowDto>> => {
    const res = await apiClient.get<EscrowDto[] | PaginatedResponse<EscrowDto>>("/admin/escrow", { params: status ? { status } : undefined });
    return res.data;
  },
  commission: async () => {
    const res = await apiClient.get("/admin/settings/commission/detail");
    return res.data;
  },
  ledger: async (): Promise<LedgerEntryDto[] | PaginatedResponse<LedgerEntryDto>> => {
    const res = await apiClient.get<LedgerEntryDto[] | PaginatedResponse<LedgerEntryDto>>("/admin/ledger");
    return res.data;
  },
  payments: async (status?: string): Promise<AdminPaymentDto[] | PaginatedResponse<AdminPaymentDto>> => {
    const res = await apiClient.get<AdminPaymentDto[] | PaginatedResponse<AdminPaymentDto>>("/admin/payments", { params: status ? { status } : undefined });
    return res.data;
  },
  disputes: async (unresolved?: boolean): Promise<DisputeDto[] | PaginatedResponse<DisputeDto>> => {
    const params = unresolved === undefined ? undefined : { unresolved };
    const res = await apiClient.get<DisputeDto[] | PaginatedResponse<DisputeDto>>("/admin/disputes", { params });
    return res.data;
  },
  auditLogs: async (params?: { entity_type?: string; action_type?: string; entity_id?: string | number }) => {
    const res = await apiClient.get("/admin/audit-logs", { params });
    return res.data;
  },
  resolveDispute: async (id: string | number, payload: any) => {
    const res = await apiClient.post(`/admin/disputes/${id}/resolve`, payload);
    return res.data;
  },
  verifyUser: async (userId: string | number, payload: any) => {
    const res = await apiClient.post(`/admin/users/${userId}/verify`, payload);
    return res.data;
  },
  unsuspendUser: async (userId: string | number, payload?: { reason?: string }) => {
    const res = await apiClient.post(`/admin/users/${userId}/unsuspend`, payload || {});
    return res.data;
  },
  setCommission: async (platform_fee_pct: number) => {
    const res = await apiClient.patch("/admin/settings/commission", { platform_fee_pct });
    return res.data;
  },
  approveEscrow: async (escrowId: string | number) => {
    const res = await apiClient.post(`/escrow/${escrowId}/admin/approve/`);
    return res.data;
  }
}

export const categoriesApi = {
  list: async (): Promise<CategoryDto[]> => {
    const res = await apiClient.get<CategoryDto[] | PaginatedResponse<CategoryDto>>("/projects/categories/");
    const payload = res.data;
    if (Array.isArray(payload)) {
      return payload;
    }
    if (payload && Array.isArray(payload.results)) {
      return payload.results;
    }
    return [];
  },
};

export const profilesApi = {
  me: async () => {
    const res = await apiClient.get("/profiles/me/");
    return res.data;
  },
  list: async (page = 1, params?: Record<string, any>) => {
    const res = await apiClient.get("/profiles/", { params: { page, ...params } });
    return res.data;
  },
  get: async (id: string | number) => {
    const res = await apiClient.get(`/profiles/${id}/`);
    return res.data;
  },
  updateMe: async (data: any) => {
    const res = await apiClient.patch("/profiles/me/", data);
    return res.data;
  },
};

export const verificationApi = {
  submit: async (data: any) => {
    const res = await apiClient.post("/accounts/users/me/verification/", data);
    return res.data;
  }
}

export const messagingApi = {
  globalInbox: async () => {
    const res = await apiClient.get("/messages/inbox/");
    return res.data;
  },
  getProjectMessages: async (projectId: string | number) => {
    const res = await apiClient.get(`/projects/${projectId}/messages`);
    return res.data;
  }
}

export const notificationsApi = {
  list: async () => {
    const res = await apiClient.get("/notifications/");
    return res.data;
  },
  markAllRead: async () => {
    const res = await apiClient.post("/notifications/mark-all-read/");
    return res.data;
  },
  markRead: async (id: string | number) => {
    const res = await apiClient.post(`/notifications/${id}/read/`);
    return res.data;
  }
}
