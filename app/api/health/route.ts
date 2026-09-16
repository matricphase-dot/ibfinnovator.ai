import { NextResponse } from "next/server";
import { getSupabasePublic } from "@/lib/supabase/public";

/**
 * Liveness/readiness endpoint for uptime monitors and the cutover checklist.
 *
 *   GET /api/health -> { ok, db, latency_ms, version, checked_at }
 *
 * Deliberately unauthenticated (a monitor cannot sign in) and therefore
 * deliberately uninformative: it reports whether the database answered and how
 * long it took, never which tables exist, what the error was, or any
 * configuration value. A failing check returns 503 so an uptime monitor can
 * alert on status code alone.
 *
 * The probe is a `head` count against a publicly readable table — the cheapest
 * round trip that genuinely proves the database is reachable and the key works.
 */

export const dynamic = "force-dynamic";

export async function GET() {
  const startedAt = Date.now();
  const checkedAt = new Date().toISOString();

  const payload: Record<string, unknown> = {
    ok: true,
    db: "ok",
    version: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? "dev",
    checked_at: checkedAt,
  };

  try {
    const supabase = getSupabasePublic();
    const { error } = await supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .limit(0);

    if (error) throw error;
    payload.latency_ms = Date.now() - startedAt;
    return NextResponse.json(payload);
  } catch (e: any) {
    // The reason is logged server-side and never returned to the caller.
    console.error("health check failed:", e?.message);
    return NextResponse.json(
      {
        ok: false,
        db: "unreachable",
        version: payload.version,
        checked_at: checkedAt,
        latency_ms: Date.now() - startedAt,
      },
      { status: 503 },
    );
  }
}
