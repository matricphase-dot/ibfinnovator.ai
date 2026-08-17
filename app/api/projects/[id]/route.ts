import { NextResponse } from "next/server";
import { createClient, requireUser } from "@/lib/supabase/server";
import { z } from "zod";
const update = z.object({
  title: z.string().min(3).max(120).optional(),
  description: z.string().min(20).max(10000).optional(),
  required_skills: z.array(z.string()).min(1).max(20).optional(),
  domain: z.string().nullable().optional(),
  stage: z.string().nullable().optional(),
  problem_statement: z.string().nullable().optional(),
  solution_overview: z.string().nullable().optional(),
  engagement_type: z.string().nullable().optional(),
  commitment_hours: z.number().int().min(1).max(80).nullable().optional(),
  duration_weeks: z.number().int().min(1).max(260).nullable().optional(),
  status: z.enum(["OPEN", "CLOSED", "COMPLETED"]).optional(),
});
export async function GET(
  _: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const s = await createClient();
  const { data, error } = await s
    .from("projects")
    .select(
      "*,founder:profiles!founder_id(id,name,avatar_url,bio,company,average_rating,endorsement_count),milestones(*)",
    )
    .eq("id", id)
    .single();
  if (error)
    return NextResponse.json(
      {
        error: error.code === "PGRST116" ? "Project not found" : error.message,
      },
      { status: error.code === "PGRST116" ? 404 : 500 },
    );
  return NextResponse.json(data);
}
export async function PATCH(
  r: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params,
      { supabase, user } = await requireUser();
    const p = update.safeParse(await r.json());
    if (!p.success)
      return NextResponse.json({ error: p.error.flatten() }, { status: 400 });
    const { data, error } = await supabase
      .from("projects")
      .update({ ...p.data, updated_at: new Date().toISOString() })
      .eq("id", id)
      .eq("founder_id", user.id)
      .select()
      .single();
    if (error) throw error;
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message },
      { status: e.message === "UNAUTHORIZED" ? 401 : 403 },
    );
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
      .from("projects")
      .delete()
      .eq("id", id)
      .eq("founder_id", user.id);
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message },
      { status: e.message === "UNAUTHORIZED" ? 401 : 403 },
    );
  }
}
