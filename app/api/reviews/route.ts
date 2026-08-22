import { NextResponse } from "next/server";
import { requireUser } from "@/lib/supabase/server";
import { z } from "zod";
const input = z.object({
  reviewee_id: z.string().uuid(),
  project_id: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().trim().min(10).max(2000).optional(),
});
export async function POST(r: Request) {
  try {
    const { supabase, user } = await requireUser();
    const p = input.parse(await r.json());
    if (p.reviewee_id === user.id)
      return NextResponse.json(
        { error: "You cannot review yourself." },
        { status: 400 },
      );
    const { data: project } = await supabase
      .from("projects")
      .select("status,founder_id")
      .eq("id", p.project_id)
      .single();
    if (!project || project.status !== "COMPLETED")
      return NextResponse.json(
        { error: "Reviews open after the project is completed." },
        { status: 400 },
      );
    const { data: connection } = await supabase
      .from("connections")
      .select("id")
      .eq("project_id", p.project_id)
      .eq("status", "ACCEPTED")
      .or(`requester_id.eq.${user.id},recipient_id.eq.${user.id}`)
      .maybeSingle();
    if (!connection && project.founder_id !== user.id)
      return NextResponse.json(
        { error: "Only project collaborators can review." },
        { status: 403 },
      );
    const { data, error } = await supabase
      .from("reviews")
      .insert({ ...p, reviewer_id: user.id })
      .select()
      .single();
    if (error) throw error;
    const { data: ratings } = await supabase
      .from("reviews")
      .select("rating")
      .eq("reviewee_id", p.reviewee_id);
    const avg =
      (ratings || []).reduce((a, x) => a + x.rating, 0) /
      (ratings?.length || 1);
    await supabase
      .from("profiles")
      .update({ average_rating: avg })
      .eq("id", p.reviewee_id);
    return NextResponse.json(data, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
