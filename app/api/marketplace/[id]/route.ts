import { NextResponse } from "next/server";
import { requireUser } from "@/lib/supabase/server";
import { z } from "zod";
const schema = z.object({
  title: z.string().min(3).max(140).optional(),
  description: z
    .string()
    .refine(
      (v) => v.trim().split(/\s+/).length >= 30,
      "Description must be at least 30 words",
    )
    .optional(),
  skills: z.array(z.string()).min(1).max(20).optional(),
  pricing_note: z.string().max(200).nullable().optional(),
  availability: z.string().max(120).nullable().optional(),
  status: z.enum(["ACTIVE", "PAUSED"]).optional(),
});
export async function PATCH(
  r: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params,
      { supabase, user } = await requireUser(),
      p = schema.parse(await r.json());
    const { data, error } = await supabase
      .from("marketplace_services")
      .update({ ...p, updated_at: new Date().toISOString() })
      .eq("id", id)
      .eq("provider_id", user.id)
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
      .from("marketplace_services")
      .delete()
      .eq("id", id)
      .eq("provider_id", user.id);
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
