import { NextResponse } from "next/server";
import { requireUser } from "@/lib/supabase/server";
import { z } from "zod";

const createLabelSchema = z.object({
  name: z.string().min(1, "Label name is required").max(60),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Must be a valid hex color code (e.g. #00f5d4)").default("#00f5d4"),
  description: z.string().max(255).optional().nullable(),
});

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;
    const { supabase } = await requireUser();

    const { data, error } = await supabase
      .from("labels")
      .select("*")
      .eq("project_id", projectId)
      .order("name", { ascending: true });

    if (error) throw error;
    return NextResponse.json(data || []);
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to fetch labels" },
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
    const parsed = createLabelSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("labels")
      .insert({
        project_id: projectId,
        name: parsed.data.name,
        color: parsed.data.color,
        description: parsed.data.description || null,
      })
      .select("*")
      .single();

    if (error) throw error;
    return NextResponse.json(data, { status: 201 });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to create label" },
      { status: err.message === "UNAUTHORIZED" ? 401 : 500 }
    );
  }
}
