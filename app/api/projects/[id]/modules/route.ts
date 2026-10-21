import { NextResponse } from "next/server";
import { requireUser } from "@/lib/supabase/server";
import { z } from "zod";

const createModuleSchema = z.object({
  name: z.string().min(1, "Module name is required").max(100),
  description: z.string().optional().nullable(),
  status: z.enum(["planned", "in_progress", "completed", "paused", "canceled"]).default("planned"),
  start_date: z.string().optional().nullable(),
  target_date: z.string().optional().nullable(),
  lead_id: z.string().uuid().optional().nullable(),
});

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;
    const { supabase } = await requireUser();

    // Fetch modules with lead profile and issues count
    const { data: modules, error: modError } = await supabase
      .from("modules")
      .select(`
        *,
        lead:profiles!lead_id(id, name, full_name, username, avatar_url)
      `)
      .eq("project_id", projectId)
      .order("created_at", { ascending: false });

    if (modError) throw modError;

    // Fetch issue counts per module
    const { data: issues, error: issuesError } = await supabase
      .from("issues")
      .select("id, module_id, state")
      .eq("project_id", projectId)
      .not("module_id", "is", null);

    if (issuesError) throw issuesError;

    const countsMap = new Map<string, { total: number; completed: number }>();
    (issues || []).forEach((iss: any) => {
      if (!iss.module_id) return;
      const curr = countsMap.get(iss.module_id) || { total: 0, completed: 0 };
      curr.total += 1;
      if (iss.state === "done") {
        curr.completed += 1;
      }
      countsMap.set(iss.module_id, curr);
    });

    const enrichedModules = (modules || []).map((m: any) => {
      const stats = countsMap.get(m.id) || { total: 0, completed: 0 };
      return {
        ...m,
        issue_count: stats.total,
        completed_issue_count: stats.completed,
      };
    });

    return NextResponse.json(enrichedModules);
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to fetch modules" },
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
    const { supabase } = await requireUser();

    const body = await req.json().catch(() => null);
    const parsed = createModuleSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("modules")
      .insert({
        project_id: projectId,
        name: parsed.data.name,
        description: parsed.data.description || null,
        status: parsed.data.status,
        start_date: parsed.data.start_date || null,
        target_date: parsed.data.target_date || null,
        lead_id: parsed.data.lead_id || null,
      })
      .select(`
        *,
        lead:profiles!lead_id(id, name, full_name, username, avatar_url)
      `)
      .single();

    if (error) throw error;
    return NextResponse.json(data, { status: 201 });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to create module" },
      { status: err.message === "UNAUTHORIZED" ? 401 : 500 }
    );
  }
}
