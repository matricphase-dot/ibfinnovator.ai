import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/supabase/server";
import { safeHttpsUrlSchema } from "@/lib/security/url";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { z } from "zod";

const postMessageSchema = z.object({
  content: z.string().trim().min(1, "Message cannot be empty").max(5000),
  attachments: z.array(safeHttpsUrlSchema()).max(10).default([]),
  parent_id: z.string().uuid().nullable().optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ channelId: string }> },
) {
  try {
    const { channelId } = await params;
    const { supabase, user } = await requireUser();

    const limit = checkRateLimit(`${user.id}:chat-messages-read`, 120, 60);
    if (!limit.allowed) return rateLimitResponse(limit);

    // 1. Verify access to channel
    const { data: channel, error: chErr } = await supabase
      .from("channels")
      .select("id, is_private, workspace_id, created_by")
      .eq("id", channelId)
      .single();

    if (chErr || !channel) {
      return NextResponse.json({ error: "Channel not found" }, { status: 404 });
    }

    if (channel.is_private && channel.created_by !== user.id) {
      const { data: membership } = await supabase
        .from("channel_members")
        .select("channel_id")
        .eq("channel_id", channelId)
        .eq("user_id", user.id)
        .maybeSingle();

      if (!membership) {
        return NextResponse.json(
          { error: "Access denied to private channel" },
          { status: 403 },
        );
      }
    }

    // 2. Query messages (only root messages in main feed, or thread context if specified)
    const before = req.nextUrl.searchParams.get("before");
    const threadOnly = req.nextUrl.searchParams.get("thread_only") === "true";

    let q = supabase
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
      .eq("channel_id", channelId)
      .order("created_at", { ascending: false })
      .limit(60);

    if (!threadOnly) {
      // In channel feed, show root messages
      q = q.is("parent_id", null);
    }

    if (before) {
      q = q.lt("created_at", before);
    }

    const { data: rawMessages, error: msgErr } = await q;
    if (msgErr) throw msgErr;

    const messages = (rawMessages || []).reverse();

    // 3. Aggregate thread reply counts and latest reply timestamps for root messages
    const rootIds = messages.map((m) => m.id);
    let replyMeta: Record<
      string,
      { count: number; last_reply_at: string | null }
    > = {};

    if (rootIds.length > 0) {
      const { data: replies } = await supabase
        .from("messages")
        .select("id, parent_id, created_at")
        .in("parent_id", rootIds);

      if (replies) {
        for (const rep of replies) {
          if (!rep.parent_id) continue;
          if (!replyMeta[rep.parent_id]) {
            replyMeta[rep.parent_id] = { count: 0, last_reply_at: null };
          }
          replyMeta[rep.parent_id].count += 1;
          if (
            !replyMeta[rep.parent_id].last_reply_at ||
            new Date(rep.created_at) >
              new Date(replyMeta[rep.parent_id].last_reply_at!)
          ) {
            replyMeta[rep.parent_id].last_reply_at = rep.created_at;
          }
        }
      }
    }

    const enrichedMessages = messages.map((m) => ({
      ...m,
      reply_count: replyMeta[m.id]?.count || 0,
      last_reply_at: replyMeta[m.id]?.last_reply_at || null,
    }));

    // Update last_read_at for user in channel_members
    void supabase
      .from("channel_members")
      .update({ last_read_at: new Date().toISOString() })
      .eq("channel_id", channelId)
      .eq("user_id", user.id);

    return NextResponse.json(enrichedMessages);
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to load channel messages" },
      { status: 500 },
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ channelId: string }> },
) {
  try {
    const { channelId } = await params;
    const { supabase, user } = await requireUser();

    const limit = checkRateLimit(`${user.id}:chat-message-send`, 45, 60);
    if (!limit.allowed) return rateLimitResponse(limit);

    // 1. Verify access to channel
    const { data: channel, error: chErr } = await supabase
      .from("channels")
      .select("id, is_private, created_by")
      .eq("id", channelId)
      .single();

    if (chErr || !channel) {
      return NextResponse.json({ error: "Channel not found" }, { status: 404 });
    }

    if (channel.is_private && channel.created_by !== user.id) {
      const { data: membership } = await supabase
        .from("channel_members")
        .select("channel_id")
        .eq("channel_id", channelId)
        .eq("user_id", user.id)
        .maybeSingle();

      if (!membership) {
        return NextResponse.json(
          { error: "Access denied to private channel" },
          { status: 403 },
        );
      }
    }

    // 2. Validate input
    const body = await req.json();
    const parsed = postMessageSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid message data" },
        { status: 400 },
      );
    }

    const { content, attachments, parent_id } = parsed.data;

    // 3. Insert message
    const { data: message, error: insErr } = await supabase
      .from("messages")
      .insert({
        channel_id: channelId,
        sender_id: user.id,
        room_type: "CHANNEL",
        content,
        attachments,
        parent_id: parent_id || null,
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

    return NextResponse.json(
      {
        ...message,
        reply_count: 0,
        last_reply_at: null,
      },
      { status: 201 },
    );
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to send message" },
      { status: 500 },
    );
  }
}
