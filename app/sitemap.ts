import type { MetadataRoute } from "next";
import { supabasePublic } from "@/lib/supabase/public";
import { MARKETING_ORIGIN } from "@/lib/auth/domain";

const base = MARKETING_ORIGIN;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const fixed: MetadataRoute.Sitemap = [
    "",
    "/projects",
    "/help",
    "/privacy",
  ].map((path, i) => ({
    url: `${base}${path}`,
    lastModified: new Date(),
    changeFrequency: (i < 2 ? "daily" : "weekly") as "daily" | "weekly",
    priority: i === 0 ? 1 : i === 3 ? 0.6 : 0.8,
  }));

  let projectEntries: MetadataRoute.Sitemap = [];

  if (
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    try {
      const { data } = await supabasePublic
        .from("projects")
        .select("id,updated_at")
        .eq("status", "OPEN")
        .limit(5000);

      if (data && Array.isArray(data)) {
        projectEntries = data.map((p) => ({
          url: `${base}/projects/${p.id}`,
          lastModified: new Date(p.updated_at),
          changeFrequency: "weekly" as const,
          priority: 0.7,
        }));
      }
    } catch {
      // In build or offline environments without database connectivity, safely fallback to fixed routes
      projectEntries = [];
    }
  }

  return [...fixed, ...projectEntries];
}

