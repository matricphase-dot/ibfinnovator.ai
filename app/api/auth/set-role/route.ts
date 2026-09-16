import { NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";

const allowedRoles = ["FOUNDER", "STUDENT"] as const;
type AllowedRole = (typeof allowedRoles)[number];

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  let role: unknown;
  try {
    ({ role } = await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (typeof role !== "string" || !allowedRoles.includes(role as AllowedRole)) {
    return NextResponse.json(
      { error: "role must be FOUNDER or STUDENT" },
      { status: 400 },
    );
  }

  const client = await clerkClient();
  try {
    await client.users.updateUserMetadata(userId, {
      publicMetadata: { role },
    });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error)?.message ?? "Unable to update Clerk metadata" },
      { status: 500 },
    );
  }

  const { data, error } = await supabaseAdmin
    .from("profiles")
    .update({ role, updated_at: new Date().toISOString() })
    .eq("clerk_user_id", userId)
    .select("id");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data || data.length === 0) {
    return NextResponse.json(
      { error: "Profile not linked yet — retry in a moment" },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true, role });
}
