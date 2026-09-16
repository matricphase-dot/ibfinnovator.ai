import { NextResponse } from "next/server";
import { requireUserOr401 } from "@/lib/auth/require-user-http";

/**
 * Every RSVP the caller has made, as one map — { event_id: status }.
 *
 * The event list needs to know which button to highlight for each card, and
 * fetching `/api/events/<id>/rsvp` once per card would turn one page view into
 * N requests. This is a read-only convenience endpoint; the write path is still
 * `POST /api/events/<id>/rsvp`.
 *
 * `/api/events/rsvp` is a static segment and wins over `/api/events/[id]`.
 */
export async function GET() {
  const auth = await requireUserOr401();
  if (auth.response) return auth.response;
  const { supabase, user } = auth.session;

  try {
    const { data, error } = await supabase
      .from("event_attendees")
      .select("event_id,status")
      .eq("user_id", user.id);

    if (error) throw error;

    const rsvps: Record<string, string> = {};
    for (const row of data ?? []) rsvps[row.event_id] = row.status;
    return NextResponse.json({ rsvps });
  } catch (e: any) {
    console.error("events/rsvp GET failed:", e?.message);
    return NextResponse.json({ error: "Unable to read your RSVPs." }, { status: 500 });
  }
}
