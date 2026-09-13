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
    const { supabase, user } = await requireUser(),
      p = input.parse(await r.json());
    if (p.receiver_id === user.id)
      return NextResponse.json(
        { error: "You cannot endorse yourself." },
        { status: 400 },
      );
    const { data: receiver } = await supabase
      .from("profiles")
      .select("skills")
      .eq("id", p.receiver_id)
      .single();
    const canonical = receiver?.skills?.find(
      (s: string) => s.toLowerCase() === p.skill.toLowerCase(),
    );
    if (!canonical)
      return NextResponse.json(
        { error: "Select a skill listed on this profile." },
        { status: 400 },
      );
    const { data, error } = await supabase
      .from("endorsements")
      .insert({ ...p, skill: canonical, giver_id: user.id })
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
    return NextResponse.json(data, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
