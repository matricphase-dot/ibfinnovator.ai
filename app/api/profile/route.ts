import { NextResponse } from "next/server";
import { requireUser } from "@/lib/supabase/server";
import {
  safeHttpsUrlNullableSchema,
  safeHttpsUrlSchema,
} from "@/lib/security/url";
import { z } from "zod";

const usernameSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(3)
  .max(30)
  .regex(
    /^[a-z0-9_]+$/,
    "Username may contain only lowercase letters, numbers, and underscores",
  );
const update = z.object({
  name: z.string().min(2).optional(),
  username: usernameSchema.optional(),
  // ROOT FIX M5: https-only — bare z.string().url() accepts javascript:/data:.
  avatar_url: safeHttpsUrlNullableSchema(),
  bio: z.string().max(2000).nullable().optional(),
  skills: z.array(z.string()).max(30).optional(),
  interests: z.array(z.string()).max(30).optional(),
  portfolio_urls: z.array(safeHttpsUrlSchema()).max(20).optional(),
  availability: z.string().nullable().optional(),
  engagement_preferences: z.array(z.string()).optional(),
  company: z.string().nullable().optional(),
  goals: z.string().nullable().optional(),
  is_cofounder: z.boolean().optional(),
  investor_visible: z.boolean().optional(),
  investor_pitch: z.string().max(3000).nullable().optional(),
  email_opt_in: z.boolean().optional(),
});
export async function GET() {
  try {
    const { supabase, user } = await requireUser();
    // Safely update last_seen_at using user's authenticated context without blocking response
    void Promise.resolve(supabase.rpc("touch_current_profile")).catch(() => {});

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();
    if (error) throw error;
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json(
      {
        error:
          e.message === "PROFILE_NOT_FOUND"
            ? "Profile not found"
            : "Authentication required",
      },
      { status: e.message === "PROFILE_NOT_FOUND" ? 404 : 401 },
    );
  }
}
export async function PATCH(r: Request) {
  try {
    const { supabase, user } = await requireUser();
    const p = update.safeParse(await r.json());
    if (!p.success)
      return NextResponse.json({ error: p.error.flatten() }, { status: 400 });
    if (
      p.data.investor_visible &&
      (!p.data.investor_pitch ||
        p.data.investor_pitch.trim().split(/\s+/).filter(Boolean).length < 50)
    )
      return NextResponse.json(
        { error: "Investor pitch must contain at least 50 words" },
        { status: 400 },
      );
    if (p.data.username) {
      const { data: taken, error: lookupError } = await supabase
        .from("profiles")
        .select("id")
        .ilike("username", p.data.username)
        .neq("id", user.id)
        .limit(1)
        .maybeSingle();
      if (lookupError) throw lookupError;
      if (taken)
        return NextResponse.json(
          { error: "Username already taken" },
          { status: 409 },
        );
    }
    const { data, error } = await supabase
      .from("profiles")
      .update({ ...p.data, updated_at: new Date().toISOString() })
      .eq("id", user.id)
      .select()
      .single();
    if (error) {
      if (error.code === "23505")
        return NextResponse.json(
          { error: "Username already taken" },
          { status: 409 },
        );
      throw error;
    }
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message || "Unable to update profile" },
      { status: e.message === "UNAUTHORIZED" ? 401 : 500 },
    );
  }
}
