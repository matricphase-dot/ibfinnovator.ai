import { NextResponse, type NextRequest } from "next/server";
import { requireUserOr401 } from "@/lib/auth/require-user-http";
import { z } from "zod";

/**
 * Edit or cancel one of the events you host.
 *
 *   PATCH  /api/events/<id>  { title?, description?, event_type?, starts_at?,
 *                              ends_at?, location?, capacity?, status? } -> the event
 *   DELETE /api/events/<id>                                              -> { deleted: true }
 *
 * The RLS policy "host manages events" already covers the host; the explicit
 * host_id check turns a silent 0-row write into a clear 403.
 */

const patchSchema = z
  .object({
    title: z.string().trim().min(3).max(160).optional(),
    description: z.string().trim().max(3000).nullable().optional(),
    event_type: z.enum(["EVENT", "AMA", "WORKSHOP", "DEMO_DAY"]).optional(),
    starts_at: z.string().datetime().optional(),
    ends_at: z.string().datetime().nullable().optional(),
    location: z.string().trim().max(500).nullable().optional(),
    capacity: z.number().int().positive().nullable().optional(),
    status: z.enum(["PUBLISHED", "CANCELLED"]).optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "Provide at least one field to change.",
  });

async function loadOwnEvent(supabase: any, id: string, userId: string) {
  const { data: event, error } = await supabase
    .from("community_events")
    .select("id,host_id,title,status")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("community_events select failed:", error.message);
    return { error: "Unable to load this event.", status: 500 as const };
  }
  if (!event) return { error: "Event not found.", status: 404 as const };
  if (event.host_id !== userId) {
    return { error: "You can only change events you host.", status: 403 as const };
  }
  return { event };
}

export async function PATCH(
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

    const payload = patchSchema.parse(await request.json());
    const found = await loadOwnEvent(supabase, id, user.id);
    if ("error" in found) {
      return NextResponse.json({ error: found.error }, { status: found.status });
    }

    const { data, error } = await supabase
      .from("community_events")
      .update(payload)
      .eq("id", id)
      .eq("host_id", user.id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (e: any) {
    if (e instanceof z.ZodError) {
      return NextResponse.json(
        { error: e.issues[0]?.message ?? "Invalid event payload." },
        { status: 400 },
      );
    }
    console.error("events/[id] PATCH failed:", e?.message);
    return NextResponse.json({ error: "Unable to update this event." }, { status: 500 });
  }
}

export async function DELETE(
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

    const found = await loadOwnEvent(supabase, id, user.id);
    if ("error" in found) {
      return NextResponse.json({ error: found.error }, { status: found.status });
    }

    const { error } = await supabase
      .from("community_events")
      .delete()
      .eq("id", id)
      .eq("host_id", user.id);

    if (error) throw error;
    return NextResponse.json({ deleted: true, id });
  } catch (e: any) {
    console.error("events/[id] DELETE failed:", e?.message);
    return NextResponse.json({ error: "Unable to delete this event." }, { status: 500 });
  }
}
