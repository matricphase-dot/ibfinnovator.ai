import { NextResponse } from "next/server";
import { requireUser } from "@/lib/supabase/server";
import { z } from "zod";

const updateModuleSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().optional().nullable(),
  status: z.enum(["planned", "in_progress", "completed", "paused", "canceled"]).optional(),
  start_date: z.string().optional().nullable(),
  target_date: z.string().optional().nullable(),
  lead_id: z.string().uuid().optional().nullable(),
});

export async function GET(
  _: Request,
  { params }: { params: Promise<{ id: string; moduleId: string }> }
) {
  try {
    const { id: projectId, moduleId } = await params;
    const { supabase } = await requireUser();

    const { data: moduleData, error } = await supabase
      .from("modules")
      .select(`
        *,
        lead:profiles!lead_id(id, name, full_name, username, avatar_url)
      `)
      .eq("id", moduleId)
      .eq("project_id", projectId)
      .single();

    if (error) throw error;

    // Fetch issues belonging to this module
    const { data: issues } = await supabase
      .from("issues")
      .select(`
        id,
        sequence_id,
        title,
        priority,
        state,
        due_date,
        assignee:profiles!assignee_id(id, name, full_name, username, avatar_url)
      `)
      .eq("module_id", moduleId)
      .order("sequence_id", { ascending: false });

    return NextResponse.json({
      ...moduleData,
      issues: issues || [],
      issue_count: (issues || []).length,
      completed_issue_count: (issues || []).filter((i: any) => i.state === "done").length,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Module not found" },
      { status: err.message === "UNAUTHORIZED" ? 401 : 404 }
    );
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string; moduleId: string }> }
) {
  try {
    const { id: projectId, moduleId } = await params;
    const { supabase } = await requireUser();

    const body = await req.json().catch(() => null);
    const parsed = updateModuleSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("modules")
      .update({
        ...parsed.data,
        updated_at: new Date().toISOString(),
      })
      .eq("id", moduleId)
      .eq("project_id", projectId)
      .select(`
        *,
        lead:profiles!lead_id(id, name, full_name, username, avatar_url)
      `)
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to update module" },
      { status: err.message === "UNAUTHORIZED" ? 401 : 500 }
    );
  }
}

export async function DELETE(
  _: Request,
  { params }: { params: Promise<{ id: string; moduleId: string }> }
) {
  try {
    const { id: projectId, moduleId } = await params;
    const { supabase } = await requireUser();

    // Detach any issues from this module first
    await supabase
      .from("issues")
      .update({ module_id: null, updated_at: new Date().toISOString() })
      .eq("module_id", moduleId);

    const { error } = await supabase
      .from("modules")
      .delete()
      .eq("id", moduleId)
      .eq("project_id", projectId);

    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to delete module" },
      { status: err.message === "UNAUTHORIZED" ? 401 : 500 }
    );
  }
}
