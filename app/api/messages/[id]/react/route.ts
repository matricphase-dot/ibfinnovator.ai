import { NextResponse, type NextRequest } from "next/server";
import { requireUser } from "@/lib/auth/require-user";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { ALLOWED_REACTIONS, canonicalReaction } from "@/lib/messages";
import { z } from "zod";

/**
 * Toggle an emoji reaction on a message.
 *
 *   POST /api/messages/<id>/react   { "emoji": "🔥" }  ->  { active, count }
 *
 * The insert/delete runs on the caller's own client, so the "own reactions"
 * policy (migration 014) confines writes to the caller's own rows. The count is
 * a read-only aggregate and prefers the service-role client so it stays exact;
 * if that key is not configured it falls back to the caller's client.
 */

async function countReactions(
  supabase: any,
  messageId: string,
): Promise<number> {
  const readCount = async (client: any) => {
    const { count } = await client
      .from("message_reactions")
      .select("message_id", { count: "exact", head: true })
      .eq("message_id", messageId);
    return typeof count === "number" ? count : null;
  };

  try {
    const exact = await readCount(supabaseAdmin);
    if (exact !== null) return exact;
  } catch {
    // service-role key not configured — fall through to the caller's client
  }
  return (await readCount(supabase)) ?? 0;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    if (!z.string().uuid().safeParse(id).success) {
      return NextResponse.json({ error: "Invalid message id." }, { status: 400 });
    }

    const { supabase, user } = await requireUser();
    const body = z
      .object({ emoji: z.string().min(1).max(8) })
      .parse(await request.json());

    const emoji = canonicalReaction(body.emoji);
    if (!emoji) {
      return NextResponse.json(
        {
          code: "INVALID_EMOJI",
          message: `Allowed reactions: ${ALLOWED_REACTIONS.join(" ")}`,
        },
        { status: 400 },
      );
    }

    // Only react to a message the caller can actually see.
    const { data: visible } = await supabase
      .from("messages")
      .select("id")
      .eq("id", id)
      .maybeSingle();
    if (!visible) {
      return NextResponse.json({ error: "Message not found." }, { status: 404 });
    }

    const { data: existing } = await supabase
      .from("message_reactions")
      .select("emoji")
      .eq("message_id", id)
      .eq("user_id", user.id)
      .eq("emoji", emoji)
      .maybeSingle();

    if (existing) {
      const { error } = await supabase
        .from("message_reactions")
        .delete()
        .eq("message_id", id)
        .eq("user_id", user.id)
        .eq("emoji", emoji);
      if (error) throw error;
      return NextResponse.json({ active: false, count: await countReactions(supabase, id) });
    }

    const { error } = await supabase
      .from("message_reactions")
      .insert({ message_id: id, user_id: user.id, emoji });
    if (error) throw error;
    return NextResponse.json({ active: true, count: await countReactions(supabase, id) });
  } catch (e: any) {
    const unauthorized = e?.message === "UNAUTHORIZED" || e?.message === "PROFILE_NOT_FOUND";
    return NextResponse.json(
      { error: e?.message ?? "Unable to react to this message." },
      { status: unauthorized ? 401 : 400 },
    );
  }
}
