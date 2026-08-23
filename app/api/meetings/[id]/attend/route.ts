import { NextResponse } from "next/server";
import { requireUser } from "@/lib/supabase/server";
import { z } from "zod";
export async function PATCH(
  r: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params,
      { supabase, user } = await requireUser();
    const { status } = z
      .object({ status: z.enum(["ACCEPTED", "DECLINED"]) })
      .parse(await r.json());
    const { data, error } = await supabase
      .from("meeting_attendees")
      .update({ status })
      .eq("meeting_id", id)
      .eq("user_id", user.id)
      .select()
      .single();
    if (error) throw error;
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
