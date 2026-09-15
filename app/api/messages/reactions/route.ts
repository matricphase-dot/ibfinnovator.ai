import { NextResponse, type NextRequest } from "next/server";
import { requireUserOr401 } from "@/lib/auth/require-user-http";

/**
 * Batch reaction summary for a set of messages, so a chat page can render
 * counts and highlight the caller's own reactions in one round trip.
 *
 *   GET /api/messages/reactions?ids=<uuid>,<uuid>
 *     -> { reactions: { "<message id>": { "🔥": 2 }, ... },
 *          mine:      { "<message id>": ["🔥"], ... } }
 */

export async function GET(request: NextRequest) {
  try {
    const auth = await requireUserOr401();
    if (auth.response) return auth.response;
    const { supabase, user } = auth.session;

    const ids = (request.nextUrl.searchParams.get("ids") ?? "")
      .split(",")
      .map((value) => value.trim())
      .filter((value) => /^[0-9a-f-]{36}$/i.test(value))
      .slice(0, 200);

    if (!ids.length) return NextResponse.json({ reactions: {}, mine: {} });

    const { data, error } = await supabase
      .from("message_reactions")
      .select("message_id,user_id,emoji")
      .in("message_id", ids);

    if (error) throw error;

    const reactions: Record<string, Record<string, number>> = {};
    const mine: Record<string, string[]> = {};

    for (const row of data ?? []) {
      const bucket = (reactions[row.message_id] ??= {});
      bucket[row.emoji] = (bucket[row.emoji] ?? 0) + 1;
      if (row.user_id === user.id) {
        (mine[row.message_id] ??= []).push(row.emoji);
      }
    }

    return NextResponse.json({ reactions, mine });
  } catch (e: any) {
    const unauthorized = e?.message === "UNAUTHORIZED" || e?.message === "PROFILE_NOT_FOUND";
    return NextResponse.json(
      { error: e?.message ?? "Unable to load reactions." },
      { status: unauthorized ? 401 : 400 },
    );
  }
}
