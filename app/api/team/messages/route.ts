import { NextResponse } from "next/server";
import { requireUser } from "@/lib/supabase/server";
import { z } from "zod";
const schema = z.object({
  room_id: z.string().uuid(),
  channel: z.string().max(80).default("General"),
  content: z.string().trim().min(1).max(5000),
  parent_id: z.string().uuid().optional(),
  attachments: z.array(z.string().url()).max(10).default([]),
});
export async function POST(r: Request) {
  try {
    const { supabase, user } = await requireUser();
    const p = schema.parse(await r.json());
    const { data, error } = await supabase
      .from("messages")
      .insert({
        room_id: p.room_id,
        sender_id: user.id,
        room_type: "TEAM",
        channel: p.channel,
        content: p.content,
        parent_id: p.parent_id,
        attachments: p.attachments,
      })
      .select("*,sender:profiles!sender_id(id,name,avatar_url)")
      .single();
    if (error) throw error;
    return NextResponse.json(data, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
