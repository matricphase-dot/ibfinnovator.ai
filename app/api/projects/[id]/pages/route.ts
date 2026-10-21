import { NextResponse } from "next/server";
import { requireUser } from "@/lib/supabase/server";
import { z } from "zod";

const createPageSchema = z.object({
  title: z.string().min(1, "Title is required").max(255).default("Untitled Document"),
  content_markdown: z.string().default(""),
  content_json: z.record(z.any()).default({}),
  is_favorite: z.boolean().default(false),
});

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;
    const { supabase } = await requireUser();

    const { data, error } = await supabase
      .from("pages")
      .select(`
        *,
        author:profiles!created_by(id, name, full_name, username, avatar_url)
      `)
      .eq("project_id", projectId)
      .order("updated_at", { ascending: false });

    if (error) throw error;
    return NextResponse.json(data || []);
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to fetch pages" },
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

    const body = await req.json().catch(() => ({}));
    const parsed = createPageSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("pages")
      .insert({
        project_id: projectId,
        created_by: user.id,
        title: parsed.data.title || "Untitled Document",
        content_markdown: parsed.data.content_markdown || "",
        content_json: parsed.data.content_json || {},
        is_favorite: parsed.data.is_favorite || false,
      })
      .select(`
        *,
        author:profiles!created_by(id, name, full_name, username, avatar_url)
      `)
      .single();

    if (error) throw error;
    return NextResponse.json(data, { status: 201 });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to create page" },
      { status: err.message === "UNAUTHORIZED" ? 401 : 500 }
    );
  }
}
