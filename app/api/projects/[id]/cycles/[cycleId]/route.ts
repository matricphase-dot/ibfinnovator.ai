import { NextResponse } from "next/server";
import { requireUser } from "@/lib/supabase/server";
import { z } from "zod";

const updateCycleSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().optional().nullable(),
  start_date: z.string().optional().nullable(),
  end_date: z.string().optional().nullable(),
  status: z.enum(["planned", "active", "completed"]).optional(),
  // Completion wizard parameters
  incomplete_action: z.enum(["next", "backlog"]).optional(),
  next_cycle_id: z.string().uuid().optional().nullable(),
});

export async function GET(
  _: Request,
  { params }: { params: Promise<{ id: string; cycleId: string }> }
) {
  try {
    const { id: projectId, cycleId } = await params;
    const { supabase } = await requireUser();

    const { data: cycle, error: cycleErr } = await supabase
      .from("cycles")
      .select("*, issues(id, sequence_id, title, state, priority, estimate_points, assignee:profiles!assignee_id(id, name, full_name, avatar_url))")
      .eq("id", cycleId)
      .eq("project_id", projectId)
      .single();

    if (cycleErr || !cycle) {
      return NextResponse.json({ error: "Cycle not found" }, { status: 404 });
    }

    const issues = cycle.issues || [];
    const totalIssues = issues.length;
    const completedIssues = issues.filter((i: any) => i.state === "done").length;
    const inProgressIssues = issues.filter((i: any) => i.state === "in_progress").length;
    const todoIssues = issues.filter((i: any) => i.state === "todo" || i.state === "backlog").length;

    const totalPoints = issues.reduce((acc: number, i: any) => acc + (i.estimate_points || 0), 0);
    const completedPoints = issues
      .filter((i: any) => i.state === "done")
      .reduce((acc: number, i: any) => acc + (i.estimate_points || 0), 0);

    return NextResponse.json({
      ...cycle,
      stats: {
        total_issues: totalIssues,
        completed_issues: completedIssues,
        in_progress_issues: inProgressIssues,
        todo_issues: todoIssues,
        completion_percent: totalIssues > 0 ? Math.round((completedIssues / totalIssues) * 100) : 0,
        total_points: totalPoints,
        completed_points: completedPoints,
        points_percent: totalPoints > 0 ? Math.round((completedPoints / totalPoints) * 100) : 0,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to fetch cycle" },
      { status: err.message === "UNAUTHORIZED" ? 401 : 500 }
    );
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string; cycleId: string }> }
) {
  try {
    const { id: projectId, cycleId } = await params;
    const { supabase } = await requireUser();

    const body = await req.json().catch(() => null);
    const parsed = updateCycleSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { incomplete_action, next_cycle_id, ...cycleUpdates } = parsed.data;

    // Rule: Only one cycle can be active at a time per project
    if (cycleUpdates.status === "active") {
      await supabase
        .from("cycles")
        .update({ status: "planned", updated_at: new Date().toISOString() })
        .eq("project_id", projectId)
        .eq("status", "active")
        .neq("id", cycleId);
    }

    // Handle end-of-sprint wizard (rollover incomplete tasks)
    if (cycleUpdates.status === "completed" && incomplete_action) {
      // Find incomplete issues in this cycle (exclude terminal states: done and canceled)
      const { data: incompleteIssues } = await supabase
        .from("issues")
        .select("id")
        .eq("cycle_id", cycleId)
        .not("state", "in", '("done","canceled")');

      const incompleteIds = (incompleteIssues || []).map((i) => i.id);

      if (incompleteIds.length > 0) {
        if (incomplete_action === "next" && next_cycle_id) {
          // Move incomplete issues to next cycle
          await supabase
            .from("issues")
            .update({ cycle_id: next_cycle_id, updated_at: new Date().toISOString() })
            .in("id", incompleteIds);
        } else if (incomplete_action === "backlog") {
          // Return incomplete issues to backlog (null cycle)
          await supabase
            .from("issues")
            .update({ cycle_id: null, updated_at: new Date().toISOString() })
            .in("id", incompleteIds);
        }
      }
    }

    // Update cycle
    const { data: updatedCycle, error } = await supabase
      .from("cycles")
      .update({
        ...cycleUpdates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", cycleId)
      .eq("project_id", projectId)
      .select("*, issues(id, sequence_id, title, state, priority, estimate_points)")
      .single();

    if (error) throw error;

    return NextResponse.json(updatedCycle);
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to update cycle" },
      { status: err.message === "UNAUTHORIZED" ? 401 : 500 }
    );
  }
}

export async function DELETE(
  _: Request,
  { params }: { params: Promise<{ id: string; cycleId: string }> }
) {
  try {
    const { id: projectId, cycleId } = await params;
    const { supabase } = await requireUser();

    // Detach any issues from this cycle first
    await supabase
      .from("issues")
      .update({ cycle_id: null, updated_at: new Date().toISOString() })
      .eq("cycle_id", cycleId);

    const { error } = await supabase
      .from("cycles")
      .delete()
      .eq("id", cycleId)
      .eq("project_id", projectId);

    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to delete cycle" },
      { status: err.message === "UNAUTHORIZED" ? 401 : 500 }
    );
  }
}
