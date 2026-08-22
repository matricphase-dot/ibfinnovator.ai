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
      .object({ status: z.enum(["ACCEPTED", "REJECTED"]) })
      .parse(await r.json());
    const { data: application } = await supabase
      .from("applications")
      .select("*,project:projects(founder_id,title)")
      .eq("id", id)
      .single();
    if (!application || application.project.founder_id !== user.id)
      return NextResponse.json(
        { error: "Only the project founder can review this application." },
        { status: 403 },
      );
    const { data, error } = await supabase
      .from("applications")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    await supabase
      .from("notifications")
      .insert({
        user_id: application.student_id,
        type: "APPLICATION_UPDATE",
        message: `Your application for ${application.project.title} was ${status.toLowerCase()}`,
        link: `/projects/${application.project_id}`,
      });
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
