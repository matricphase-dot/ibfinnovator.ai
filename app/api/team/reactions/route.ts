import { NextResponse } from "next/server";
import { requireUser } from "@/lib/supabase/server";
import { z } from "zod";
const schema = z.object({
  message_id: z.string().uuid(),
  emoji: z.string().min(1).max(16),
});
export async function POST(r: Request) {
  try {
    const { supabase, user } = await requireUser();
    const p = schema.parse(await r.json());
    const { data: old } = await supabase
      .from("message_reactions")
      .select("*")
      .eq("message_id", p.message_id)
      .eq("user_id", user.id)
      .eq("emoji", p.emoji)
      .maybeSingle();
    if (old) {
      await supabase
        .from("message_reactions")
        .delete()
        .eq("message_id", p.message_id)
        .eq("user_id", user.id)
        .eq("emoji", p.emoji);
      return NextResponse.json({ active: false });
    }
    const { error } = await supabase
      .from("message_reactions")
      .insert({ ...p, user_id: user.id });
    if (error) throw error;
    return NextResponse.json({ active: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
