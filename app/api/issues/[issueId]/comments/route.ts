import { NextResponse } from "next/server";
import { requireUser } from "@/lib/supabase/server";
import { z } from "zod";

const createCommentSchema = z.object({
  comment_html: z.string().min(1, "Comment cannot be empty"),
});

export async function GET(
  _: Request,
  { params }: { params: Promise<{ issueId: string }> }
) {
  try {
    const { issueId } = await params;
    const { supabase } = await requireUser();

    const { data, error } = await supabase
      .from("issue_comments")
      .select(`
        *,
        actor:profiles!actor_id(id, name, full_name, username, avatar_url)
      `)
      .eq("issue_id", issueId)
      .order("created_at", { ascending: true });

    if (error) throw error;
    return NextResponse.json(data || []);
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to fetch comments" },
      { status: err.message === "UNAUTHORIZED" ? 401 : 500 }
    );
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ issueId: string }> }
) {
  try {
    const { issueId } = await params;
    const { supabase, user } = await requireUser();

    const body = await req.json().catch(() => null);
    const parsed = createCommentSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("issue_comments")
      .insert({
        issue_id: issueId,
        actor_id: user.id,
        comment_html: parsed.data.comment_html,
      })
      .select(`
        *,
        actor:profiles!actor_id(id, name, full_name, username, avatar_url)
      `)
      .single();

    if (error) throw error;
    return NextResponse.json(data, { status: 201 });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to post comment" },
      { status: err.message === "UNAUTHORIZED" ? 401 : 500 }
    );
  }
}
