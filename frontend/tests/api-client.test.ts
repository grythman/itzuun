import { ApiError, apiRequest } from "@/lib/api/client";

const originalFetch = global.fetch;

describe("apiRequest refresh flow", () => {
  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it("retries once after 401 when refresh succeeds", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ detail: "Unauthorized" }), { status: 401, headers: { "content-type": "application/json" } }))
      .mockResolvedValueOnce(new Response("", { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ id: 1 }), { status: 200, headers: { "content-type": "application/json" } }));

    global.fetch = fetchMock as unknown as typeof fetch;

    const data = await apiRequest<{ id: number }>("/auth/me");

    expect(data.id).toBe(1);
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it("throws when refresh fails", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ detail: "Unauthorized" }), { status: 401, headers: { "content-type": "application/json" } }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ detail: "Refresh failed" }), { status: 401, headers: { "content-type": "application/json" } }));

    global.fetch = fetchMock as unknown as typeof fetch;

    await expect(apiRequest("/auth/me")).rejects.toBeInstanceOf(ApiError);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
