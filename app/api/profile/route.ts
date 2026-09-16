import { NextResponse } from "next/server";
import { requireUser } from "@/lib/supabase/server";
import { z } from "zod";

const update = z.object({
  name: z.string().min(2).optional(),
  bio: z.string().max(2000).nullable().optional(),
  skills: z.array(z.string()).max(30).optional(),
  interests: z.array(z.string()).max(30).optional(),
  portfolio_urls: z.array(z.string().url()).max(20).optional(),
  availability: z.string().nullable().optional(),
  engagement_preferences: z.array(z.string()).optional(),
  company: z.string().nullable().optional(),
  goals: z.string().nullable().optional(),
  is_cofounder: z.boolean().optional(),
  avatar_url: z.string().url().nullable().optional(),
  // Investor visibility (batch 7). The pitch itself may be saved at any length
  // as a draft; the 50-word rule applies only when the toggle goes on.
  investor_visible: z.boolean().optional(),
  investor_pitch: z.string().max(4000).nullable().optional(),
});

function wordCount(value: string) {
  return value.trim().split(/\s+/).filter(Boolean).length;
}

export async function GET() {
  try {
    const { supabase, user } = await requireUser();
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();
    if (error) throw error;
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }
}

export async function PATCH(r: Request) {
  try {
    const { supabase, user } = await requireUser();
    const p = update.safeParse(await r.json());
    if (!p.success)
      return NextResponse.json({ error: p.error.flatten() }, { status: 400 });

    // Being listed in the investor directory with an empty card helps nobody, so
    // visibility requires a pitch of at least 50 words. When the request does
    // not carry a pitch we judge the stored one — an explicit null is honoured
    // and therefore never passes.
    if (p.data.investor_visible === true) {
      let pitch: string | null;
      if (p.data.investor_pitch === undefined) {
        const { data: current, error: readError } = await supabase
          .from("profiles")
          .select("investor_pitch")
          .eq("id", user.id)
          .maybeSingle();
        if (readError) {
          console.error("profiles select failed:", readError.message);
          return NextResponse.json(
            { error: "Unable to check your investor pitch." },
            { status: 500 },
          );
        }
        pitch = current?.investor_pitch ?? null;
      } else {
        pitch = p.data.investor_pitch;
      }

      if (wordCount(pitch ?? "") < 50) {
        return NextResponse.json(
          {
            error:
              "Add at least 50 words to your investor pitch before making it visible.",
          },
          { status: 400 },
        );
      }
    }

    const { data, error } = await supabase
      .from("profiles")
      .update({ ...p.data, updated_at: new Date().toISOString() })
      .eq("id", user.id)
      .select()
      .single();
    if (error) throw error;
    return NextResponse.json(data);
  } catch (e: any) {
    if (e?.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }
    console.error("profile PATCH failed:", e?.message);
    return NextResponse.json({ error: "Unable to save your profile." }, { status: 500 });
  }
}
