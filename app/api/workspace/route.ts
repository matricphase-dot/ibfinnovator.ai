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
      activeWorkspace = await getActiveWorkspace(supabase, user.id, requestedWorkspaceId);
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
      projectsQuery = projectsQuery.eq("workspace_id", activeWorkspace.id);
    } else {
      projectsQuery = projectsQuery.eq("founder_id", user.id);
    }

    const { data: projectsData, error: projectsError } = await projectsQuery;
    if (projectsError) throw projectsError;

    const rawProjects = projectsData || [];
    const projectIds = rawProjects.map((p) => p.id);

    // Optimized SQL count queries via RPC (single round-trip, zero rows over wire)
    const issueCounts: Record<string, number> = {};
    const cycleCounts: Record<string, number> = {};
    const moduleCounts: Record<string, number> = {};
    const pageCounts: Record<string, number> = {};

    if (projectIds.length > 0) {
      const { data: countData, error: countErr } = await supabase.rpc(
        "get_workspace_project_counts",
        { p_project_ids: projectIds },
      );

      if (!countErr && Array.isArray(countData) && countData.length > 0) {
        for (const row of countData as any[]) {
          issueCounts[row.project_id] = Number(row.issue_count || 0);
          cycleCounts[row.project_id] = Number(row.active_cycle_count || 0);
          moduleCounts[row.project_id] = Number(row.module_count || 0);
          pageCounts[row.project_id] = Number(row.page_count || 0);
        }
      } else {
        // Fallback: parallel count queries with head: true
        await Promise.all(
          projectIds.map(async (pid) => {
            const [issues, cycles, modules, pages] = await Promise.all([
              supabase
                .from("issues")
                .select("*", { count: "exact", head: true })
                .eq("project_id", pid),
              supabase
                .from("cycles")
                .select("*", { count: "exact", head: true })
                .eq("project_id", pid)
                .in("status", ["current", "in_progress", "active"]),
              supabase
                .from("modules")
                .select("*", { count: "exact", head: true })
                .eq("project_id", pid),
              supabase
                .from("pages")
                .select("*", { count: "exact", head: true })
                .eq("project_id", pid),
            ]);
            issueCounts[pid] = issues.count || 0;
            cycleCounts[pid] = cycles.count || 0;
            moduleCounts[pid] = modules.count || 0;
            pageCounts[pid] = pages.count || 0;
          }),
        );
      }
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
