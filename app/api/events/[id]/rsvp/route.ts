import { NextResponse } from "next/server";
import { requireUser } from "@/lib/supabase/server";
import { z } from "zod";
export async function POST(
  r: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params,
      { supabase, user } = await requireUser(),
      { status } = z
        .object({ status: z.enum(["GOING", "INTERESTED", "CANCELLED"]) })
        .parse(await r.json());
    const { data, error } = await supabase
      .from("event_attendees")
      .upsert(
        { event_id: id, user_id: user.id, status },
        { onConflict: "event_id,user_id" },
      )
      .select()
      .single();
    if (error) throw error;
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
