import { NextResponse } from "next/server";
import { requireUser } from "@/lib/supabase/server";
import { z } from "zod";

const updateIssueSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().optional().nullable(),
  priority: z.enum(["urgent", "high", "medium", "low", "none"]).optional(),
  state: z.enum(["backlog", "todo", "in_progress", "done", "canceled"]).optional(),
  cycle_id: z.string().uuid().optional().nullable(),
  assignee_id: z.string().uuid().optional().nullable(),
  due_date: z.string().optional().nullable(),
});

export async function GET(
  _: Request,
  { params }: { params: Promise<{ issueId: string }> }
) {
  try {
    const { issueId } = await params;
    const { supabase } = await requireUser();

    const { data, error } = await supabase
      .from("issues")
      .select(`
        *,
        assignee:profiles!assignee_id(id, name, full_name, username, avatar_url),
        created_by_profile:profiles!created_by(id, name, full_name, username, avatar_url),
        cycle:cycles!cycle_id(id, name, status)
      `)
      .eq("id", issueId)
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Issue not found" },
      { status: err.message === "UNAUTHORIZED" ? 401 : 404 }
    );
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ issueId: string }> }
) {
  try {
    const { issueId } = await params;
    const { supabase } = await requireUser();

    const body = await req.json().catch(() => null);
    const parsed = updateIssueSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("issues")
      .update({
        ...parsed.data,
        updated_at: new Date().toISOString(),
      })
      .eq("id", issueId)
      .select(`
        *,
        assignee:profiles!assignee_id(id, name, full_name, username, avatar_url),
        created_by_profile:profiles!created_by(id, name, full_name, username, avatar_url),
        cycle:cycles!cycle_id(id, name, status)
      `)
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to update issue" },
      { status: err.message === "UNAUTHORIZED" ? 401 : 500 }
    );
  }
}

export async function DELETE(
  _: Request,
  { params }: { params: Promise<{ issueId: string }> }
) {
  try {
    const { issueId } = await params;
    const { supabase } = await requireUser();

    const { error } = await supabase
      .from("issues")
      .delete()
      .eq("id", issueId);

    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to delete issue" },
      { status: err.message === "UNAUTHORIZED" ? 401 : 500 }
    );
  }
}
