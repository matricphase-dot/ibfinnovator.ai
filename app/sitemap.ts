import type { MetadataRoute } from "next";

const BASE = process.env.NEXT_PUBLIC_APP_URL || "https://www.ibfinnovator.ai";

/**
 * The four pages a search engine can actually see without an account. Listed
 * explicitly rather than generated from the route tree, because most routes in
 * this app are behind authentication and would 307 to /auth/signin.
 *
 * Change frequencies are honest guesses, not guarantees — nothing here is
 * revalidated per request.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return [
    { url: `${BASE}/`, lastModified, changeFrequency: "weekly", priority: 1 },
    {
      url: `${BASE}/investors`,
      lastModified,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${BASE}/marketplace`,
      lastModified,
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${BASE}/events`,
      lastModified,
      changeFrequency: "daily",
      priority: 0.7,
    },
  ];
}
