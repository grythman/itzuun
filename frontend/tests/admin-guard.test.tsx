import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import AdminGuard from "@/components/admin-guard";

const replace = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
}));

vi.mock("@/lib/api/endpoints", () => ({
  authApi: {
    me: vi.fn().mockResolvedValue({ id: 1, email: "client@test.com", role: "client" }),
  },
}));

describe("AdminGuard", () => {
  it("redirects non-admin users", async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });

    render(
      <QueryClientProvider client={client}>
        <AdminGuard>
          <div>Admin Content</div>
        </AdminGuard>
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect(replace).toHaveBeenCalledWith("/");
    });
    expect(screen.queryByText("Admin Content")).not.toBeInTheDocument();
  });
});
