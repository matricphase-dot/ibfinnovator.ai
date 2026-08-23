import { NextResponse } from "next/server";
import { requireUser } from "@/lib/supabase/server";
import { z } from "zod";
const report = z.object({
  action: z.literal("REPORT"),
  reported_user_id: z.string().uuid().optional(),
  project_id: z.string().uuid().optional(),
  message_id: z.string().uuid().optional(),
  reason: z.string().min(3).max(120),
  details: z.string().max(2000).optional(),
});
const block = z.object({
  action: z.enum(["BLOCK", "UNBLOCK"]),
  blocked_id: z.string().uuid(),
});
export async function POST(r: Request) {
  try {
    const { supabase, user } = await requireUser(),
      body = await r.json();
    if (body.action === "REPORT") {
      const p = report.parse(body);
      const { action, ...row } = p;
      const { data, error } = await supabase
        .from("reports")
        .insert({ ...row, reporter_id: user.id })
        .select()
        .single();
      if (error) throw error;
      return NextResponse.json(data, { status: 201 });
    }
    const p = block.parse(body);
    if (p.action === "UNBLOCK") {
      await supabase
        .from("user_blocks")
        .delete()
        .eq("blocker_id", user.id)
        .eq("blocked_id", p.blocked_id);
      return NextResponse.json({ blocked: false });
    }
    const { error } = await supabase
      .from("user_blocks")
      .upsert({ blocker_id: user.id, blocked_id: p.blocked_id });
    if (error) throw error;
    return NextResponse.json({ blocked: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
