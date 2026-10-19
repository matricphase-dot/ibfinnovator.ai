import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/supabase/server";
import { safeHttpsUrlSchema } from "@/lib/security/url";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { z } from "zod";

const postThreadReplySchema = z.object({
  content: z.string().trim().min(1, "Reply cannot be empty").max(5000),
  attachments: z.array(safeHttpsUrlSchema()).max(10).default([]),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ parentId: string }> },
) {
  try {
    const { parentId } = await params;
    const { supabase, user } = await requireUser();

    // 1. Fetch parent message
    const { data: parentMessage, error: pErr } = await supabase
      .from("messages")
      .select(
        `
        id,
        channel_id,
        sender_id,
        content,
        created_at,
        updated_at,
        edited_at,
        deleted_at,
        parent_id,
        attachments,
        pinned,
        sender:profiles!sender_id(id, name, username, avatar_url),
        reactions:message_reactions(user_id, emoji)
      `,
      )
      .eq("id", parentId)
      .single();

    if (pErr || !parentMessage) {
      return NextResponse.json(
        { error: "Parent message not found" },
        { status: 404 },
      );
    }

    // 2. Fetch all thread replies
    const { data: replies, error: rErr } = await supabase
      .from("messages")
      .select(
        `
        id,
        channel_id,
        sender_id,
        content,
        created_at,
        updated_at,
        edited_at,
        deleted_at,
        parent_id,
        attachments,
        pinned,
        sender:profiles!sender_id(id, name, username, avatar_url),
        reactions:message_reactions(user_id, emoji)
      `,
      )
      .eq("parent_id", parentId)
      .order("created_at", { ascending: true });

    if (rErr) throw rErr;

    return NextResponse.json({
      root: parentMessage,
      replies: replies || [],
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to load thread" },
      { status: 500 },
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ parentId: string }> },
) {
  try {
    const { parentId } = await params;
    const { supabase, user } = await requireUser();

    const limit = checkRateLimit(`${user.id}:chat-thread-reply`, 45, 60);
    if (!limit.allowed) return rateLimitResponse(limit);

    // 1. Fetch parent message to obtain channel_id
    const { data: parentMessage, error: pErr } = await supabase
      .from("messages")
      .select("id, channel_id, project_id, room_type")
      .eq("id", parentId)
      .single();

    if (pErr || !parentMessage) {
      return NextResponse.json(
        { error: "Parent message not found" },
        { status: 404 },
      );
    }

    const body = await req.json();
    const parsed = postThreadReplySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid reply data" },
        { status: 400 },
      );
    }

    const { content, attachments } = parsed.data;

    // 2. Insert reply message
    const { data: reply, error: insErr } = await supabase
      .from("messages")
      .insert({
        channel_id: parentMessage.channel_id,
        project_id: parentMessage.project_id,
        room_type: parentMessage.room_type || "GENERAL",
        sender_id: user.id,
        content,
        attachments,
        parent_id: parentId,
      })
      .select(
        `
        id,
        channel_id,
        sender_id,
        content,
        created_at,
        updated_at,
        edited_at,
        deleted_at,
        parent_id,
        attachments,
        pinned,
        sender:profiles!sender_id(id, name, username, avatar_url),
        reactions:message_reactions(user_id, emoji)
      `,
      )
      .single();

    if (insErr) throw insErr;

    return NextResponse.json(reply, { status: 201 });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to post thread reply" },
      { status: 500 },
    );
  }
}
