import { NextResponse } from "next/server";
import { requireUser } from "@/lib/supabase/server";
import { z } from "zod";
const update = z.object({
  title: z.string().min(2).max(160).optional(),
  description: z.string().max(1500).nullable().optional(),
  due_date: z.string().datetime().nullable().optional(),
  assigned_to: z.string().uuid().nullable().optional(),
  status: z.enum(["PENDING", "IN_PROGRESS", "COMPLETED"]).optional(),
  sort_order: z.number().int().optional(),
});
export async function PATCH(
  r: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params,
      { supabase, user } = await requireUser();
    const p = update.parse(await r.json());
    const { data: m } = await supabase
      .from("milestones")
      .select("project:projects(founder_id)")
      .eq("id", id)
      .single();
    const owner=(m as any)?.project?.founder_id ?? (m as any)?.project?.[0]?.founder_id;
    if (!m || owner !== user.id)
      return NextResponse.json(
        { error: "Only the founder can update this milestone." },
        { status: 403 },
      );
    const { data, error } = await supabase
      .from("milestones")
      .update({ ...p, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
export async function DELETE(
  _: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params,
      { supabase, user } = await requireUser();
    const { data: m } = await supabase
      .from("milestones")
      .select("project:projects(founder_id)")
      .eq("id", id)
      .single();
    const owner=(m as any)?.project?.founder_id ?? (m as any)?.project?.[0]?.founder_id;
    if (!m || owner !== user.id)
      return NextResponse.json(
        { error: "Only the founder can delete this milestone." },
        { status: 403 },
      );
    const { error } = await supabase.from("milestones").delete().eq("id", id);
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
