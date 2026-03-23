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
  logout: async () => {
    const res = await apiClient.post("/accounts/auth/logout/");
    return res.data;
  },
  verifyOtp: async (data: any) => {
    const res = await apiClient.post("/accounts/auth/verify-otp/", data);
    return res.data;
  },
  resendOtp: async (data: any) => {
    const res = await apiClient.post("/accounts/auth/resend-otp/", data);
    return res.data;
  },
  me: async () => {
    const res = await apiClient.get("/accounts/users/me/");
    return res.data;
  },
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
  ledger: async () => {
    const res = await apiClient.get("/admin/ledger/");
    return res.data;
  },
  disputes: async () => {
    const res = await apiClient.get("/admin/disputes/");
    return res.data;
  },
  resolveDispute: async (id: string | number, payload: any) => {
    const res = await apiClient.post(`/admin/disputes/${id}/resolve/`, payload);
    return res.data;
  }
}

export const verificationApi = {
  submit: async (data: any) => {
    const res = await apiClient.post("/accounts/verification/", data);
    return res.data;
  }
}
