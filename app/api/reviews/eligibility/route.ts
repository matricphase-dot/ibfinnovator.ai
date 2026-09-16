import { NextResponse, type NextRequest } from "next/server";
import { requireUserOr401 } from "@/lib/auth/require-user-http";
import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";

/**
 * GET /api/reviews/eligibility?reviewee_id=<uuid>
 *   -> { projects: [{ id, title }] }
 *
 * The projects two members both took part in *and* that are COMPLETED — the
 * only ones a review may reference. Membership means founder or accepted
 * collaborator; the intersection is what makes the review mutual.
 */

async function projectIdsFor(
  supabase: SupabaseClient,
  profileId: string,
): Promise<Set<string>> {
  const [connections, founded] = await Promise.all([
    supabase
      .from("connections")
      .select("project_id")
      .eq("status", "ACCEPTED")
      .or(`requester_id.eq.${profileId},recipient_id.eq.${profileId}`),
    supabase.from("projects").select("id").eq("founder_id", profileId),
  ]);

  const ids = new Set<string>();
  (connections.data ?? []).forEach((row: { project_id: string }) => ids.add(row.project_id));
  (founded.data ?? []).forEach((row: { id: string }) => ids.add(row.id));
  return ids;
}

export async function GET(request: NextRequest) {
  const auth = await requireUserOr401();
  if (auth.response) return auth.response;
  const { supabase, user } = auth.session;

  const revieweeId = request.nextUrl.searchParams.get("reviewee_id") ?? "";
  if (!z.string().uuid().safeParse(revieweeId).success) {
    return NextResponse.json({ error: "Invalid reviewee id." }, { status: 400 });
  }
  if (revieweeId === user.id) {
    return NextResponse.json({ projects: [] });
  }

  try {
    const [mine, theirs] = await Promise.all([
      projectIdsFor(supabase, user.id),
      projectIdsFor(supabase, revieweeId),
    ]);

    const shared = [...mine].filter((id) => theirs.has(id));
    if (!shared.length) return NextResponse.json({ projects: [] });

    const { data, error } = await supabase
      .from("projects")
      .select("id,title,status")
      .in("id", shared)
      .eq("status", "COMPLETED")
      .order("title");

    if (error) throw error;

    return NextResponse.json({
      projects: (data ?? []).map((p: { id: string; title: string }) => ({
        id: p.id,
        title: p.title,
      })),
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? "Unable to load reviewable projects." },
      { status: 400 },
    );
  }
}
