import { NextResponse } from "next/server";
import { requireUser } from "@/lib/supabase/server";
import { z } from "zod";
const input = z.object({
  project_id: z.string().uuid(),
  cover_letter: z.string().trim().min(30).max(3000),
  resume_url: z.string().url().optional(),
});
export async function GET() {
  try {
    const { supabase, user } = await requireUser();
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    let q = supabase
      .from("applications")
      .select(
        "*,student:profiles!student_id(id,name,avatar_url,skills,availability),project:projects(id,title,founder_id)",
      )
      .order("created_at", { ascending: false });
    if (profile?.role === "FOUNDER") {
      const { data: projects } = await supabase
        .from("projects")
        .select("id")
        .eq("founder_id", user.id);
      q = q.in(
        "project_id",
        (projects || []).map((x) => x.id),
      );
    } else q = q.eq("student_id", user.id);
    const { data, error } = await q;
    if (error) throw error;
    return NextResponse.json(data || []);
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
    const p = input.safeParse(await r.json());
    if (!p.success)
      return NextResponse.json({ error: p.error.flatten() }, { status: 400 });
    const { data: project } = await supabase
      .from("projects")
      .select("founder_id,status,title")
      .eq("id", p.data.project_id)
      .single();
    if (!project || project.status !== "OPEN")
      return NextResponse.json(
        { error: "This project is not accepting applications." },
        { status: 400 },
      );
    if (project.founder_id === user.id)
      return NextResponse.json(
        { error: "You cannot apply to your own project." },
        { status: 400 },
      );
    const { data, error } = await supabase
      .from("applications")
      .insert({ ...p.data, student_id: user.id })
      .select()
      .single();
    if (error) {
      if (error.code === "23505")
        return NextResponse.json(
          { error: "You already applied to this project." },
          { status: 409 },
        );
      throw error;
    }
    await supabase
      .from("notifications")
      .insert({
        user_id: project.founder_id,
        type: "NEW_APPLICATION",
        message: `New application for ${project.title}`,
        link: "/dashboard",
      });
    return NextResponse.json(data, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
