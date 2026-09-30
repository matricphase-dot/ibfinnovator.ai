import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { getSupabasePublic } from "@/lib/supabase/public";

export const revalidate = 300;

export async function GET() {
  try {
    const supabase = getSupabasePublic();
    const { data, error } = await supabase.rpc("get_public_stats");
    if (error) {
      Sentry.captureException(error, { tags: { api: "stats" } });
      console.error("[stats:error]", error.message);
      return NextResponse.json(
        { error: "Stats temporarily unavailable" },
        { status: 503, headers: { "retry-after": "60" } },
      );
    }
    return NextResponse.json(
      {
        users: data?.users ?? 0,
        projects: data?.projects ?? 0,
        matches: data?.matches ?? 0,
        activeProjects: data?.activeProjects ?? 0,
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
