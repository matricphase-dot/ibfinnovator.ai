import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/supabase/server";

export async function POST(req: Request) {
  try {
    const { supabase, user } = await requireUser();
    const parsed = z
      .object({ role: z.enum(["FOUNDER", "STUDENT"]) })
      .safeParse(await req.json().catch(() => null));
    if (!parsed.success)
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    const { error } = await supabase.rpc("set_onboarding_role", {
      p_role: parsed.data.role,
    });
    if (error) throw error;
    return NextResponse.json({ ok: true, profileId: user.id });
  } catch (e: any) {
    const message = e.message || "Unable to set role";
    return NextResponse.json(
      { error: message },
      {
        status:
          message === "UNAUTHORIZED"
            ? 401
            : message === "PROFILE_NOT_FOUND"
              ? 404
              : 400,
      },
    );
  }
}
