import { NextResponse, type NextRequest } from "next/server";
import { requireUser } from "@/lib/auth/require-user";
import { z } from "zod";

/**
 * Mark incoming messages as read (read receipts).
 *
 *   POST /api/messages/read { ids: [...] }                  -> { marked }
 *   POST /api/messages/read { room: { type: "DIRECT", project_id } }
 *
 * Writing read_at goes through public.mark_messages_read() (migration 020)
 * because the messages UPDATE policy only covers the sender, so a recipient
 * could never set it directly. The function is SECURITY DEFINER but only
 * touches rows addressed to the caller.
 */

const schema = z
  .object({
    ids: z.array(z.string().uuid()).max(200).optional(),
    room: z
      .object({
        type: z.enum(["GENERAL", "DIRECT", "TEAM"]),
        project_id: z.string().uuid().optional(),
        room_id: z.string().uuid().optional(),
      })
      .optional(),
  })
  .refine((value) => value.ids?.length || value.room, {
    message: "Provide message ids or a room.",
  });

export async function POST(request: NextRequest) {
  try {
    const { supabase, user } = await requireUser();
    const body = schema.parse(await request.json());

    let ids = body.ids ?? [];

    if (!ids.length && body.room) {
      let query = supabase
        .from("messages")
        .select("id")
        .eq("room_type", body.room.type)
        .eq("recipient_id", user.id)
        .is("read_at", null)
        .limit(200);
      if (body.room.project_id) query = query.eq("project_id", body.room.project_id);
      if (body.room.room_id) query = query.eq("room_id", body.room.room_id);
      const { data, error } = await query;
      if (error) throw error;
      ids = (data ?? []).map((row: { id: string }) => row.id);
    }

    if (!ids.length) return NextResponse.json({ marked: 0 });

    const { data, error } = await supabase.rpc("mark_messages_read", {
      p_message_ids: ids,
    });
    if (error) throw error;

    return NextResponse.json({ marked: typeof data === "number" ? data : 0 });
  } catch (e: any) {
    const unauthorized = e?.message === "UNAUTHORIZED" || e?.message === "PROFILE_NOT_FOUND";
    return NextResponse.json(
      { error: e?.message ?? "Unable to update read receipts." },
      { status: unauthorized ? 401 : 400 },
    );
  }
}
