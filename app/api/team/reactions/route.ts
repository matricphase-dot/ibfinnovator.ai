import { NextResponse } from "next/server";
import { requireUser } from "@/lib/supabase/server";
import { z } from "zod";
const ALLOWED = ["👍", "❤️", "🔥", "👏", "🚀"] as const;
const schema = z.object({
  message_id: z.string().uuid(),
  emoji: z.enum(ALLOWED),
});
export async function POST(r: Request) {
  try {
    const { supabase, user } = await requireUser();
    const p = schema.safeParse(await r.json());
    if (!p.success)
      return NextResponse.json({ error: "Invalid reaction" }, { status: 400 });
    // ROOT FIX M4: verify reactor can actually READ the message — kills
    // private-message probing via timing (404 vs 200) and cross-room spam.
    const { data: message } = await supabase
      .from("messages")
      .select("id,sender_id,recipient_id,room_id,room_type")
      .eq("id", p.data.message_id)
      .maybeSingle();
    if (!message)
      return NextResponse.json({ error: "Message not found" }, { status: 404 });
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
      return NextResponse.json({ error: "Message not found" }, { status: 404 });
    const { data: old } = await supabase
      .from("message_reactions")
      .select("*")
      .eq("message_id", p.data.message_id)
      .eq("user_id", user.id)
      .eq("emoji", p.data.emoji)
      .maybeSingle();
    if (old) {
      await supabase
        .from("message_reactions")
        .delete()
        .eq("message_id", p.data.message_id)
        .eq("user_id", user.id)
        .eq("emoji", p.data.emoji);
      return NextResponse.json({ active: false });
    }
    const { error } = await supabase
      .from("message_reactions")
      .insert({
        message_id: p.data.message_id,
        emoji: p.data.emoji,
        user_id: user.id,
      });
    if (error) throw error;
    return NextResponse.json({ active: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
