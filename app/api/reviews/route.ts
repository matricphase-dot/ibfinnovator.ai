import { NextResponse } from "next/server";
import { requireUser } from "@/lib/supabase/server";
import { z } from "zod";
const input = z.object({
  reviewee_id: z.string().uuid(),
  project_id: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().trim().min(10).max(2000),
});
export async function POST(r: Request) {
  try {
    const { supabase, user } = await requireUser(),
      p = input.parse(await r.json());
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
    const { data: connections } = await supabase
      .from("connections")
      .select("requester_id,recipient_id")
      .eq("project_id", p.project_id)
      .eq("status", "ACCEPTED");
    const paired = (connections || []).some(
      (c) =>
        (c.requester_id === user.id && c.recipient_id === p.reviewee_id) ||
        (c.recipient_id === user.id && c.requester_id === p.reviewee_id),
    );
    if (!paired)
      return NextResponse.json(
        {
          error:
            "Only collaborators on this completed project can review each other.",
        },
        { status: 403 },
      );
    const { data, error } = await supabase
      .from("reviews")
      .insert({ ...p, reviewer_id: user.id })
      .select()
      .single();
    if (error) {
      if (error.code === "23505")
        return NextResponse.json(
          { error: "You already reviewed this collaborator for this project." },
          { status: 409 },
        );
      throw error;
    }
    return NextResponse.json(data, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
