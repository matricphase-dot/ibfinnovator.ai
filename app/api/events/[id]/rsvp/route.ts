import { NextResponse, type NextRequest } from "next/server";
import { requireUserOr401 } from "@/lib/auth/require-user-http";
import { z } from "zod";

/**
 * RSVP to one event.
 *
 *   POST /api/events/<id>/rsvp  { status: GOING | INTERESTED | CANCELLED } -> the row
 *   GET  /api/events/<id>/rsvp                                            -> { status }
 *
 * This is the canonical path. The older `PATCH /api/events` upsert is left in
 * place because the previous UI used it and removing it would break any client
 * still calling it.
 *
 * The upsert is keyed on the (event_id, user_id) primary key, so a member has
 * exactly one RSVP per event and can change it any number of times. Only
 * PUBLISHED events accept an RSVP — a cancelled event should not collect more
 * attendees.
 */

const bodySchema = z.object({
  status: z.enum(["GOING", "INTERESTED", "CANCELLED"]),
});

async function loadEvent(supabase: any, id: string) {
  const { data: event, error } = await supabase
    .from("community_events")
    .select("id,title,status")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("community_events select failed:", error.message);
    return { error: "Unable to load this event.", status: 500 as const };
  }
  if (!event) return { error: "Event not found.", status: 404 as const };
  return { event };
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireUserOr401();
  if (auth.response) return auth.response;
  const { supabase, user } = auth.session;

  try {
    const { id } = await params;
    if (!z.string().uuid().safeParse(id).success) {
      return NextResponse.json({ error: "Invalid event id." }, { status: 400 });
    }

    const payload = bodySchema.parse(await request.json());
    const found = await loadEvent(supabase, id);
    if ("error" in found) {
      return NextResponse.json({ error: found.error }, { status: found.status });
    }
    if (found.event.status !== "PUBLISHED") {
      return NextResponse.json(
        { error: "This event is no longer accepting RSVPs." },
        { status: 409 },
      );
    }

    const { data, error } = await supabase
      .from("event_attendees")
      .upsert(
        { event_id: id, user_id: user.id, status: payload.status },
        { onConflict: "event_id,user_id" },
      )
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data, { status: 201 });
  } catch (e: any) {
    if (e instanceof z.ZodError) {
      return NextResponse.json(
        { error: e.issues[0]?.message ?? "Invalid RSVP payload." },
        { status: 400 },
      );
    }
    console.error("events/[id]/rsvp POST failed:", e?.message);
    return NextResponse.json({ error: "Unable to save your RSVP." }, { status: 500 });
  }
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireUserOr401();
  if (auth.response) return auth.response;
  const { supabase, user } = auth.session;

  try {
    const { id } = await params;
    if (!z.string().uuid().safeParse(id).success) {
      return NextResponse.json({ error: "Invalid event id." }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("event_attendees")
      .select("status")
      .eq("event_id", id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) throw error;
    return NextResponse.json({ status: data?.status ?? null });
  } catch (e: any) {
    console.error("events/[id]/rsvp GET failed:", e?.message);
    return NextResponse.json({ error: "Unable to read your RSVP." }, { status: 500 });
  }
}
