import { NextResponse } from "next/server";
import { requireUser } from "@/lib/supabase/server";
import { z } from "zod";
const input = z.object({
  recipient_id: z.string().uuid(),
  project_id: z.string().uuid().nullable().optional(),
  type: z.enum(["PROJECT", "COFOUNDER"]).default("PROJECT"),
});
export async function GET() {
  try {
    const { supabase, user } = await requireUser();
    const { data, error } = await supabase
      .from("connections")
      .select(
        "*,requester:profiles!requester_id(id,name,avatar_url),recipient:profiles!recipient_id(id,name,avatar_url),project:projects(id,title)",
      )
      .or(`requester_id.eq.${user.id},recipient_id.eq.${user.id}`)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 401 });
  }
}
export async function POST(r: Request) {
  try {
    const { supabase, user } = await requireUser();
    const p = input.safeParse(await r.json());
    if (!p.success)
      return NextResponse.json({ error: p.error.flatten() }, { status: 400 });
    if (p.data.recipient_id === user.id)
      return NextResponse.json(
        { error: "You cannot send a connection request to yourself." },
        { status: 400 },
      );
    if (p.data.project_id) {
      const { data: project, error: projectError } = await supabase
        .from("projects")
        .select("founder_id,status")
        .eq("id", p.data.project_id)
        .single();
      if (projectError)
        return NextResponse.json(
          { error: "Project not found." },
          { status: 404 },
        );
      if (project.founder_id !== p.data.recipient_id)
        return NextResponse.json(
          { error: "The selected recipient does not own this project." },
          { status: 400 },
        );
      if (project.status !== "OPEN")
        return NextResponse.json(
          { error: "This project is not accepting new connections." },
          { status: 400 },
        );
    }
    const { data: existing } = await supabase
      .from("connections")
      .select("id,status")
      .eq("requester_id", user.id)
      .eq("recipient_id", p.data.recipient_id)
      .eq("project_id", p.data.project_id || "")
      .maybeSingle();
    if (existing)
      return NextResponse.json(
        {
          error: `A connection request already exists (${existing.status.toLowerCase()}).`,
          connection: existing,
        },
        { status: 409 },
      );
    const { data, error } = await supabase
      .from("connections")
      .insert({ ...p.data, requester_id: user.id })
      .select()
      .single();
    if (error) {
      if (error.code === "23505")
        return NextResponse.json(
          { error: "A connection request already exists." },
          { status: 409 },
        );
      throw error;
    }
    await supabase
      .from("notifications")
      .insert({
        user_id: p.data.recipient_id,
        type: "CONNECTION_REQUEST",
        message: "You have a new connection request",
        link: "/dashboard",
      });
    return NextResponse.json(data, { status: 201 });
  } catch (e: any) {
    return NextResponse.json(
      {
        error:
          e.message === "UNAUTHORIZED"
            ? "Sign in before sending a connection request."
            : e.message,
      },
      { status: e.message === "UNAUTHORIZED" ? 401 : 400 },
    );
  }
}
