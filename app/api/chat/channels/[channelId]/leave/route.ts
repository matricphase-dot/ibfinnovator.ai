import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/supabase/server";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ channelId: string }> },
) {
  try {
    const { channelId } = await params;
    const { supabase, user } = await requireUser();

    // 1. Verify channel is not default #general
    const { data: channel, error: chErr } = await supabase
      .from("channels")
      .select("id, name")
      .eq("id", channelId)
      .single();

    if (chErr || !channel) {
      return NextResponse.json({ error: "Channel not found" }, { status: 404 });
    }

    if (channel.name === "general") {
      return NextResponse.json(
        { error: "Cannot leave the default #general channel" },
        { status: 400 },
      );
    }

    // 2. Remove from channel_members
    const { error: leaveErr } = await supabase
      .from("channel_members")
      .delete()
      .eq("channel_id", channelId)
      .eq("user_id", user.id);

    if (leaveErr) throw leaveErr;

    return NextResponse.json({ success: true, channel_id: channelId });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to leave channel" },
      { status: 500 },
    );
  }
}
