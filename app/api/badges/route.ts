import { NextResponse } from "next/server";
import { requireUser } from "@/lib/supabase/server";
import { z } from "zod";
export async function GET() {
  try {
    const { supabase, user } = await requireUser();
    const [{ data: definitions }, { data: earned }] = await Promise.all([
      supabase.from("badge_definitions").select("*").eq("active", true),
      supabase
        .from("user_badges")
        .select(
          "*,badge:badge_definitions(*),project:projects(id,title),awarder:profiles!awarded_by(id,name)",
        )
        .eq("receiver_id", user.id)
        .order("created_at", { ascending: false }),
    ]);
    return NextResponse.json({
      definitions: definitions || [],
      earned: earned || [],
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 401 });
  }
}
export async function POST(r: Request) {
  try {
    const { supabase, user } = await requireUser();
    const p = z
      .object({
        badge_id: z.string().uuid(),
        receiver_id: z.string().uuid(),
        project_id: z.string().uuid(),
        evidence: z.string().min(10).max(2000),
      })
      .parse(await r.json());
    const { data, error } = await supabase
      .from("user_badges")
      .insert({ ...p, awarded_by: user.id })
      .select("*,badge:badge_definitions(*)")
      .single();
    if (error) throw error;
    await supabase
      .from("notifications")
      .insert({
        user_id: p.receiver_id,
        type: "BADGE_AWARDED",
        message: `You earned the ${data.badge.name} badge`,
        link: "/credentials",
      });
    return NextResponse.json(data, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
