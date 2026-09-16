import type { MetadataRoute } from "next";

const BASE = process.env.NEXT_PUBLIC_APP_URL || "https://www.ibfinnovator.ai";

/**
 * Only pages that are genuinely public are listed. Everything behind sign-in
 * (/dashboard, /projects, /settings, /analytics, /university …) redirects to
 * /auth/signin for a crawler, so including it would just be noise.
 *
 * /verify/<code> is intentionally absent: those URLs are per-credential and
 * would require enumerating codes, which is exactly what should not happen.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/investors", "/marketplace", "/events", "/help"],
        disallow: [
          "/api/",
          "/dashboard",
          "/projects",
          "/matches",
          "/cofounder-matches",
          "/credentials",
          "/meetings",
          "/messages",
          "/notifications",
          "/bookmarks",
          "/chat",
          "/team",
          "/settings",
          "/analytics",
          "/university/admin",
          "/auth/",
          "/verify/",
          "/profile/",
        ],
      },
    ],
    sitemap: `${BASE}/sitemap.xml`,
    host: BASE,
  };
}
