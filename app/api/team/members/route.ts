import { NextResponse } from "next/server";
import { requireUser } from "@/lib/supabase/server";
import { z } from "zod";
const schema = z.object({
  room_id: z.string().uuid(),
  user_id: z.string().uuid(),
  action: z.enum(["ADD", "REMOVE"]),
  role: z.enum(["ADMIN", "MEMBER", "OBSERVER"]).default("MEMBER"),
});
export async function POST(r: Request) {
  try {
    const { supabase, user } = await requireUser();
    const p = schema.parse(await r.json());
    const { data: room } = await supabase
      .from("team_rooms")
      .select("project:projects(founder_id)")
      .eq("id", p.room_id)
      .single();
    const owner =
      (room as any)?.project?.founder_id ??
      (room as any)?.project?.[0]?.founder_id;
    if (owner !== user.id)
      return NextResponse.json(
        { error: "Only the project founder can manage members." },
        { status: 403 },
      );
    if (p.action === "REMOVE") {
      if (p.user_id === user.id)
        return NextResponse.json(
          { error: "The founder cannot remove themselves." },
          { status: 400 },
        );
      await supabase
        .from("team_members")
        .delete()
        .eq("room_id", p.room_id)
        .eq("user_id", p.user_id);
      return NextResponse.json({ removed: true });
    }
    const { data, error } = await supabase
      .from("team_members")
      .upsert({ room_id: p.room_id, user_id: p.user_id, role: p.role })
      .select()
      .single();
    if (error) throw error;
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
