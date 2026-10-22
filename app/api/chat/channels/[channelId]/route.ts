import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/supabase/server";
import { z } from "zod";

const updateChannelSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2)
    .max(50)
    .regex(/^[a-z0-9_-]+$/)
    .optional(),
  description: z.string().trim().max(250).optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ channelId: string }> },
) {
  try {
    const { channelId } = await params;
    const { supabase, user } = await requireUser();

    // 1. Fetch channel
    const { data: channel, error: chErr } = await supabase
      .from("channels")
      .select("*")
      .eq("id", channelId)
      .single();

    if (chErr || !channel) {
      return NextResponse.json({ error: "Channel not found" }, { status: 404 });
    }

    // 2. Fetch channel members
    const { data: members, error: memErr } = await supabase
      .from("channel_members")
      .select(
        `
        user_id,
        joined_at,
        profile:profiles!user_id(id, name, username, avatar_url, last_seen_at)
      `,
      )
      .eq("channel_id", channelId);

    if (memErr) throw memErr;

    const isMember = (members || []).some((m) => m.user_id === user.id);

    // Verify user belongs to channel's workspace
    const { data: isWsMember } = await supabase.rpc("is_workspace_member", {
      ws_id: channel.workspace_id,
      check_user: user.id,
    });

    if (!isWsMember) {
      return NextResponse.json(
        { error: "Access denied: not a member of this workspace" },
        { status: 403 },
      );
    }

    // If channel is private and user is not a member and not creator, 403
    if (channel.is_private && !isMember && channel.created_by !== user.id) {
      return NextResponse.json(
        { error: "Access denied to private channel" },
        { status: 403 },
      );
    }

    return NextResponse.json({
      channel: {
        ...channel,
        is_member: isMember,
        member_count: members?.length || 0,
      },
      members: (members || []).map((m: any) => ({
        ...m.profile,
        joined_at: m.joined_at,
      })),
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to load channel" },
      { status: 500 },
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ channelId: string }> },
) {
  try {
    const { channelId } = await params;
    const { supabase, user } = await requireUser();

    const { data: channel, error: chErr } = await supabase
      .from("channels")
      .select("*")
      .eq("id", channelId)
      .single();

    if (chErr || !channel) {
      return NextResponse.json({ error: "Channel not found" }, { status: 404 });
    }

    if (channel.created_by !== user.id) {
      return NextResponse.json(
        { error: "Only the channel creator can edit this channel" },
        { status: 403 },
      );
    }

    const body = await req.json();
    const parsed = updateChannelSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid update data" },
        { status: 400 },
      );
    }

    const { data: updated, error: updErr } = await supabase
      .from("channels")
      .update({
        ...parsed.data,
        updated_at: new Date().toISOString(),
      })
      .eq("id", channelId)
      .select()
      .single();

    if (updErr) throw updErr;

    return NextResponse.json(updated);
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to update channel" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ channelId: string }> },
) {
  try {
    const { channelId } = await params;
    const { supabase, user } = await requireUser();

    const { data: channel, error: chErr } = await supabase
      .from("channels")
      .select("*")
      .eq("id", channelId)
      .single();

    if (chErr || !channel) {
      return NextResponse.json({ error: "Channel not found" }, { status: 404 });
    }

    if (channel.name === "general") {
      return NextResponse.json(
        { error: "Default #general channel cannot be deleted" },
        { status: 400 },
      );
    }

    if (channel.created_by !== user.id) {
      return NextResponse.json(
        { error: "Only the channel creator can delete this channel" },
        { status: 403 },
      );
    }

    const { error: delErr } = await supabase
      .from("channels")
      .delete()
      .eq("id", channelId);

    if (delErr) throw delErr;

    return NextResponse.json({ success: true, deleted_id: channelId });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to delete channel" },
      { status: 500 },
    );
  }
}
