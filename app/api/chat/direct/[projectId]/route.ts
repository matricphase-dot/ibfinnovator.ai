import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/supabase/server";
import { safeHttpsUrlSchema } from "@/lib/security/url";
import { z } from "zod";
import { dispatchEmail } from "@/lib/email/dispatch";
import NewMessageEmail from "@/lib/email/templates/NewMessageEmail";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";
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
      .select(
        "*,sender:profiles!sender_id(id,name,username,avatar_url),reactions:message_reactions(user_id,emoji),parent:messages!parent_id(id,content,sender:profiles!sender_id(name,username))",
      )
      .eq("project_id", projectId)
      .eq("room_type", "DIRECT")
      .order("created_at", { ascending: false })
      .limit(50);
    if (before) q = q.lt("created_at", before);
    const { data, error } = await q;
    if (error) throw error;
    await supabase
      .from("messages")
      .update({ read_at: new Date().toISOString() })
      .eq("project_id", projectId)
      .eq("room_type", "DIRECT")
      .eq("recipient_id", user.id)
      .is("read_at", null);
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
    const limit = checkRateLimit(`${user.id}:direct-chat`, 60, 60);
    if (!limit.allowed) return rateLimitResponse(limit);
    const access = await authorize(projectId, user.id, supabase);
    if (!access?.other)
      return NextResponse.json(
        { error: "An accepted connection is required." },
        { status: 403 },
      );
    const { content, attachments, parent_id } = z
      .object({
        content: z.string().trim().min(1).max(5000),
        attachments: z.array(safeHttpsUrlSchema()).max(10).default([]),
        parent_id: z.string().uuid().nullable().optional(),
      })
      .parse(await r.json());
    const { data, error } = await supabase
      .from("messages")
      .insert({
        project_id: projectId,
        sender_id: user.id,
        recipient_id: access.other,
        room_type: "DIRECT",
        content,
        attachments,
        parent_id,
      })
      .select(
        "*,sender:profiles!sender_id(id,name,username,avatar_url),reactions:message_reactions(user_id,emoji)",
      )
      .single();
    if (error) throw error;
    await supabase.from("notifications").insert({
      user_id: access.other,
      type: "NEW_MESSAGE",
      message: "You received a new project message",
      link: `/chat/direct/${projectId}`,
    });
    const { data: recipient } = await supabase
      .from("profiles")
      .select("last_seen_at")
      .eq("id", access.other)
      .maybeSingle();
    if (
      !recipient?.last_seen_at ||
      Date.now() - new Date(recipient.last_seen_at).getTime() > 5 * 60 * 1000
    )
      dispatchEmail({
        profileId: access.other,
        subject: "New IBF message",
        react: NewMessageEmail({
          href: `${process.env.NEXT_PUBLIC_APP_URL || "https://innovators-global.com"}/chat/direct/${projectId}`,
        }),
      });
    return NextResponse.json(data, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
