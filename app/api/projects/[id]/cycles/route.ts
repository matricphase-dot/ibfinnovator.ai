import { NextResponse } from "next/server";
import { requireUser } from "@/lib/supabase/server";
import { z } from "zod";

const createCycleSchema = z.object({
  name: z.string().min(1, "Sprint name is required").max(100),
  description: z.string().optional().nullable(),
  start_date: z.string().optional().nullable(),
  end_date: z.string().optional().nullable(),
  status: z.enum(["planned", "active", "completed"]).default("planned"),
});

export async function GET(
  _: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;
    const { supabase } = await requireUser();

    const { data, error } = await supabase
      .from("cycles")
      .select("*, issues(id, state, priority)")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return NextResponse.json(data || []);
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to fetch cycles" },
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
    const parsed = createCycleSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("cycles")
      .insert({
        project_id: projectId,
        name: parsed.data.name,
        description: parsed.data.description,
        start_date: parsed.data.start_date || null,
        end_date: parsed.data.end_date || null,
        status: parsed.data.status,
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data, { status: 201 });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to create cycle" },
      { status: err.message === "UNAUTHORIZED" ? 401 : 500 }
    );
  }
}
