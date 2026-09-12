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
    // Only room members (or the project founder) may post in a team room.
    const { data: room } = await supabase
      .from("team_rooms")
      .select("id,project:projects(founder_id)")
      .eq("id", p.room_id)
      .single();
    const founderId =
      (room as any)?.project?.founder_id ?? (room as any)?.project?.[0]?.founder_id;
    if (!room) throw new Error("Team room not found");
    if (founderId !== user.id) {
      const { count } = await supabase
        .from("team_members")
        .select("user_id", { count: "exact", head: true })
        .eq("room_id", p.room_id)
        .eq("user_id", user.id);
      if (!count)
        return NextResponse.json(
          { error: "Team membership required." },
          { status: 403 },
        );
    }
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
export async function PATCH(r: Request) {
  try {
    const { supabase, user } = await requireUser();
    const p = z
      .object({
        id: z.string().uuid(),
        pinned: z.boolean().optional(),
        content: z.string().trim().min(1).max(5000).optional(),
      })
      .parse(await r.json());
    // Only the sender or a member of the team room may edit/pin a message.
    const { data: message } = await supabase
      .from("messages")
      .select("sender_id,room_id,room_type")
      .eq("id", p.id)
      .maybeSingle();
    if (!message)
      return NextResponse.json({ error: "Message not found" }, { status: 404 });
    if (message.sender_id !== user.id) {
      const { count } = await supabase
        .from("team_members")
        .select("user_id", { count: "exact", head: true })
        .eq("room_id", message.room_id)
        .eq("user_id", user.id);
      if (!count)
        return NextResponse.json(
          { error: "You can only edit your own messages." },
          { status: 403 },
        );
    }
    const { data, error } = await supabase
      .from("messages")
      .update(p)
      .eq("id", p.id)
      .select()
      .single();
    if (error) throw error;
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
