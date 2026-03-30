import axios from "axios";

// Core Axios instance
const apiClient = axios.create({
  baseURL: "/api/v1",
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

export const API_BASE = "/api/v1";

export function toArray(obj: any): any[] {
  if (!obj) return [];
  if (Array.isArray(obj)) return obj;
  return [obj];
}

// --- API Service Models ---

export const authApi = {
  login: async (credentials: any) => {
    const res = await apiClient.post("/accounts/auth/login/", credentials);
    return res.data;
  },
  register: async (data: any) => {
    const res = await apiClient.post("/accounts/auth/register/", data);
    return res.data;
  },
  google: async (payload: { credential: string; role?: "client" | "freelancer" }) => {
    const res = await apiClient.post("/accounts/auth/google/", payload);
    return res.data;
  },
  logout: async () => {
    const res = await apiClient.post("/accounts/auth/logout/");
    return res.data;
  },
  requestOtp: async (email: string) => {
    const res = await apiClient.post("/accounts/auth/request-otp/", { email });
    return res.data;
  },
  verifyOtp: async (email: string, otp: string, otp_token?: string) => {
    const res = await apiClient.post("/accounts/auth/verify-otp/", { email, otp, otp_token });
    return res.data;
  },
  resendOtp: async (data: any) => {
    const res = await apiClient.post("/accounts/auth/resend-otp/", data);
    return res.data;
  },
  me: async (skipCache: boolean = false) => {
    const params = skipCache ? { refresh: Date.now() } : {};
    const res = await apiClient.get("/accounts/users/me/", { params });
    return res.data;
  },
  submitVerification: async (data: any) => {
    const res = await apiClient.post("/accounts/users/me/verification/", data);
    return res.data;
  }
};

export const projectsApi = {
  list: async (params?: Record<string, any>) => {
    const res = await apiClient.get("/projects/", { params });
    return res.data;
  },
  get: async (id: string | number) => {
    const res = await apiClient.get(`/projects/${id}/`);
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
  myProjects: async (role: "client" | "freelancer") => {
    const params = role === "client" ? { client: "me" } : { freelancer: "me" };
    const res = await apiClient.get("/projects/", { params });
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
    const res = await apiClient.post("/projects/ai/suggest-description/", payload);
    return res.data;
  },
  submitProposal: async (projectId: string | number, data: any) => {
    const res = await apiClient.post(`/projects/${projectId}/proposals/`, data);
    return res.data;
  },
  selectFreelancer: async (projectId: string | number, proposalId: string | number) => {
    const res = await apiClient.post(`/projects/${projectId}/proposals/${proposalId}/select/`);
    return res.data;
  },
  confirmCompletion: async (projectId: string | number) => {
    const res = await apiClient.post(`/projects/${projectId}/confirm-completion/`);
    return res.data;
  },
  createDispute: async (projectId: string | number, payload: any) => {
    const res = await apiClient.post(`/projects/${projectId}/disputes/`, payload);
    return res.data;
  },
  sendMessage: async (projectId: string | number, text: string, type: "text" | "file" = "text") => {
    const res = await apiClient.post(`/projects/${projectId}/messages/`, { text, type });
    return res.data;
  },
  uploadMessageFile: async (projectId: string | number, file: File) => {
    const form = new FormData();
    form.append("file", file);
    const res = await apiClient.post(`/projects/${projectId}/messages/upload/`, form, {
      headers: { "Content-Type": "multipart/form-data" },
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
  createPayment: async (projectId: string | number) => {
    const res = await apiClient.post(`/payments/project/${projectId}/create/`);
    return res.data;
  },
  paymentStatus: async (projectId: string | number) => {
    const res = await apiClient.get(`/payments/project/${projectId}/status/`);
    return res.data;
  },
  ratingSummary: async (userId: string | number) => {
    const res = await apiClient.get(`/users/${userId}/rating-summary`);
    return res.data;
  },
  userReviews: async (userId: string | number) => {
    const res = await apiClient.get(`/users/${userId}/reviews`);
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
  listForProject: async (projectId: string | number) => {
    const res = await apiClient.get(`/projects/${projectId}/proposals/`);
    return res.data;
  },
  submit: async (projectId: string | number, data: any) => {
    const res = await apiClient.post(`/projects/${projectId}/proposals/`, data);
    return res.data;
  },
  select: async (projectId: string | number, proposalId: string | number) => {
    const res = await apiClient.post(`/projects/${projectId}/proposals/${proposalId}/select/`);
    return res.data;
  },
  myProposals: async () => {
    const res = await apiClient.get("/proposals/me/");
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

export const adminApi = {
  snapshots: async () => {
    const res = await apiClient.get("/admin/metrics/snapshot/");
    return res.data;
  },
  users: async () => {
    const res = await apiClient.get("/admin/users/");
    return res.data;
  },
  projects: async () => {
    const res = await apiClient.get("/admin/projects/");
    return res.data;
  },
  escrow: async () => {
    const res = await apiClient.get("/admin/escrow/");
    return res.data;
  },
  commission: async () => {
    const res = await apiClient.get("/admin/commission/");
    return res.data;
  },
  ledger: async () => {
    const res = await apiClient.get("/admin/ledger/");
    return res.data;
  },
  payments: async (status?: string) => {
    const res = await apiClient.get("/admin/payments/", { params: status ? { status } : undefined });
    return res.data;
  },
  disputes: async () => {
    const res = await apiClient.get("/admin/disputes/");
    return res.data;
  },
  resolveDispute: async (id: string | number, payload: any) => {
    const res = await apiClient.post(`/admin/disputes/${id}/resolve/`, payload);
    return res.data;
  },
  verifyUser: async (userId: string | number, payload: any) => {
    const res = await apiClient.post(`/admin/users/${userId}/verify/`, payload);
    return res.data;
  },
  unsuspendUser: async (userId: string | number, payload?: { reason?: string }) => {
    const res = await apiClient.post(`/admin/users/${userId}/unsuspend/`, payload || {});
    return res.data;
  },
  setCommission: async (platform_fee_pct: number) => {
    const res = await apiClient.post("/admin/commission/", { platform_fee_pct });
    return res.data;
  },
  approveEscrow: async (escrowId: string | number) => {
    const res = await apiClient.post(`/admin/escrow/${escrowId}/approve/`);
    return res.data;
  }
}

export const categoriesApi = {
  list: async () => {
    const res = await apiClient.get("/projects/categories/");
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
