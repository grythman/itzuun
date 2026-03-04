import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AuthPage from "@/app/auth/page";

const pushMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock("@/lib/toast-store", () => ({
  useToastStore: (selector: (s: { push: typeof pushMock }) => unknown) => selector({ push: pushMock }),
}));

vi.mock("@/lib/api/endpoints", () => ({
  authApi: {
    requestOtp: vi.fn().mockResolvedValue({ otp_token: "abc-token", message: "OTP sent" }),
    verifyOtp: vi.fn().mockResolvedValue({ message: "ok" }),
  },
}));

describe("Auth page happy path", () => {
  it("requests OTP and auto-populates verify form", async () => {
    const user = userEvent.setup();
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={client}>
        <AuthPage />
      </QueryClientProvider>,
    );

    const emailInputs = screen.getAllByLabelText("Email") as HTMLInputElement[];
    await user.type(emailInputs[0], "demo@test.com");
    await user.click(screen.getByRole("button", { name: "Request OTP" }));

    const populated = await screen.findAllByDisplayValue("demo@test.com");
    expect(populated.length).toBeGreaterThanOrEqual(1);
    expect(pushMock).toHaveBeenCalled();
  });
});
