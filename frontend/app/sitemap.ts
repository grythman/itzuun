import type { MetadataRoute } from "next";

const BASE = "https://itzuun.works";

export default function sitemap(): MetadataRoute.Sitemap {
  const locales = ["mn", "en"];
  const pages = ["", "/about", "/projects", "/freelancers", "/support", "/pro", "/privacy", "/terms"];

  return pages.flatMap((page) =>
    locales.map((locale) => ({
      url: `${BASE}/${locale}${page}`,
      lastModified: new Date(),
      changeFrequency: page === "" ? "daily" as const : "weekly" as const,
      priority: page === "" ? 1 : page === "/projects" ? 0.9 : 0.7,
    }))
  );
}
