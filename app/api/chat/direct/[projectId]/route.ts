import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/supabase/server";
import { z } from "zod";
async function authorize(projectId: string, userId: string, s: any) {
  const { data: project } = await s
    .from("projects")
    .select("founder_id")
    .eq("id", projectId)
    .single();
  if (!project) return null;
  const { data: connections } = await s
    .from("connections")
    .select("requester_id,recipient_id,status")
    .eq("project_id", projectId)
    .eq("status", "ACCEPTED")
    .or(`requester_id.eq.${userId},recipient_id.eq.${userId}`);
  const c = connections?.[0];
  if (!c && project.founder_id !== userId) return null;
  const other = c
    ? c.requester_id === userId
      ? c.recipient_id
      : c.requester_id
    : null;
  return { project, other };
}
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> },
) {
  try {
    const { projectId } = await params,
      { supabase, user } = await requireUser();
    const access = await authorize(projectId, user.id, supabase);
    if (!access)
      return NextResponse.json(
        { error: "An accepted connection is required." },
        { status: 403 },
      );
    const before = req.nextUrl.searchParams.get("before");
    let q = supabase
      .from("messages")
      .select("*,sender:profiles!sender_id(id,name,avatar_url)")
      .eq("project_id", projectId)
      .eq("room_type", "DIRECT")
      .order("created_at", { ascending: false })
      .limit(50);
    if (before) q = q.lt("created_at", before);
    const { data, error } = await q;
    if (error) throw error;
    return NextResponse.json({
      messages: (data || []).reverse(),
      other_user_id: access.other,
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message },
      { status: e.message === "UNAUTHORIZED" ? 401 : 500 },
    );
  }
}
export async function POST(
  r: Request,
  { params }: { params: Promise<{ projectId: string }> },
) {
  try {
    const { projectId } = await params,
      { supabase, user } = await requireUser();
    const access = await authorize(projectId, user.id, supabase);
    if (!access?.other)
      return NextResponse.json(
        { error: "An accepted connection is required." },
        { status: 403 },
      );
    const { content } = z
      .object({ content: z.string().trim().min(1).max(5000) })
      .parse(await r.json());
    const { data, error } = await supabase
      .from("messages")
      .insert({
        project_id: projectId,
        sender_id: user.id,
        recipient_id: access.other,
        room_type: "DIRECT",
        content,
      })
      .select("*,sender:profiles!sender_id(id,name,avatar_url)")
      .single();
    if (error) throw error;
    await supabase
      .from("notifications")
      .insert({
        user_id: access.other,
        type: "NEW_MESSAGE",
        message: "You received a new project message",
        link: `/chat/direct/${projectId}`,
      });
    return NextResponse.json(data, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
