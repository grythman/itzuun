import { API_BASE } from "./endpoints";

export class ApiError extends Error {
  status: number;
  data: unknown;

  constructor(message: string, status: number, data: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

async function parseBody(res: Response): Promise<unknown> {
  const contentType = res.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return res.json();
  }
  const text = await res.text();
  return text || null;
}

async function call<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    credentials: "include",
    ...init,
  });

  const data = await parseBody(res);
  if (!res.ok) {
    const detail =
      typeof data === "object" && data !== null && "detail" in data
        ? String((data as { detail?: unknown }).detail ?? `HTTP ${res.status}`)
        : `HTTP ${res.status}`;
    throw new ApiError(detail, res.status, data);
  }

  return data as T;
}

export async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  try {
    return await call<T>(path, init);
  } catch (err) {
    if (!(err instanceof ApiError) || err.status !== 401) {
      throw err;
    }

    await call<unknown>("/accounts/auth/refresh/", { method: "POST" });
    return call<T>(path, init);
  }
}
