import type { MetadataRoute } from "next";
import { MARKETING_ORIGIN } from "@/lib/auth/domain";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/api/",
        "/dashboard",
        "/settings",
        "/admin",
        "/chat/",
        "/team/",
        "/applications",
        "/notifications",
        "/projects/new",
        "/projects/*/board",
        "/projects/*/cycles",
        "/projects/*/list",
        "/projects/*/modules",
        "/projects/*/pages",
        "/projects/*/settings",
      ],
    },
    sitemap: `${MARKETING_ORIGIN}/sitemap.xml`,
    host: MARKETING_ORIGIN,
  };
}
