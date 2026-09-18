import { NextResponse } from "next/server";
import { getSupabasePublic } from "@/lib/supabase/public";

export const revalidate = 300;

const emptyStats = {
  users: 0,
  projects: 0,
  matches: 0,
  activeProjects: 0,
};

export async function GET() {
  try {
    const supabase = getSupabasePublic();
    const thirtyDaysAgo = new Date(
      Date.now() - 30 * 24 * 60 * 60 * 1000,
    ).toISOString();

    const [usersResult, projectsResult, matchesResult, activeProjectsResult] =
      await Promise.all([
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase
          .from("projects")
          .select("*", { count: "exact", head: true })
          .eq("status", "OPEN"),
        supabase
          .from("connections")
          .select("*", { count: "exact", head: true })
          .eq("status", "ACCEPTED"),
        supabase
          .from("projects")
          .select("*", { count: "exact", head: true })
          .eq("status", "OPEN")
          .gt("created_at", thirtyDaysAgo),
      ]);

    if (
      usersResult.error ||
      projectsResult.error ||
      matchesResult.error ||
      activeProjectsResult.error
    ) {
      return NextResponse.json(emptyStats, { status: 200 });
    }

    // These are real database counts, not marketing placeholders.
    return NextResponse.json(
      {
        users: usersResult.count ?? 0,
        projects: projectsResult.count ?? 0,
        matches: matchesResult.count ?? 0,
        activeProjects: activeProjectsResult.count ?? 0,
      },
      { status: 200 },
    );
  } catch {
    return NextResponse.json(emptyStats, { status: 200 });
  }
}
