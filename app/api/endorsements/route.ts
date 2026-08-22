import { NextResponse } from "next/server";
import { requireUser } from "@/lib/supabase/server";
import { z } from "zod";
const input = z.object({
  receiver_id: z.string().uuid(),
  skill: z.string().trim().min(1).max(80),
  project_id: z.string().uuid().optional(),
});
export async function POST(r: Request) {
  try {
    const { supabase, user } = await requireUser();
    const p = input.parse(await r.json());
    if (p.receiver_id === user.id)
      return NextResponse.json(
        { error: "You cannot endorse yourself." },
        { status: 400 },
      );
    const { data, error } = await supabase
      .from("endorsements")
      .insert({ ...p, giver_id: user.id })
      .select()
      .single();
    if (error) {
      if (error.code === "23505")
        return NextResponse.json(
          { error: "You already endorsed this skill." },
          { status: 409 },
        );
      throw error;
    }
    const { count } = await supabase
      .from("endorsements")
      .select("*", { count: "exact", head: true })
      .eq("receiver_id", p.receiver_id);
    await supabase
      .from("profiles")
      .update({ endorsement_count: count || 0 })
      .eq("id", p.receiver_id);
    return NextResponse.json(data, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
