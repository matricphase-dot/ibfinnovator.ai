import { NextResponse } from "next/server";
import { requireUser } from "@/lib/supabase/server";
import { z } from "zod";

const createIssueSchema = z.object({
  title: z.string().min(1, "Title is required").max(255),
  description: z.string().optional().nullable(),
  priority: z.enum(["urgent", "high", "medium", "low", "none"]).default("none"),
  state: z.enum(["backlog", "todo", "in_progress", "done", "canceled"]).default("backlog"),
  cycle_id: z.string().uuid().optional().nullable(),
  assignee_id: z.string().uuid().optional().nullable(),
  due_date: z.string().optional().nullable(),
});

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;
    const { supabase } = await requireUser();
    const { searchParams } = new URL(req.url);

    const cycleId = searchParams.get("cycle_id");
    const state = searchParams.get("state");
    const priority = searchParams.get("priority");

    let query = supabase
      .from("issues")
      .select(`
        *,
        assignee:profiles!assignee_id(id, name, full_name, username, avatar_url),
        created_by_profile:profiles!created_by(id, name, full_name, username, avatar_url),
        cycle:cycles!cycle_id(id, name, status)
      `)
      .eq("project_id", projectId)
      .order("sequence_id", { ascending: false });

    if (cycleId) query = query.eq("cycle_id", cycleId);
    if (state) query = query.eq("state", state);
    if (priority) query = query.eq("priority", priority);

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json(data || []);
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to fetch issues" },
      { status: err.message === "UNAUTHORIZED" ? 401 : 500 }
    );
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;
    const { supabase, user } = await requireUser();

    const body = await req.json().catch(() => null);
    const parsed = createIssueSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("issues")
      .insert({
        project_id: projectId,
        title: parsed.data.title,
        description: parsed.data.description,
        priority: parsed.data.priority,
        state: parsed.data.state,
        cycle_id: parsed.data.cycle_id,
        assignee_id: parsed.data.assignee_id,
        due_date: parsed.data.due_date || null,
        created_by: user.id,
      })
      .select(`
        *,
        assignee:profiles!assignee_id(id, name, full_name, username, avatar_url),
        created_by_profile:profiles!created_by(id, name, full_name, username, avatar_url),
        cycle:cycles!cycle_id(id, name, status)
      `)
      .single();

    if (error) throw error;

    return NextResponse.json(data, { status: 201 });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to create issue" },
      { status: err.message === "UNAUTHORIZED" ? 401 : 500 }
    );
  }
}
