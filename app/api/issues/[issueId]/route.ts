import { NextResponse } from "next/server";
import { requireUser } from "@/lib/supabase/server";
import { z } from "zod";

const updateIssueSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().optional().nullable(),
  priority: z.enum(["urgent", "high", "medium", "low", "none"]).optional(),
  state: z.enum(["backlog", "todo", "in_progress", "done", "canceled"]).optional(),
  cycle_id: z.string().uuid().optional().nullable(),
  module_id: z.string().uuid().optional().nullable(),
  parent_issue_id: z.string().uuid().optional().nullable(),
  estimate_points: z.number().int().min(0).max(100).optional().nullable(),
  assignee_id: z.string().uuid().optional().nullable(),
  due_date: z.string().optional().nullable(),
  label_ids: z.array(z.string().uuid()).optional(),
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
        cycle:cycles!cycle_id(id, name, status),
        module:modules!module_id(id, name, status),
        issue_labels(label:labels(id, name, color, description)),
        subtasks:issues!parent_issue_id(id, sequence_id, title, state, priority, assignee:profiles!assignee_id(id, name, full_name, avatar_url))
      `)
      .eq("id", issueId)
      .single();

    if (error) throw error;

    // Flatten labels for convenience
    const labels = (data.issue_labels || [])
      .map((il: any) => il.label)
      .filter(Boolean);

    const subtasks = data.subtasks || [];
    const completedSubtasks = subtasks.filter((s: any) => s.state === "done").length;

    return NextResponse.json({
      ...data,
      labels,
      subtasks,
      subtask_count: {
        total: subtasks.length,
        completed: completedSubtasks,
      },
    });
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
    const { supabase, user } = await requireUser();

    const body = await req.json().catch(() => null);
    const parsed = updateIssueSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { label_ids, ...updateFields } = parsed.data;

    // Fetch existing issue to track changes for audit log
    const { data: currentIssue } = await supabase
      .from("issues")
      .select("title, state, priority, cycle_id, module_id, estimate_points, assignee_id, due_date")
      .eq("id", issueId)
      .maybeSingle();

    const { data, error } = await supabase
      .from("issues")
      .update({
        ...updateFields,
        updated_at: new Date().toISOString(),
      })
      .eq("id", issueId)
      .select(`
        *,
        assignee:profiles!assignee_id(id, name, full_name, username, avatar_url),
        created_by_profile:profiles!created_by(id, name, full_name, username, avatar_url),
        cycle:cycles!cycle_id(id, name, status),
        module:modules!module_id(id, name, status),
        issue_labels(label:labels(id, name, color, description)),
        subtasks:issues!parent_issue_id(id, sequence_id, title, state, priority)
      `)
      .single();

    if (error) throw error;

    // Record audit activities
    if (currentIssue) {
      const activities: any[] = [];
      const trackableKeys = ["state", "priority", "title", "estimate_points", "due_date", "cycle_id", "module_id", "assignee_id"] as const;
      for (const key of trackableKeys) {
        if (key in updateFields && updateFields[key as keyof typeof updateFields] !== undefined) {
          const oldVal = (currentIssue as any)[key];
          const newVal = (updateFields as any)[key];
          if (String(oldVal ?? "") !== String(newVal ?? "")) {
            activities.push({
              issue_id: issueId,
              actor_id: user.id,
              field: key,
              old_value: oldVal !== null && oldVal !== undefined ? String(oldVal) : null,
              new_value: newVal !== null && newVal !== undefined ? String(newVal) : null,
            });
          }
        }
      }
      if (activities.length > 0) {
        try {
          await supabase.from("issue_activities").insert(activities);
        } catch {
          // Non-blocking audit insert
        }
      }
    }

    // If label_ids was explicitly provided, replace issue labels
    if (label_ids !== undefined) {
      await supabase.from("issue_labels").delete().eq("issue_id", issueId);
      if (label_ids.length > 0) {
        await supabase.from("issue_labels").insert(
          label_ids.map((lid) => ({ issue_id: issueId, label_id: lid }))
        );
      }
    }

    const labels = (data.issue_labels || [])
      .map((il: any) => il.label)
      .filter(Boolean);
    const subtasks = data.subtasks || [];
    const completedSubtasks = subtasks.filter((s: any) => s.state === "done").length;

    return NextResponse.json({
      ...data,
      labels,
      subtasks,
      subtask_count: {
        total: subtasks.length,
        completed: completedSubtasks,
      },
    });
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
