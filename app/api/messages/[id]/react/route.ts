import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/supabase/server";
const allowed = ["👍", "❤️", "🔥", "👏", "🚀"] as const;
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params,
      { supabase, user } = await requireUser();
    const { emoji } = z
      .object({ emoji: z.enum(allowed) })
      .parse(await req.json());
    const { data: message } = await supabase
      .from("messages")
      .select("id,sender_id,recipient_id,room_id,room_type")
      .eq("id", id)
      .maybeSingle();
    if (!message)
      return NextResponse.json(
        { error: "Message not found or unavailable" },
        { status: 404 },
      );
    // ROOT FIX M4: same read-access gate as team reactions — no oracle.
    let canRead = false;
    if (message.sender_id === user.id || message.recipient_id === user.id)
      canRead = true;
    else if (message.room_type === "GENERAL") canRead = true;
    else if (message.room_id) {
      const { data: access } = await supabase.rpc("can_access_team_room", {
        target_room: message.room_id,
      });
      canRead = access === true;
    }
    if (!canRead)
      return NextResponse.json(
        { error: "Message not found or unavailable" },
        { status: 404 },
      );
    const { data: existing } = await supabase
      .from("message_reactions")
      .select("message_id")
      .eq("message_id", id)
      .eq("user_id", user.id)
      .eq("emoji", emoji)
      .maybeSingle();
    let active = true;
    if (existing) {
      const { error } = await supabase
        .from("message_reactions")
        .delete()
        .eq("message_id", id)
        .eq("user_id", user.id)
        .eq("emoji", emoji);
      if (error) throw error;
      active = false;
    } else {
      const { error } = await supabase
        .from("message_reactions")
        .insert({ message_id: id, user_id: user.id, emoji });
      if (error) throw error;
    }
    const { count } = await supabase
      .from("message_reactions")
      .select("*", { count: "exact", head: true })
      .eq("message_id", id)
      .eq("emoji", emoji);
    return NextResponse.json({ active, count: count || 0 });
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message || "Reaction failed" },
      { status: e.message === "UNAUTHORIZED" ? 401 : 400 },
    );
  }
}
