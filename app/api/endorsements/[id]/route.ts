import { NextResponse, type NextRequest } from "next/server";
import { requireUserOr401 } from "@/lib/auth/require-user-http";
import { z } from "zod";

/**
 * Withdraw an endorsement you gave.
 *
 *   DELETE /api/endorsements/<id>  -> { deleted: true }
 *
 * There is no PATCH: giver_id, receiver_id and skill are the entire row, so
 * editing one is the same as deleting it and endorsing again (migration 022
 * adds the DELETE policy but deliberately no UPDATE policy).
 *
 * The receiver's endorsement_count is refreshed through
 * recompute_profile_reputation(); the trigger already covers this, but the
 * explicit call keeps the route correct on its own. A recompute failure is
 * logged and never fails the withdrawal.
 */
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
      return NextResponse.json({ error: "Invalid endorsement id." }, { status: 400 });
    }

    const { data: endorsement, error: loadError } = await supabase
      .from("endorsements")
      .select("id,giver_id,receiver_id")
      .eq("id", id)
      .maybeSingle();

    // A failed read is not a missing row (see the reviews route).
    if (loadError) {
      console.error("endorsements select failed:", loadError.message);
      return NextResponse.json(
        { error: "Unable to load this endorsement." },
        { status: 500 },
      );
    }

    if (!endorsement) {
      return NextResponse.json({ error: "Endorsement not found." }, { status: 404 });
    }
    if (endorsement.giver_id !== user.id) {
      return NextResponse.json(
        { error: "You can only withdraw endorsements you gave." },
        { status: 403 },
      );
    }

    const { error } = await supabase
      .from("endorsements")
      .delete()
      .eq("id", id)
      .eq("giver_id", user.id);

    if (error) throw error;

    const { error: recomputeError } = await supabase.rpc(
      "recompute_profile_reputation",
      { p_profile: endorsement.receiver_id },
    );
    if (recomputeError) {
      console.error("recompute_profile_reputation failed:", recomputeError.message);
    }

    return NextResponse.json({ deleted: true, id });
  } catch (e: any) {
    console.error("endorsements/[id] DELETE failed:", e?.message);
    return NextResponse.json(
      { error: "Unable to withdraw this endorsement." },
      { status: 500 },
    );
  }
}
