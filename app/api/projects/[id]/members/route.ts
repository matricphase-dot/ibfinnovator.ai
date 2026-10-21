import { NextResponse } from "next/server";
import { requireUser } from "@/lib/supabase/server";

export async function GET(
  _: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;
    const { supabase } = await requireUser();

    // 1. Fetch project to get founder and workspace_id
    const { data: project, error: projErr } = await supabase
      .from("projects")
      .select("id, founder_id, workspace_id")
      .eq("id", projectId)
      .single();

    if (projErr || !project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const memberIds = new Set<string>();
    if (project.founder_id) memberIds.add(project.founder_id);

    // 2. Fetch workspace members if workspace_id exists
    if (project.workspace_id) {
      const { data: wsMembers } = await supabase
        .from("workspace_members")
        .select("user_id")
        .eq("workspace_id", project.workspace_id);

      (wsMembers || []).forEach((m: any) => {
        if (m.user_id) memberIds.add(m.user_id);
      });
    }

    // 3. Fetch team members if team room exists
    const { data: teamRoom } = await supabase
      .from("team_rooms")
      .select("id")
      .eq("project_id", projectId)
      .maybeSingle();

    if (teamRoom?.id) {
      const { data: tmMembers } = await supabase
        .from("team_members")
        .select("user_id")
        .eq("room_id", teamRoom.id);

      (tmMembers || []).forEach((m: any) => {
        if (m.user_id) memberIds.add(m.user_id);
      });
    }

    if (memberIds.size === 0) {
      return NextResponse.json([]);
    }

    // 4. Fetch profiles for all unique member IDs
    const { data: profiles, error: profErr } = await supabase
      .from("profiles")
      .select("id, name, full_name, username, avatar_url")
      .in("id", Array.from(memberIds));

    if (profErr) throw profErr;

    return NextResponse.json(profiles || []);
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to fetch project members" },
      { status: err.message === "UNAUTHORIZED" ? 401 : 500 }
    );
  }
}
