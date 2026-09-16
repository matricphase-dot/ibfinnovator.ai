import { NextResponse, type NextRequest } from "next/server";
import { requireUserOr401 } from "@/lib/auth/require-user-http";
import { checkFounderAwardsMember, isDuplicate } from "@/lib/credentials";
import { z } from "zod";

/**
 * GET  /api/badges            -> { definitions, earned }        (own badges)
 * GET  /api/badges?user_id=…  -> { definitions, earned }  (that member's badges,
 *                                for the public profile grid)
 * POST /api/badges            -> award a badge (project founder only, receiver
 *                                must be an accepted collaborator)
 */

export async function GET(request: NextRequest) {
  const auth = await requireUserOr401();
  if (auth.response) return auth.response;
  const { supabase, user } = auth.session;

  // Read-only badge data on a public profile is already world-readable via the
  // "badges public read" policy; only the target id differs.
  const targetId = request.nextUrl.searchParams.get("user_id") || user.id;
  if (!z.string().uuid().safeParse(targetId).success) {
    return NextResponse.json({ error: "Invalid user id." }, { status: 400 });
  }

  try {
    const [{ data: definitions }, { data: earned }] = await Promise.all([
      supabase.from("badge_definitions").select("*").eq("active", true),
      supabase
        .from("user_badges")
        .select(
          "*,badge:badge_definitions(*),project:projects(id,title),awarder:profiles!awarded_by(id,name)",
        )
        .eq("receiver_id", targetId)
        .order("created_at", { ascending: false }),
    ]);
    return NextResponse.json({
      definitions: definitions || [],
      earned: earned || [],
      user_id: targetId,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Unable to load badges." }, { status: 400 });
  }
}

const awardSchema = z.object({
  badge_id: z.string().uuid(),
  receiver_id: z.string().uuid(),
  project_id: z.string().uuid(),
  evidence: z.string().trim().min(10).max(2000),
});

export async function POST(request: NextRequest) {
  const auth = await requireUserOr401();
  if (auth.response) return auth.response;
  const { supabase, user } = auth.session;

  try {
    const payload = awardSchema.parse(await request.json());

    const denied = await checkFounderAwardsMember(
      supabase,
      user.id,
      payload.project_id,
      payload.receiver_id,
    );
    if (denied) {
      return NextResponse.json({ error: denied.error }, { status: denied.status });
    }

    const { data: definition } = await supabase
      .from("badge_definitions")
      .select("id,name,active")
      .eq("id", payload.badge_id)
      .maybeSingle();
    if (!definition) {
      return NextResponse.json({ error: "Unknown badge." }, { status: 400 });
    }
    if (!definition.active) {
      return NextResponse.json({ error: "That badge is no longer awarded." }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("user_badges")
      .insert({ ...payload, awarded_by: user.id })
      .select("*,badge:badge_definitions(*)")
      .single();

    if (error) {
      if (isDuplicate(error)) {
        return NextResponse.json(
          { error: "This member has already earned that badge for this project." },
          { status: 409 },
        );
      }
      throw error;
    }

    await supabase.from("notifications").insert({
      user_id: payload.receiver_id,
      type: "BADGE_AWARDED",
      message: `You earned the ${data.badge.name} badge`,
      link: "/credentials",
    });

    return NextResponse.json(data, { status: 201 });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? "Unable to award this badge." },
      { status: 400 },
    );
  }
}
