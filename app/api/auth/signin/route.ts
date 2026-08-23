import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";
const input = z.object({
  email: z.string().trim().email(),
  password: z.string().min(8),
});
export async function POST(r: Request) {
  try {
    const p = input.safeParse(await r.json());
    if (!p.success)
      return NextResponse.json(
        { error: "Enter a valid email and password." },
        { status: 400 },
      );
    const s = await createClient();
    const { data, error } = await s.auth.signInWithPassword(p.data);
    if (error)
      return NextResponse.json({ error: error.message }, { status: 401 });
    return NextResponse.json({
      user: { id: data.user.id, email: data.user.email },
      authenticated: true,
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message || "Unable to sign in." },
      { status: 500 },
    );
  }
}
