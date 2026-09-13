import type { MetadataRoute } from "next";
import { supabasePublic } from "@/lib/supabase/public";
const base = "https://innovators-global.com";
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { data } = await supabasePublic
    .from("projects")
    .select("id,updated_at")
    .eq("status", "OPEN");
  const fixed = [
    "",
    "/projects",
    "/investors",
    "/marketplace",
    "/events",
    "/help",
  ].map((path, i) => ({
    url: `${base}${path}`,
    lastModified: new Date(),
    changeFrequency: (i < 2 ? "daily" : "weekly") as "daily" | "weekly",
    priority: i === 0 ? 1 : 0.8,
  }));
  return [
    ...fixed,
    ...(data || []).map((p) => ({
      url: `${base}/projects/${p.id}`,
      lastModified: new Date(p.updated_at),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
  ];
}
