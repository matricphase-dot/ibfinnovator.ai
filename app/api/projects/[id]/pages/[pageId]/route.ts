import { NextResponse } from "next/server";
import { requireUser } from "@/lib/supabase/server";
import { z } from "zod";

const updatePageSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  content_markdown: z.string().optional(),
  content_json: z.record(z.any()).optional(),
  is_favorite: z.boolean().optional(),
});

export async function GET(
  _: Request,
  { params }: { params: Promise<{ id: string; pageId: string }> }
) {
  try {
    const { id: projectId, pageId } = await params;
    const { supabase } = await requireUser();

    const { data, error } = await supabase
      .from("pages")
      .select(`
        *,
        author:profiles!created_by(id, name, full_name, username, avatar_url)
      `)
      .eq("id", pageId)
      .eq("project_id", projectId)
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Page not found" },
      { status: err.message === "UNAUTHORIZED" ? 401 : 404 }
    );
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string; pageId: string }> }
) {
  try {
    const { id: projectId, pageId } = await params;
    const { supabase } = await requireUser();

    const body = await req.json().catch(() => null);
    const parsed = updatePageSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("pages")
      .update({
        ...parsed.data,
        updated_at: new Date().toISOString(),
      })
      .eq("id", pageId)
      .eq("project_id", projectId)
      .select(`
        *,
        author:profiles!created_by(id, name, full_name, username, avatar_url)
      `)
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to update page" },
      { status: err.message === "UNAUTHORIZED" ? 401 : 500 }
    );
  }
}

export async function DELETE(
  _: Request,
  { params }: { params: Promise<{ id: string; pageId: string }> }
) {
  try {
    const { id: projectId, pageId } = await params;
    const { supabase } = await requireUser();

    const { error } = await supabase
      .from("pages")
      .delete()
      .eq("id", pageId)
      .eq("project_id", projectId);

    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to delete page" },
      { status: err.message === "UNAUTHORIZED" ? 401 : 500 }
    );
  }
}
