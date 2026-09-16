import { NextResponse, type NextRequest } from "next/server";
import { requireUserOr401 } from "@/lib/auth/require-user-http";
import { checkFounderAwardsMember, isDuplicate } from "@/lib/credentials";
import { z } from "zod";

/**
 * GET  /api/certificates            -> own certificates
 * GET  /api/certificates?user_id=…  -> that member's certificates
 * POST /api/certificates            -> issue a certificate (project founder
 *                                      only, receiver must be an accepted
 *                                      collaborator)
 *
 * `verification_code` is left to the column default
 * (encode(gen_random_bytes(12),'hex')), which already guarantees a unique code
 * on every insert — generating one in application code would only risk
 * overwriting it with something weaker.
 */

const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Use the YYYY-MM-DD format.");

const issueSchema = z
  .object({
    receiver_id: z.string().uuid(),
    project_id: z.string().uuid(),
    role_title: z.string().trim().min(2).max(120),
    started_at: isoDate.optional(),
    completed_at: isoDate.optional(),
  })
  .refine(
    (value) =>
      !value.started_at ||
      !value.completed_at ||
      value.started_at <= value.completed_at,
    { message: "The start date must be on or before the completion date." },
  );

export async function GET(request: NextRequest) {
  const auth = await requireUserOr401();
  if (auth.response) return auth.response;
  const { supabase, user } = auth.session;

  const targetId = request.nextUrl.searchParams.get("user_id") || user.id;
  if (!z.string().uuid().safeParse(targetId).success) {
    return NextResponse.json({ error: "Invalid user id." }, { status: 400 });
  }

  try {
    const { data, error } = await supabase
      .from("certificates")
      .select(
        "*,project:projects(id,title),issuer:profiles!issued_by(id,name),receiver:profiles!receiver_id(id,name)",
      )
      .eq("receiver_id", targetId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return NextResponse.json(data || []);
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? "Unable to load certificates." },
      { status: 400 },
    );
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireUserOr401();
  if (auth.response) return auth.response;
  const { supabase, user } = auth.session;

  try {
    const payload = issueSchema.parse(await request.json());

    const denied = await checkFounderAwardsMember(
      supabase,
      user.id,
      payload.project_id,
      payload.receiver_id,
    );
    if (denied) {
      return NextResponse.json({ error: denied.error }, { status: denied.status });
    }

    const { data, error } = await supabase
      .from("certificates")
      .insert({
        receiver_id: payload.receiver_id,
        project_id: payload.project_id,
        role_title: payload.role_title,
        started_at: payload.started_at ?? null,
        completed_at: payload.completed_at ?? null,
        issued_by: user.id,
      })
      .select()
      .single();

    if (error) {
      if (isDuplicate(error)) {
        return NextResponse.json(
          { error: "A certificate has already been issued to this member for this project." },
          { status: 409 },
        );
      }
      throw error;
    }

    await supabase.from("notifications").insert({
      user_id: payload.receiver_id,
      type: "CERTIFICATE_ISSUED",
      message: "A verified experience certificate was issued to you",
      link: "/credentials",
    });

    return NextResponse.json(data, { status: 201 });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? "Unable to issue this certificate." },
      { status: 400 },
    );
  }
}
