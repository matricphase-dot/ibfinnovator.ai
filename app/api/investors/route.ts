import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * The public investor directory.
 *
 *   GET /api/investors -> founders who opted in, with their open projects
 *
 * Only founders who set `investor_visible` appear, and only the fields the
 * directory promises: name, username, company, industry, avatar and the pitch
 * they wrote. No email, no internal identifiers beyond `id` (used to link to the
 * public profile page). Everything here is already readable under the
 * `profiles public read` policy, so this route adds no exposure of its own.
 */

export async function GET() {
  try {
    const s = await createClient();

    const { data: founders, error } = await s
      .from("profiles")
      .select("id,name,username,company,industry,avatar_url,investor_pitch")
      .eq("investor_visible", true)
      .eq("role", "FOUNDER")
      .order("updated_at", { ascending: false })
      .limit(60);

    if (error) throw error;

    const ids = (founders ?? []).map((f: any) => f.id);
    let projects: any[] = [];
    if (ids.length) {
      const { data, error: projectError } = await s
        .from("projects")
        .select("founder_id,title,domain,stage")
        .in("founder_id", ids)
        .eq("status", "OPEN")
        .order("created_at", { ascending: false });
      if (projectError) throw projectError;
      projects = data ?? [];
    }

    return NextResponse.json(
      (founders ?? []).map((founder: any) => ({
        id: founder.id,
        name: founder.name,
        username: founder.username,
        company: founder.company,
        industry: founder.industry,
        avatar_url: founder.avatar_url,
        investor_pitch: founder.investor_pitch,
        open_projects: projects
          .filter((project) => project.founder_id === founder.id)
          .map((project) => ({
            title: project.title,
            domain: project.domain,
            stage: project.stage,
          })),
      })),
    );
  } catch (e: any) {
    console.error("investors GET failed:", e?.message);
    return NextResponse.json(
      { error: "Unable to load the investor directory." },
      { status: 500 },
    );
  }
}
