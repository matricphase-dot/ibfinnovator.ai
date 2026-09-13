import type { MetadataRoute } from "next";
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
      ],
    },
    sitemap: "https://innovators-global.com/sitemap.xml",
    host: "https://innovators-global.com",
  };
}
