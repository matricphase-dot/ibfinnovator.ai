import { NextResponse } from "next/server";
import { requireUserOr401 } from "@/lib/auth/require-user-http";
import { isDuplicate, isProjectCollaborator } from "@/lib/credentials";
import { z } from "zod";

/**
 * POST /api/reviews — review a collaborator once a project is COMPLETED.
 *
 * Only the founder and accepted collaborators may review. The write is followed
 * by recompute_profile_reputation(), which is authoritative: the trigger added
 * in migration 021 already refreshes the reviewee's aggregates (and so does any
 * delete), but calling it explicitly keeps this route correct on its own and
 * replaces the read-modify-write that could lose concurrent updates.
 */

const input = z.object({
  reviewee_id: z.string().uuid(),
  project_id: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().trim().min(10).max(2000).optional(),
});

export async function POST(request: Request) {
  const auth = await requireUserOr401();
  if (auth.response) return auth.response;
  const { supabase, user } = auth.session;

  try {
    const payload = input.parse(await request.json());

    if (payload.reviewee_id === user.id) {
      return NextResponse.json({ error: "You cannot review yourself." }, { status: 400 });
    }

    const { data: project } = await supabase
      .from("projects")
      .select("status,founder_id")
      .eq("id", payload.project_id)
      .maybeSingle();

    if (!project) {
      return NextResponse.json({ error: "Project not found." }, { status: 404 });
    }
    if (project.status !== "COMPLETED") {
      return NextResponse.json(
        { error: "Reviews open after the project is completed." },
        { status: 400 },
      );
    }

    const { data: connection } = await supabase
      .from("connections")
      .select("id")
      .eq("project_id", payload.project_id)
      .eq("status", "ACCEPTED")
      .or(`requester_id.eq.${user.id},recipient_id.eq.${user.id}`)
      .maybeSingle();

    if (!connection && project.founder_id !== user.id) {
      return NextResponse.json(
        { error: "Only project collaborators can review." },
        { status: 403 },
      );
    }

    // The reviewed person must also be part of the project, so a member cannot
    // attach a rating to someone they never worked with.
    if (!(await isProjectCollaborator(supabase, payload.project_id, payload.reviewee_id))) {
      return NextResponse.json(
        { error: "You can only review someone who worked on this project." },
        { status: 403 },
      );
    }

    const { data, error } = await supabase
      .from("reviews")
      .insert({ ...payload, reviewer_id: user.id })
      .select()
      .single();

    if (error) {
      if (isDuplicate(error)) {
        return NextResponse.json(
          { error: "You have already reviewed this person for this project." },
          { status: 409 },
        );
      }
      throw error;
    }

    const { error: recomputeError } = await supabase.rpc(
      "recompute_profile_reputation",
      { p_profile: payload.reviewee_id },
    );
    // The trigger has already updated the row; a failure here must not fail the
    // review the member just submitted.
    if (recomputeError) {
      console.error("recompute_profile_reputation failed:", recomputeError.message);
    }

    return NextResponse.json(data, { status: 201 });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? "Unable to submit this review." },
      { status: 400 },
    );
  }
}
