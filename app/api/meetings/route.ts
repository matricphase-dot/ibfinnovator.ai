import { NextResponse } from "next/server";
import { requireUser } from "@/lib/supabase/server";
import { z } from "zod";
const meeting = z
  .object({
    project_id: z.string().uuid(),
    title: z.string().min(3).max(120),
    description: z.string().max(1000).optional(),
    starts_at: z.string().datetime(),
    ends_at: z.string().datetime(),
    location: z.string().max(500).optional(),
    attendee_ids: z.array(z.string().uuid()).default([]),
  })
  .refine((x) => new Date(x.ends_at) > new Date(x.starts_at), {
    message: "End time must be after start time",
  });
export async function GET() {
  try {
    const { supabase, user } = await requireUser();
    const { data: owned, error: e1 } = await supabase
      .from("meetings")
      .select(
        "*,project:projects(id,title),attendees:meeting_attendees(user_id,status,profile:profiles!user_id(id,name,avatar_url))",
      )
      .eq("organizer_id", user.id)
      .order("starts_at");
    const { data: invites, error: e2 } = await supabase
      .from("meeting_attendees")
      .select(
        "status,meeting:meetings(*,project:projects(id,title),organizer:profiles!organizer_id(id,name,avatar_url))",
      )
      .eq("user_id", user.id);
    if (e1 || e2) throw e1 || e2;
    return NextResponse.json({
      organized: owned || [],
      invited: (invites || []).map((x: any) => ({
        ...x.meeting,
        my_status: x.status,
      })),
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message },
      { status: e.message === "UNAUTHORIZED" ? 401 : 500 },
    );
  }
}
export async function POST(r: Request) {
  try {
    const { supabase, user } = await requireUser();
    const p = meeting.safeParse(await r.json());
    if (!p.success)
      return NextResponse.json({ error: p.error.flatten() }, { status: 400 });
    const { attendee_ids, ...row } = p.data;
    const { data, error } = await supabase
      .from("meetings")
      .insert({ ...row, organizer_id: user.id })
      .select()
      .single();
    if (error) throw error;
    if (attendee_ids.length) {
      const { error: ae } = await supabase
        .from("meeting_attendees")
        .insert(
          attendee_ids.map((id) => ({ meeting_id: data.id, user_id: id })),
        );
      if (ae) throw ae;
    }
    return NextResponse.json(data, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
