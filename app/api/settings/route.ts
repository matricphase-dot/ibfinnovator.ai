import { NextResponse } from "next/server";
import { clerkClient } from "@clerk/nextjs/server";
import { requireUser } from "@/lib/supabase/server";
import { z } from "zod";

const prefs = z.object({
  notifications: z
    .record(z.string().max(40), z.boolean())
    .refine((n) => Object.keys(n).length <= 20, "Too many preferences"),
});

export async function GET() {
  try {
    const { user } = await requireUser();
    let notifications: unknown = null;
    try {
      const clerkUser = await (
        await clerkClient()
      ).users.getUser(user.id);
      notifications =
        ((clerkUser as any).publicMetadata as any)?.notifications ?? null;
    } catch {
      /* metadata unavailable — return defaults */
    }
    return NextResponse.json({ notifications });
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message || "Unable to load settings." },
      { status: 401 },
    );
  }
}

export async function PATCH(r: Request) {
  try {
    const { user } = await requireUser();
    const p = prefs.safeParse(await r.json());
    if (!p.success)
      return NextResponse.json({ error: p.error.flatten() }, { status: 400 });
    await (
      await clerkClient()
    ).users.updateUserMetadata(user.id, {
      publicMetadata: { notifications: p.data.notifications },
    });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message || "Unable to save settings." },
      { status: 401 },
    );
  }
}
