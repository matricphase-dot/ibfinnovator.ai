import { NextResponse } from "next/server";
import { requireUser } from "@/lib/supabase/server";
import { z } from "zod";
export async function GET() {
  try {
    const { supabase, user } = await requireUser();
    const { data, error } = await supabase
      .from("certificates")
      .select(
        "*,project:projects(id,title),issuer:profiles!issued_by(id,name),receiver:profiles!receiver_id(id,name)",
      )
      .eq("receiver_id", user.id)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return NextResponse.json(data || []);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 401 });
  }
}
export async function POST(r: Request) {
  try {
    const { supabase, user } = await requireUser(),
      p = z
        .object({
          receiver_id: z.string().uuid(),
          project_id: z.string().uuid(),
          role_title: z.string().trim().min(2).max(120),
          started_at: z.string().optional(),
          completed_at: z.string().optional(),
        })
        .parse(await r.json());
    if (p.receiver_id === user.id)
      return NextResponse.json(
        { error: "You cannot issue credentials to yourself." },
        { status: 400 },
      );
    const { data: project } = await supabase
      .from("projects")
      .select("founder_id")
      .eq("id", p.project_id)
      .single();
    if (project?.founder_id !== user.id)
      return NextResponse.json(
        { error: "Only the project founder can issue certificates." },
        { status: 403 },
      );
    const { data: connection } = await supabase
      .from("connections")
      .select("id")
      .eq("project_id", p.project_id)
      .eq("status", "ACCEPTED")
      .or(`requester_id.eq.${p.receiver_id},recipient_id.eq.${p.receiver_id}`)
      .maybeSingle();
    if (!connection)
      return NextResponse.json(
        { error: "Receiver is not an accepted collaborator." },
        { status: 400 },
      );
    const row = {
      ...p,
      issued_by: user.id,
      started_at: p.started_at || null,
      completed_at: p.completed_at || null,
    };
    const { data, error } = await supabase
      .from("certificates")
      .insert(row)
      .select()
      .single();
    if (error) {
      if (error.code === "23505")
        return NextResponse.json(
          {
            error:
              "A certificate already exists for this collaborator and project.",
          },
          { status: 409 },
        );
      throw error;
    }
    await supabase
      .from("notifications")
      .insert({
        user_id: p.receiver_id,
        type: "CERTIFICATE_ISSUED",
        message: "A verified experience certificate was issued to you",
        link: "/credentials",
      });
    return NextResponse.json(data, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
