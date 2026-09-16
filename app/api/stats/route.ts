import { NextResponse } from "next/server";
import { getSupabasePublic } from "@/lib/supabase/public";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

// Aggregate counts must reflect the database at request time, not at build time.
export const dynamic = "force-dynamic";

/**
 * Public platform totals.
 *
 * These are real counts. This endpoint previously returned hardcoded
 * placeholders ({users: 2847, projects: 436, matches: 8920, ...}) that were
 * indistinguishable from live figures.
 *
 * Only counts leave the server — no rows, and no personally identifying data.
 *
 * `profiles` and `projects` are readable by the `anon` role under RLS (the
 * profiles policy already excludes suspended accounts), so the public client is
 * enough. `connections` is restricted to the two parties involved, so the
 * accepted-match total is counted with the service-role client and reported as
 * null when that key is not configured (local dev) rather than being faked.
 */
export async function GET() {
  try {
    const supabase = getSupabasePublic();

    const [users, projects, activeProjects] = await Promise.all([
      supabase.from("profiles").select("id", { count: "exact", head: true }),
      supabase.from("projects").select("id", { count: "exact", head: true }),
      supabase
        .from("projects")
        .select("id", { count: "exact", head: true })
        .eq("status", "OPEN"),
    ]);

    for (const result of [users, projects, activeProjects]) {
      if (result.error) throw result.error;
    }

    let matches: number | null = null;
    try {
      const admin = getSupabaseAdmin();
      const { count, error } = await admin
        .from("connections")
        .select("id", { count: "exact", head: true })
        .eq("status", "ACCEPTED");
      if (!error) matches = count ?? 0;
    } catch {
      // Service-role key absent (local dev) — report null instead of a fake number.
    }

    return NextResponse.json({
      users: users.count ?? 0,
      projects: projects.count ?? 0,
      matches,
      activeProjects: activeProjects.count ?? 0,
      generated_at: new Date().toISOString(),
    });
  } catch {
    return NextResponse.json(
      { error: "Unable to load platform stats." },
      { status: 500 },
    );
  }
}
