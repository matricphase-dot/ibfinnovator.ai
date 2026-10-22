import { NextResponse } from "next/server";
import { requireUser } from "@/lib/supabase/server";
import { z } from "zod";

const batchModuleIssuesSchema = z.object({
  issue_ids: z.array(z.string().uuid()).min(1, "At least one issue ID is required"),
  action: z.enum(["add", "remove"]).default("add"),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ moduleId: string }> }
) {
  try {
    const { moduleId } = await params;
    const { supabase } = await requireUser();

    const body = await req.json().catch(() => null);
    const parsed = batchModuleIssuesSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { issue_ids, action } = parsed.data;
    const targetModuleId = action === "add" ? moduleId : null;

    const { data, error } = await supabase
      .from("issues")
      .update({
        module_id: targetModuleId,
        updated_at: new Date().toISOString(),
      })
      .in("id", issue_ids)
      .select("id, sequence_id, title, state, priority, module_id");

    if (error) throw error;

    return NextResponse.json({
      success: true,
      action,
      module_id: targetModuleId,
      updated_issues: data || [],
      count: (data || []).length,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to batch update module issues" },
      { status: err.message === "UNAUTHORIZED" ? 401 : 500 }
    );
  }
}
