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

  it("links each category CTA to the localized order route with a category query", () => {
    render(
      <NextIntlClientProvider messages={messages} locale="mn">
        <HomePage />
      </NextIntlClientProvider>
    );

    const expectedCategoryLinks = [
      [messages.Home.categoryTitle1, "/mn/client/projects/new?category=website"],
      [messages.Home.categoryTitle2, "/mn/client/projects/new?category=landing-page"],
      [messages.Home.categoryTitle3, "/mn/client/projects/new?category=poster-design"],
      [messages.Home.categoryTitle4, "/mn/client/projects/new?category=logo-design"],
      [messages.Home.categoryTitle5, "/mn/client/projects/new?category=document-cleanup"],
      [messages.Home.categoryTitle6, "/mn/client/projects/new?category=cv-document"],
      [messages.Home.categoryTitle7, "/mn/client/projects/new?category=template-customization"],
      [messages.Home.categoryTitle8, "/mn/client/projects/new?category=it-support"],
    ] as const;

    expectedCategoryLinks.forEach(([name, href]) => {
      expect(screen.getAllByRole("link", { name: new RegExp(name) }).some((link) => link.getAttribute("href") === href)).toBe(true);
    });
  });

  it("links each demo service card to the localized order route with a service query", () => {
    render(
      <NextIntlClientProvider messages={messages} locale="mn">
        <HomePage />
      </NextIntlClientProvider>
    );

    const expectedServiceLinks = [
      [messages.Home.serviceTitle1, "/mn/client/projects/new?service=small-business-website"],
      [messages.Home.serviceTitle2, "/mn/client/projects/new?service=landing-page"],
      [messages.Home.serviceTitle3, "/mn/client/projects/new?service=social-poster-pack"],
      [messages.Home.serviceTitle4, "/mn/client/projects/new?service=cv-document-cleanup"],
      [messages.Home.serviceTitle5, "/mn/client/projects/new?service=computer-software-support"],
    ] as const;

    expectedServiceLinks.forEach(([name, href]) => {
      expect(screen.getAllByRole("link", { name: new RegExp(name) }).some((link) => link.getAttribute("href") === href)).toBe(true);
    });
  });
});
