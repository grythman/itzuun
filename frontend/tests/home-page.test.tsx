import { render, screen } from "@testing-library/react";
import React from "react";
import { NextIntlClientProvider } from "next-intl";

import HomePage from "@/app/[locale]/(public)/page";
import messages from "@/messages/mn.json";

vi.mock("next/navigation", () => ({
  usePathname: () => "/mn",
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
  it("renders Stage 3 service positioning, categories, and support CTAs", () => {
    render(
      <NextIntlClientProvider messages={messages} locale="mn">
        <HomePage />
      </NextIntlClientProvider>
    );

    expect(screen.getByRole("heading", { level: 1, name: messages.Home.landingTitle })).toBeInTheDocument();
    expect(screen.getByText(messages.Home.platformBadge)).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: messages.Home.categorySectionTitle })).toBeInTheDocument();
    expect(screen.getAllByText(messages.Home.categoryTitle8)[0]).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: messages.Home.servicesTitle })).toBeInTheDocument();
    expect(screen.getByText(messages.Home.serviceTitle1)).toBeInTheDocument();
    expect(screen.getAllByText(messages.Home.serviceTitle5)[0]).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: messages.Home.landingSecondaryCta })[0]).toHaveAttribute("href", "/mn/support");
  });
});
