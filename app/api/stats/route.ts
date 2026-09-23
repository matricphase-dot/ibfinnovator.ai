import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { getSupabasePublic } from "@/lib/supabase/public";

export const revalidate = 300;

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

    const firstError =
      usersResult.error ||
      projectsResult.error ||
      matchesResult.error ||
      activeProjectsResult.error;
    if (firstError) {
      // ROOT FIX: outage must be 503 (retryable), never 200-zero which masks
      // the outage and gets cached for 300s as truth.
      Sentry.captureException(firstError, { tags: { api: "stats" } });
      // eslint-disable-next-line no-console
      console.error("[stats:error]", firstError.message);
      return NextResponse.json(
        { error: "Stats temporarily unavailable" },
        { status: 503, headers: { "retry-after": "60" } },
      );
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
  } catch (e) {
    Sentry.captureException(e, { tags: { api: "stats" } });
    // eslint-disable-next-line no-console
    console.error("[stats:error]", e);
    return NextResponse.json(
      { error: "Stats temporarily unavailable" },
      { status: 503, headers: { "retry-after": "60" } },
    );
  }
}
