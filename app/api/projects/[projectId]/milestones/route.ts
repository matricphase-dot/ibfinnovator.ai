import { NextResponse } from "next/server";
import { createClient, requireUser } from "@/lib/supabase/server";
import { z } from "zod";
const input = z.object({
  title: z.string().min(2).max(160),
  description: z.string().max(1500).optional(),
  due_date: z.string().datetime().optional(),
  assigned_to: z.string().uuid().optional(),
  sort_order: z.number().int().default(0),
});
export async function GET(
  _: Request,
  { params }: { params: Promise<{ projectId: string }> },
) {
  const { projectId } = await params,
    s = await createClient();
  const { data, error } = await s
    .from("milestones")
    .select("*,assignee:profiles!assigned_to(id,name,avatar_url)")
    .eq("project_id", projectId)
    .order("sort_order");
  return error
    ? NextResponse.json({ error: error.message }, { status: 500 })
    : NextResponse.json(data || []);
}
export async function POST(
  r: Request,
  { params }: { params: Promise<{ projectId: string }> },
) {
  try {
    const { projectId } = await params,
      { supabase, user } = await requireUser();
    const p = input.safeParse(await r.json());
    if (!p.success)
      return NextResponse.json({ error: p.error.flatten() }, { status: 400 });
    const { data: project } = await supabase
      .from("projects")
      .select("founder_id")
      .eq("id", projectId)
      .single();
    if (project?.founder_id !== user.id)
      return NextResponse.json(
        { error: "Only the founder can create milestones." },
        { status: 403 },
      );
    const { data, error } = await supabase
      .from("milestones")
      .insert({ ...p.data, project_id: projectId })
      .select()
      .single();
    if (error) throw error;
    return NextResponse.json(data, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
