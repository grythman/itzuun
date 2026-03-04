import { render, screen } from "@testing-library/react";
import React from "react";

import { RoleGuard } from "@/components/role-guard";

const replace = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
}));

describe("RoleGuard", () => {
  beforeEach(() => {
    replace.mockReset();
  });

  it("renders children when role matches", () => {
    render(
      <RoleGuard currentRole="admin" requiredRole="admin">
        <div>admin content</div>
      </RoleGuard>,
    );

    expect(screen.getByText("admin content")).toBeInTheDocument();
    expect(replace).not.toHaveBeenCalled();
  });

  it("redirects when role does not match", () => {
    render(
      <RoleGuard currentRole="client" requiredRole="admin" fallbackPath="/auth">
        <div>admin content</div>
      </RoleGuard>,
    );

    expect(screen.getByText("Redirecting...")).toBeInTheDocument();
    expect(replace).toHaveBeenCalledWith("/auth");
  });
});
