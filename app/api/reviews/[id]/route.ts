import { NextResponse, type NextRequest } from "next/server";
import { requireUserOr401 } from "@/lib/auth/require-user-http";
import { z } from "zod";

/**
 * Edit or withdraw one of your own reviews.
 *
 *   PATCH  /api/reviews/<id>  { rating?, comment? }  -> the updated review
 *   DELETE /api/reviews/<id>                          -> { deleted: true }
 *
 * Only the reviewer may act (migration 022 adds the matching UPDATE/DELETE
 * policies). reviewer_id, reviewee_id and project_id are immutable — a trigger
 * enforces it — so a review can never be repointed at someone else to bypass
 * the collaborator check on creation.
 *
 * Both handlers refresh the reviewee's reputation through
 * recompute_profile_reputation(); the triggers already cover this, but the
 * explicit call keeps the route correct on its own. A recompute failure is
 * logged and never fails the edit the member actually asked for.
 */

const patchSchema = z
  .object({
    rating: z.number().int().min(1).max(5).optional(),
    comment: z.string().trim().min(10).max(2000).optional(),
  })
  .refine((value) => value.rating !== undefined || value.comment !== undefined, {
    message: "Provide a rating, a comment, or both.",
  });

async function loadOwnReview(supabase: any, id: string, userId: string) {
  const { data: review, error } = await supabase
    .from("reviews")
    .select("id,reviewer_id,reviewee_id")
    .eq("id", id)
    .maybeSingle();

  // A failed read is not a missing row: reporting 404 for an infrastructure
  // error would send whoever debugs it looking in the wrong place.
  if (error) {
    console.error("reviews select failed:", error.message);
    return { error: "Unable to load this review.", status: 500 as const };
  }
  if (!review) return { error: "Review not found.", status: 404 as const };
  if (review.reviewer_id !== userId) {
    return { error: "You can only change your own reviews.", status: 403 as const };
  }
  return { review };
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireUserOr401();
  if (auth.response) return auth.response;
  const { supabase, user } = auth.session;

  try {
    const { id } = await params;
    if (!z.string().uuid().safeParse(id).success) {
      return NextResponse.json({ error: "Invalid review id." }, { status: 400 });
    }

    const payload = patchSchema.parse(await request.json());
    const found = await loadOwnReview(supabase, id, user.id);
    if ("error" in found) {
      return NextResponse.json({ error: found.error }, { status: found.status });
    }

    const { data, error } = await supabase
      .from("reviews")
      .update(payload)
      .eq("id", id)
      .eq("reviewer_id", user.id)
      .select()
      .single();

    if (error) throw error;

    const { error: recomputeError } = await supabase.rpc(
      "recompute_profile_reputation",
      { p_profile: found.review.reviewee_id },
    );
    if (recomputeError) {
      console.error("recompute_profile_reputation failed:", recomputeError.message);
    }

    return NextResponse.json(data);
  } catch (e: any) {
    if (e instanceof z.ZodError) {
      return NextResponse.json(
        { error: e.issues[0]?.message ?? "Invalid review payload." },
        { status: 400 },
      );
    }
    console.error("reviews/[id] update failed:", e?.message);
    return NextResponse.json({ error: "Unable to update this review." }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireUserOr401();
  if (auth.response) return auth.response;
  const { supabase, user } = auth.session;

  try {
    const { id } = await params;
    if (!z.string().uuid().safeParse(id).success) {
      return NextResponse.json({ error: "Invalid review id." }, { status: 400 });
    }

    const found = await loadOwnReview(supabase, id, user.id);
    if ("error" in found) {
      return NextResponse.json({ error: found.error }, { status: found.status });
    }

    const { error } = await supabase
      .from("reviews")
      .delete()
      .eq("id", id)
      .eq("reviewer_id", user.id);

    if (error) throw error;

    const { error: recomputeError } = await supabase.rpc(
      "recompute_profile_reputation",
      { p_profile: found.review.reviewee_id },
    );
    if (recomputeError) {
      console.error("recompute_profile_reputation failed:", recomputeError.message);
    }

    return NextResponse.json({ deleted: true, id });
  } catch (e: any) {
    if (e instanceof z.ZodError) {
      return NextResponse.json(
        { error: e.issues[0]?.message ?? "Invalid review payload." },
        { status: 400 },
      );
    }
    console.error("reviews/[id] delete failed:", e?.message);
    return NextResponse.json({ error: "Unable to delete this review." }, { status: 500 });
  }
}
