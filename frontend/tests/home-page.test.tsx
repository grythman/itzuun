import { render, screen } from "@testing-library/react";
import React from "react";

import HomePage from "@/app/page";

vi.mock("@/lib/hooks", () => ({
  useProjects: () => ({
    isLoading: false,
    isError: false,
    data: {
      results: [
        { id: 10, title: "Landing page build", description: "Need freelancer", status: "open" },
      ],
    },
  }),
}));

describe("HomePage", () => {
  it("renders project list happy path", () => {
    render(<HomePage />);

    expect(screen.getByText("Projects")).toBeInTheDocument();
    expect(screen.getByText("Landing page build")).toBeInTheDocument();
    expect(screen.getByText("Need freelancer")).toBeInTheDocument();
  });
});
