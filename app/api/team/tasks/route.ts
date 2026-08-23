import { NextResponse } from "next/server";
import { requireUser } from "@/lib/supabase/server";
import { z } from "zod";
const create = z.object({
  room_id: z.string().uuid(),
  channel: z.string().max(80).default("General"),
  title: z.string().min(2).max(160),
  description: z.string().max(1500).optional(),
  assignee_id: z.string().uuid().optional(),
  due_at: z.string().datetime().optional(),
  status: z.enum(["TODO", "IN_PROGRESS", "DONE"]).default("TODO"),
});
export async function POST(r: Request) {
  try {
    const { supabase, user } = await requireUser();
    const p = create.parse(await r.json());
    const { data, error } = await supabase
      .from("team_tasks")
      .insert({ ...p, created_by: user.id })
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
    const { supabase } = await requireUser();
    const p = z
      .object({
        id: z.string().uuid(),
        status: z.enum(["TODO", "IN_PROGRESS", "DONE"]),
      })
      .parse(await r.json());
    const { data, error } = await supabase
      .from("team_tasks")
      .update({ status: p.status, updated_at: new Date().toISOString() })
      .eq("id", p.id)
      .select()
      .single();
    if (error) throw error;
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
