import { NextResponse } from "next/server";
import { requireUser } from "@/lib/supabase/server";
import { z } from "zod";

const createIssueSchema = z.object({
  title: z.string().min(1, "Title is required").max(255),
  description: z.string().optional().nullable(),
  priority: z.enum(["urgent", "high", "medium", "low", "none"]).default("none"),
  state: z.enum(["backlog", "todo", "in_progress", "done", "canceled"]).default("backlog"),
  cycle_id: z.string().uuid().optional().nullable(),
  module_id: z.string().uuid().optional().nullable(),
  parent_issue_id: z.string().uuid().optional().nullable(),
  estimate_points: z.number().int().min(0).max(100).optional().nullable(),
  assignee_id: z.string().uuid().optional().nullable(),
  due_date: z.string().optional().nullable(),
  label_ids: z.array(z.string().uuid()).optional().default([]),
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
    const moduleId = searchParams.get("module_id");
    const state = searchParams.get("state");
    const priority = searchParams.get("priority");

    const parentId = searchParams.get("parent_issue_id");

    let query = supabase
      .from("issues")
      .select(`
        *,
        assignee:profiles!assignee_id(id, name, full_name, username, avatar_url),
        created_by_profile:profiles!created_by(id, name, full_name, username, avatar_url),
        cycle:cycles!cycle_id(id, name, status),
        module:modules!module_id(id, name, status),
        issue_labels(label:labels(id, name, color, description)),
        subtasks:issues!parent_issue_id(id, sequence_id, title, state, priority)
      `)
      .eq("project_id", projectId)
      .order("sequence_id", { ascending: false });

    if (parentId !== undefined && parentId !== null) {
      if (parentId === "null" || parentId === "") {
        query = query.is("parent_issue_id", null);
      } else {
        query = query.eq("parent_issue_id", parentId);
      }
    } else {
      // By default for board/list, only return top-level issues
      query = query.is("parent_issue_id", null);
    }

    if (cycleId) query = query.eq("cycle_id", cycleId);
    if (moduleId) query = query.eq("module_id", moduleId);
    if (state) query = query.eq("state", state);
    if (priority) query = query.eq("priority", priority);

    const { data, error } = await query;
    if (error) throw error;

    // Flatten labels and calculate subtask metrics
    const formattedData = (data || []).map((issue: any) => {
      const labels = (issue.issue_labels || [])
        .map((il: any) => il.label)
        .filter(Boolean);
      const subtasks = issue.subtasks || [];
      const completedSubtasks = subtasks.filter((s: any) => s.state === "done").length;
      return {
        ...issue,
        labels,
        subtasks,
        subtask_count: {
          total: subtasks.length,
          completed: completedSubtasks,
        },
      };
    });

    return NextResponse.json(formattedData);
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
        cycle_id: parsed.data.cycle_id || null,
        module_id: parsed.data.module_id || null,
        parent_issue_id: parsed.data.parent_issue_id || null,
        estimate_points: parsed.data.estimate_points ?? null,
        assignee_id: parsed.data.assignee_id || null,
        due_date: parsed.data.due_date || null,
        created_by: user.id,
      })
      .select(`
        *,
        assignee:profiles!assignee_id(id, name, full_name, username, avatar_url),
        created_by_profile:profiles!created_by(id, name, full_name, username, avatar_url),
        cycle:cycles!cycle_id(id, name, status),
        module:modules!module_id(id, name, status)
      `)
      .single();

    if (error) throw error;

    // Associate labels if provided
    if (parsed.data.label_ids && parsed.data.label_ids.length > 0) {
      const labelInserts = parsed.data.label_ids.map((lid) => ({
        issue_id: data.id,
        label_id: lid,
      }));
      await supabase.from("issue_labels").insert(labelInserts);
    }

    return NextResponse.json(
      {
        ...data,
        labels: [],
        subtasks: [],
        subtask_count: {
          total: 0,
          completed: 0,
        },
      },
      { status: 201 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to create issue" },
      { status: err.message === "UNAUTHORIZED" ? 401 : 500 }
    );
  }
}
