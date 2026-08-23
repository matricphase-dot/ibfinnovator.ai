import { NextResponse } from "next/server";
import { requireUser } from "@/lib/supabase/server";
export async function GET(
  _: Request,
  { params }: { params: Promise<{ projectId: string }> },
) {
  try {
    const { projectId } = await params,
      { supabase, user } = await requireUser();
    const { data: project } = await supabase
      .from("projects")
      .select("id,title,founder_id")
      .eq("id", projectId)
      .single();
    if (!project)
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    const { data: connection } = await supabase
      .from("connections")
      .select("id")
      .eq("project_id", projectId)
      .eq("status", "ACCEPTED")
      .or(`requester_id.eq.${user.id},recipient_id.eq.${user.id}`)
      .maybeSingle();
    if (project.founder_id !== user.id && !connection)
      return NextResponse.json(
        { error: "Team membership required." },
        { status: 403 },
      );
    let { data: room } = await supabase
      .from("team_rooms")
      .select("*")
      .eq("project_id", projectId)
      .maybeSingle();
    if (!room && project.founder_id === user.id) {
      const r = await supabase
        .from("team_rooms")
        .insert({
          project_id: projectId,
          name: project.title,
          channels: ["General", "Development", "Design", "Marketing"],
        })
        .select()
        .single();
      room = r.data;
      if (room)
        await supabase
          .from("team_members")
          .insert({ room_id: room.id, user_id: user.id, role: "ADMIN" });
    }
    if (!room)
      return NextResponse.json(
        { error: "The founder has not opened the team room yet." },
        { status: 404 },
      );
    if (connection) {
      const { data: member } = await supabase
        .from("team_members")
        .select("user_id")
        .eq("room_id", room.id)
        .eq("user_id", user.id)
        .maybeSingle();
      if (!member)
        await supabase
          .from("team_members")
          .insert({ room_id: room.id, user_id: user.id, role: "MEMBER" });
    }
    const [{ data: members }, { data: messages }, { data: tasks }] =
      await Promise.all([
        supabase
          .from("team_members")
          .select("*,profile:profiles!user_id(id,name,avatar_url,skills)")
          .eq("room_id", room.id),
        supabase
          .from("messages")
          .select("*,sender:profiles!sender_id(id,name,avatar_url)")
          .eq("room_id", room.id)
          .eq("room_type", "TEAM")
          .order("created_at")
          .limit(100),
        supabase
          .from("team_tasks")
          .select("*,assignee:profiles!assignee_id(id,name)")
          .eq("room_id", room.id)
          .order("sort_order"),
      ]);
    return NextResponse.json({
      project,
      room,
      members: members || [],
      messages: messages || [],
      tasks: tasks || [],
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message },
      { status: e.message === "UNAUTHORIZED" ? 401 : 500 },
    );
  }
}
