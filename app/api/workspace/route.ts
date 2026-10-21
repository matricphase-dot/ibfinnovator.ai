import { NextResponse } from "next/server";
import { requireUser } from "@/lib/supabase/server";
import { getActiveWorkspace, Workspace } from "@/lib/workspace";

export async function GET(req: Request) {
  try {
    const { supabase, user } = await requireUser();
    const { searchParams } = new URL(req.url);
    const requestedWorkspaceId = searchParams.get("workspace_id");

    // 1. Fetch user profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("id, name, username, avatar_url, role")
      .eq("id", user.id)
      .maybeSingle();

    // 2. Fetch all workspaces user is member of
    const { data: memberWorkspaces } = await supabase
      .from("workspace_members")
      .select("workspace:workspaces(*)")
      .eq("user_id", user.id);

    let workspaces: Workspace[] = (memberWorkspaces || [])
      .map((m: any) => m.workspace)
      .filter(Boolean);

    // 3. Determine active workspace
    let activeWorkspace: Workspace | null = null;
    if (requestedWorkspaceId) {
      activeWorkspace = workspaces.find((w) => w.id === requestedWorkspaceId) || null;
    }
    if (!activeWorkspace && workspaces.length > 0) {
      activeWorkspace = workspaces[0];
    }
    if (!activeWorkspace) {
      activeWorkspace = await getActiveWorkspace(supabase, user.id);
      if (activeWorkspace && !workspaces.some((w) => w.id === activeWorkspace!.id)) {
        workspaces.push(activeWorkspace);
      }
    }

    // 4. Fetch projects
    let projectsQuery = supabase
      .from("projects")
      .select("id, title, name, identifier, domain, stage, description, workspace_id, created_at")
      .order("created_at", { ascending: false });

    if (activeWorkspace) {
      projectsQuery = projectsQuery.or(`workspace_id.eq.${activeWorkspace.id},workspace_id.is.null`);
    }

    const { data: projectsData, error: projectsError } = await projectsQuery;
    if (projectsError) throw projectsError;

    const rawProjects = projectsData || [];
    const projectIds = rawProjects.map((p) => p.id);

    // Batch query counts in 4 parallel queries instead of 4 * N queries
    const issueCounts: Record<string, number> = {};
    const cycleCounts: Record<string, number> = {};
    const moduleCounts: Record<string, number> = {};
    const pageCounts: Record<string, number> = {};

    if (projectIds.length > 0) {
      const [issuesRes, cyclesRes, modulesRes, pagesRes] = await Promise.all([
        supabase
          .from("issues")
          .select("project_id")
          .in("project_id", projectIds),
        supabase
          .from("cycles")
          .select("project_id")
          .in("project_id", projectIds)
          .in("status", ["current", "in_progress", "active"]),
        supabase
          .from("modules")
          .select("project_id")
          .in("project_id", projectIds),
        supabase
          .from("pages")
          .select("project_id")
          .in("project_id", projectIds),
      ]);

      (issuesRes.data || []).forEach((row: any) => {
        if (row.project_id) issueCounts[row.project_id] = (issueCounts[row.project_id] || 0) + 1;
      });
      (cyclesRes.data || []).forEach((row: any) => {
        if (row.project_id) cycleCounts[row.project_id] = (cycleCounts[row.project_id] || 0) + 1;
      });
      (modulesRes.data || []).forEach((row: any) => {
        if (row.project_id) moduleCounts[row.project_id] = (moduleCounts[row.project_id] || 0) + 1;
      });
      (pagesRes.data || []).forEach((row: any) => {
        if (row.project_id) pageCounts[row.project_id] = (pageCounts[row.project_id] || 0) + 1;
      });
    }

    const projectsWithCounts = rawProjects.map((project) => ({
      id: project.id,
      name: project.name || project.title || "Untitled Project",
      identifier: project.identifier || (project.name || project.title || "INN").slice(0, 3).toUpperCase(),
      domain: project.domain,
      stage: project.stage,
      description: project.description,
      workspace_id: project.workspace_id,
      created_at: project.created_at,
      issue_count: issueCounts[project.id] || 0,
      active_cycle_count: cycleCounts[project.id] || 0,
      module_count: moduleCounts[project.id] || 0,
      page_count: pageCounts[project.id] || 0,
    }));

    return NextResponse.json({
      workspace: activeWorkspace,
      workspaces,
      projects: projectsWithCounts,
      userProfile: {
        id: user.id,
        email: user.email,
        name: profile?.name || user.email?.split("@")[0] || "IBF Member",
        avatar_url: profile?.avatar_url,
        role: profile?.role || "Member",
      },
    });
  } catch (err: any) {
    console.error("Workspace GET error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to fetch workspace context" },
      { status: 500 }
    );
  }
}
