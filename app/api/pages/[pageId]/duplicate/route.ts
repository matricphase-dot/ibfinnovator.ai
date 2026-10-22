import { NextResponse } from "next/server";
import { requireUser } from "@/lib/supabase/server";

export async function POST(
  _: Request,
  { params }: { params: Promise<{ pageId: string }> }
) {
  try {
    const { pageId } = await params;
    const { supabase, user } = await requireUser();

    // 1. Fetch original page
    const { data: original, error: fetchError } = await supabase
      .from("pages")
      .select("*")
      .eq("id", pageId)
      .single();

    if (fetchError || !original) {
      return NextResponse.json({ error: "Original document not found" }, { status: 404 });
    }

    // 2. Clone page with new title and current user
    const { data: cloned, error: insertError } = await supabase
      .from("pages")
      .insert({
        project_id: original.project_id,
        created_by: user.id,
        title: `${original.title} (Copy)`,
        content_markdown: original.content_markdown || "",
        content_json: original.content_json || {},
        is_favorite: false,
      })
      .select(`
        *,
        author:profiles!created_by(id, name, full_name, username, avatar_url),
        project:projects!project_id(id, name, title, identifier)
      `)
      .single();

    if (insertError) throw insertError;
    return NextResponse.json(cloned, { status: 201 });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to duplicate page" },
      { status: err.message === "UNAUTHORIZED" ? 401 : 500 }
    );
  }
}
