import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/api/", "/admin/", "/client/", "/freelancer/", "/auth/"] },
    sitemap: "https://itzuun.works/sitemap.xml",
  };
}
