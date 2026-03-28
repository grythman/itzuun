import { render, screen } from "@testing-library/react";
import React from "react";

import HomePage from "@/app/[locale]/page";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

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
  it("renders landing and latest projects", () => {
    render(<HomePage />);

    expect(screen.getByRole("heading", { level: 1, name: "title" })).toBeInTheDocument();
    expect(screen.getByText("platformBadge")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "featuredProjects" })).toBeInTheDocument();
    expect(screen.getByText("Landing page build")).toBeInTheDocument();
    expect(screen.getByText("Need freelancer")).toBeInTheDocument();
  });
});
