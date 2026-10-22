import { NextResponse } from "next/server";
import { requireUser } from "@/lib/supabase/server";

export async function GET(req: Request) {
  try {
    const { supabase } = await requireUser();
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q")?.trim() || "";
    const projectId = searchParams.get("projectId") || undefined;

    if (!q || q.length < 1) {
      return NextResponse.json({
        issues: [],
        projects: [],
        cycles: [],
        modules: [],
        pages: [],
      });
    }

    // Sanitize query for ILIKE and PostgreSQL safety
    const sanitized = q.replace(/[%,"'()*.[\]]/g, "").trim().slice(0, 80);
    if (!sanitized) {
      return NextResponse.json({
        issues: [],
        projects: [],
        cycles: [],
        modules: [],
        pages: [],
      });
    }

    // Check if query is looking for sequence id (e.g. "INN-42", "#42", "42")
    const seqMatch = sanitized.match(/(?:[a-zA-Z]+-)?(\d+)/);
    const seqNum = seqMatch ? parseInt(seqMatch[1], 10) : null;

    // Run parallel queries across workspace domains
    const [issuesPromise, projectsPromise, cyclesPromise, modulesPromise, pagesPromise] = await Promise.all([
      // 1. Issues Search
      (async () => {
        let query = supabase
          .from("issues")
          .select(`
            id,
            sequence_id,
            title,
            description,
            state,
            priority,
            project_id,
            project:projects!project_id(id, title, name, identifier)
          `)
          .limit(10);

        if (projectId) {
          query = query.eq("project_id", projectId);
        }

        if (seqNum !== null && !isNaN(seqNum)) {
          query = query.or(`sequence_id.eq.${seqNum},title.ilike.%${sanitized}%,description.ilike.%${sanitized}%`);
        } else {
          query = query.or(`title.ilike.%${sanitized}%,description.ilike.%${sanitized}%`);
        }

        const { data, error } = await query;
        if (error) {
          console.error("Workspace search issues error:", error);
          return [];
        }
        return data || [];
      })(),

      // 2. Projects Search
      (async () => {
        const { data, error } = await supabase
          .from("projects")
          .select("id, title, name, identifier, description")
          .or(`title.ilike.%${sanitized}%,name.ilike.%${sanitized}%,identifier.ilike.%${sanitized}%`)
          .limit(8);

        if (error) {
          console.error("Workspace search projects error:", error);
          return [];
        }
        return data || [];
      })(),

      // 3. Cycles Search
      (async () => {
        let query = supabase
          .from("cycles")
          .select("id, name, status, project_id, project:projects!project_id(id, title, name, identifier)")
          .ilike("name", `%${sanitized}%`)
          .limit(8);

        if (projectId) {
          query = query.eq("project_id", projectId);
        }

        const { data, error } = await query;
        if (error) {
          console.error("Workspace search cycles error:", error);
          return [];
        }
        return data || [];
      })(),

      // 4. Modules Search
      (async () => {
        let query = supabase
          .from("modules")
          .select("id, name, status, project_id, project:projects!project_id(id, title, name, identifier)")
          .or(`name.ilike.%${sanitized}%,description.ilike.%${sanitized}%`)
          .limit(8);

        if (projectId) {
          query = query.eq("project_id", projectId);
        }

        const { data, error } = await query;
        if (error) {
          console.error("Workspace search modules error:", error);
          return [];
        }
        return data || [];
      })(),

      // 5. Pages Search
      (async () => {
        let query = supabase
          .from("pages")
          .select(`
            id,
            title,
            is_favorite,
            updated_at,
            project_id,
            project:projects!project_id(id, title, name, identifier),
            author:profiles!created_by(id, name, full_name, username, avatar_url)
          `)
          .or(`title.ilike.%${sanitized}%,content_markdown.ilike.%${sanitized}%`)
          .limit(8);

        if (projectId) {
          query = query.eq("project_id", projectId);
        }

        const { data, error } = await query;
        if (error) {
          console.error("Workspace search pages error:", error);
          return [];
        }
        return data || [];
      })(),
    ]);

    return NextResponse.json({
      issues: issuesPromise,
      projects: projectsPromise,
      cycles: cyclesPromise,
      modules: modulesPromise,
      pages: pagesPromise,
    });
  } catch (err: any) {
    console.error("Workspace search fatal error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to execute workspace search" },
      { status: err.message === "UNAUTHORIZED" ? 401 : 500 }
    );
  }
}
