import { apiRequest } from "@/lib/api/client";

describe("apiRequest refresh flow", () => {
  it("retries once after 401 when refresh succeeds", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ detail: "Unauthorized" }), { status: 401 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ ok: true }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ id: 1, role: "client", email: "a@test.com" }), { status: 200 }));

    vi.stubGlobal("fetch", fetchMock);

    const result = await apiRequest<{ id: number }>("/auth/me", { method: "GET" });
    expect(result.id).toBe(1);
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });
});
