import { NextResponse } from "next/server";
import { requireUserOr401 } from "@/lib/auth/require-user-http";
import { isDuplicate } from "@/lib/credentials";
import { z } from "zod";

/**
 * POST /api/endorsements — endorse a skill a member actually lists.
 *
 * Requiring the skill to be present on the receiver's profile keeps
 * endorsements meaningful: without it, anyone could attach arbitrary skills to
 * another member's reputation.
 */

const input = z.object({
  receiver_id: z.string().uuid(),
  skill: z.string().trim().min(1).max(80),
  project_id: z.string().uuid().optional(),
});

export async function POST(request: Request) {
  const auth = await requireUserOr401();
  if (auth.response) return auth.response;
  const { supabase, user } = auth.session;

  try {
    const payload = input.parse(await request.json());

    if (payload.receiver_id === user.id) {
      return NextResponse.json({ error: "You cannot endorse yourself." }, { status: 400 });
    }

    const { data: receiver, error: receiverError } = await supabase
      .from("profiles")
      .select("id,skills")
      .eq("id", payload.receiver_id)
      .maybeSingle();

    if (receiverError || !receiver) {
      return NextResponse.json({ error: "Member not found." }, { status: 404 });
    }

    const skills: string[] = receiver.skills ?? [];
    // Match case-insensitively but store the profile's own spelling, so a member
    // with "React" in their profile ends up grouped under "React" either way.
    const match = skills.find(
      (skill) => skill.toLowerCase() === payload.skill.toLowerCase(),
    );
    if (!match) {
      return NextResponse.json(
        {
          error: skills.length
            ? "That skill is not listed on this member's profile."
            : "This member has not listed any skills yet.",
        },
        { status: 400 },
      );
    }

    const { data, error } = await supabase
      .from("endorsements")
      .insert({
        ...payload,
        skill: match,
        giver_id: user.id,
      })
      .select()
      .single();

    if (error) {
      if (isDuplicate(error)) {
        return NextResponse.json(
          { error: "You already endorsed this skill." },
          { status: 409 },
        );
      }
      throw error;
    }

    const { error: recomputeError } = await supabase.rpc(
      "recompute_profile_reputation",
      { p_profile: payload.receiver_id },
    );
    if (recomputeError) {
      console.error("recompute_profile_reputation failed:", recomputeError.message);
    }

    return NextResponse.json(data, { status: 201 });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? "Unable to endorse this skill." },
      { status: 400 },
    );
  }
}
