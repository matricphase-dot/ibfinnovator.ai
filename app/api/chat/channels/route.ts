import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/supabase/server";
import { getActiveWorkspace } from "@/lib/workspace";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { z } from "zod";

const createChannelSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Channel name must be at least 2 characters")
    .max(50, "Channel name must be at most 50 characters")
    .regex(
      /^[a-z0-9_-]+$/,
      "Channel name can only contain lowercase letters, numbers, hyphens, and underscores",
    ),
  description: z.string().trim().max(250).optional().default(""),
  is_private: z.boolean().default(false),
});

export async function GET(req: NextRequest) {
  try {
    const { supabase, user } = await requireUser();
    const limit = checkRateLimit(`${user.id}:chat-channels-list`, 60, 60);
    if (!limit.allowed) return rateLimitResponse(limit);

    const workspace = await getActiveWorkspace(supabase, user.id);
    if (!workspace) {
      return NextResponse.json(
        { error: "No active workspace found" },
        { status: 404 },
      );
    }

    // 1. Fetch channels in workspace
    const { data: channels, error: channelsErr } = await supabase
      .from("channels")
      .select(
        "id, workspace_id, name, description, is_private, created_by, created_at, updated_at",
      )
      .eq("workspace_id", workspace.id)
      .order("name", { ascending: true });

    if (channelsErr) throw channelsErr;

    // 2. Fetch user's channel memberships
    const { data: userMemberships } = await supabase
      .from("channel_members")
      .select("channel_id, last_read_at")
      .eq("user_id", user.id);

    const memberChannelIds = new Set(
      (userMemberships || []).map((m) => m.channel_id),
    );

    // 3. Filter accessible channels:
    // Public channels or private channels where user is member or creator
    const accessibleChannels = (channels || []).filter((ch) => {
      if (!ch.is_private) return true;
      if (ch.created_by === user.id) return true;
      return memberChannelIds.has(ch.id);
    });

    // 4. Fetch member counts for channels
    const channelIds = accessibleChannels.map((c) => c.id);
    const countsMap: Record<string, number> = {};
    if (channelIds.length > 0) {
      const { data: memberCounts } = await supabase
        .from("channel_members")
        .select("channel_id");
      if (memberCounts) {
        for (const m of memberCounts) {
          countsMap[m.channel_id] = (countsMap[m.channel_id] || 0) + 1;
        }
      }
    }

    const enrichedChannels = accessibleChannels.map((ch) => ({
      ...ch,
      is_member: memberChannelIds.has(ch.id),
      member_count: countsMap[ch.id] || 0,
    }));

    // 5. Also fetch direct message peers (collaborators from accepted connections)
    const { data: connections } = await supabase
      .from("connections")
      .select(
        `
        id,
        project_id,
        status,
        requester:profiles!requester_id(id, name, username, avatar_url, last_seen_at),
        recipient:profiles!recipient_id(id, name, username, avatar_url, last_seen_at),
        project:projects!project_id(id, title)
      `,
      )
      .eq("status", "ACCEPTED")
      .or(`requester_id.eq.${user.id},recipient_id.eq.${user.id}`);

    const directMessages = (connections || []).map((c: any) => {
      const isReq = c.requester?.id === user.id;
      const peer = isReq ? c.recipient : c.requester;
      return {
        connection_id: c.id,
        project_id: c.project_id,
        project_title: c.project?.title,
        peer: peer || { id: "unknown", name: "Collaborator" },
      };
    });

    return NextResponse.json({
      workspace,
      channels: enrichedChannels,
      direct_messages: directMessages,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to load channels" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { supabase, user } = await requireUser();
    const limit = checkRateLimit(`${user.id}:chat-channels-create`, 15, 60);
    if (!limit.allowed) return rateLimitResponse(limit);

    const workspace = await getActiveWorkspace(supabase, user.id);
    if (!workspace) {
      return NextResponse.json(
        { error: "No active workspace found" },
        { status: 404 },
      );
    }

    const body = await req.json();
    const parsed = createChannelSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error:
            parsed.error.issues[0]?.message || "Invalid channel parameters",
        },
        { status: 400 },
      );
    }

    const { name, description, is_private } = parsed.data;

    // Check if channel already exists in workspace
    const { data: existing } = await supabase
      .from("channels")
      .select("id")
      .eq("workspace_id", workspace.id)
      .eq("name", name)
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        { error: `Channel #${name} already exists` },
        { status: 409 },
      );
    }

    // Insert channel
    const { data: channel, error: insertErr } = await supabase
      .from("channels")
      .insert({
        workspace_id: workspace.id,
        name,
        description,
        is_private,
        created_by: user.id,
      })
      .select()
      .single();

    if (insertErr) throw insertErr;

    // Automatically join creator as member
    await supabase.from("channel_members").insert({
      channel_id: channel.id,
      user_id: user.id,
    });

    return NextResponse.json(
      {
        ...channel,
        is_member: true,
        member_count: 1,
      },
      { status: 201 },
    );
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to create channel" },
      { status: 500 },
    );
  }
}
