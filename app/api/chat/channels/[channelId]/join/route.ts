import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/supabase/server";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ channelId: string }> },
) {
  try {
    const { channelId } = await params;
    const { supabase, user } = await requireUser();

    // 1. Verify channel
    const { data: channel, error: chErr } = await supabase
      .from("channels")
      .select("id, is_private, workspace_id")
      .eq("id", channelId)
      .single();

    if (chErr || !channel) {
      return NextResponse.json({ error: "Channel not found" }, { status: 404 });
    }

    if (channel.is_private) {
      return NextResponse.json(
        { error: "Cannot directly join a private channel without invitation" },
        { status: 403 },
      );
    }

    // 2. Verify workspace membership
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

    // 3. Add to channel_members
    const { error: joinErr } = await supabase.from("channel_members").upsert(
      {
        channel_id: channelId,
        user_id: user.id,
        last_read_at: new Date().toISOString(),
      },
      { onConflict: "channel_id,user_id" },
    );

    if (joinErr) throw joinErr;

    return NextResponse.json({ success: true, channel_id: channelId });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to join channel" },
      { status: 500 },
    );
  }
}
