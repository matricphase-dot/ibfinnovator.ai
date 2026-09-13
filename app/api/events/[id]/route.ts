import { NextResponse } from "next/server";
import { requireUser } from "@/lib/supabase/server";
import { z } from "zod";
const update = z.object({
  title: z.string().min(3).max(160).optional(),
  description: z.string().max(3000).nullable().optional(),
  event_type: z.enum(["EVENT", "AMA", "WORKSHOP", "DEMO_DAY"]).optional(),
  starts_at: z.string().datetime().optional(),
  ends_at: z.string().datetime().nullable().optional(),
  location: z.string().max(500).nullable().optional(),
  capacity: z.number().int().positive().nullable().optional(),
  status: z.enum(["PUBLISHED", "CANCELLED", "COMPLETED"]).optional(),
});
export async function PATCH(
  r: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params,
      { supabase, user } = await requireUser(),
      p = update.parse(await r.json());
    const { data, error } = await supabase
      .from("community_events")
      .update(p)
      .eq("id", id)
      .eq("host_id", user.id)
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
    const { error } = await supabase
      .from("community_events")
      .delete()
      .eq("id", id)
      .eq("host_id", user.id);
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
