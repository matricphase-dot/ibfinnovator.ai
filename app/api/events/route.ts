import { NextResponse } from "next/server";
import { createClient, requireUser } from "@/lib/supabase/server";
import { z } from "zod";
export async function GET() {
  const s = await createClient();
  const { data, error } = await s
    .from("community_events")
    .select(
      "*,host:profiles!host_id(id,name,avatar_url),attendees:event_attendees(count)",
    )
    .eq("status", "PUBLISHED")
    .gte("starts_at", new Date().toISOString())
    .order("starts_at");
  return error
    ? NextResponse.json({ error: error.message }, { status: 500 })
    : NextResponse.json(data || []);
}
export async function POST(r: Request) {
  try {
    const { supabase, user } = await requireUser(),
      p = z
        .object({
          title: z.string().min(3).max(160),
          description: z.string().max(3000).optional(),
          event_type: z
            .enum(["EVENT", "AMA", "WORKSHOP", "DEMO_DAY"])
            .default("EVENT"),
          starts_at: z.string().datetime(),
          ends_at: z.string().datetime().optional(),
          location: z.string().max(500).optional(),
          capacity: z.number().int().positive().optional(),
        })
        .parse(await r.json());
    const { data, error } = await supabase
      .from("community_events")
      .insert({ ...p, host_id: user.id })
      .select()
      .single();
    if (error) throw error;
    return NextResponse.json(data, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
export async function PATCH(r: Request) {
  try {
    const { supabase, user } = await requireUser(),
      p = z
        .object({
          event_id: z.string().uuid(),
          status: z.enum(["GOING", "INTERESTED", "CANCELLED"]),
        })
        .parse(await r.json());
    const { data, error } = await supabase
      .from("event_attendees")
      .upsert({ event_id: p.event_id, user_id: user.id, status: p.status })
      .select()
      .single();
    if (error) throw error;
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
