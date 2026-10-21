import { NextResponse } from "next/server";
import { requireUser } from "@/lib/supabase/server";

export async function GET(req: Request) {
  try {
    const { supabase, user } = await requireUser();
    const { searchParams } = new URL(req.url);

    const assigned = searchParams.get("assigned");
    const created = searchParams.get("created");
    const q = searchParams.get("q");
    const state = searchParams.get("state");
    const priority = searchParams.get("priority");
    const limit = Math.min(Number(searchParams.get("limit")) || 50, 100);

    let query = supabase
      .from("issues")
      .select(`
        *,
        project:projects!project_id(id, title, name, identifier),
        assignee:profiles!assignee_id(id, name, avatar_url),
        created_by_profile:profiles!created_by(id, name, avatar_url),
        cycle:cycles!cycle_id(id, name, status),
        module:modules!module_id(id, name, status)
      `)
      .order("updated_at", { ascending: false })
      .limit(limit);

    if (assigned === "true") {
      query = query.eq("assignee_id", user.id);
    }

    if (created === "true") {
      query = query.eq("created_by", user.id);
    }

    if (state) {
      query = query.eq("state", state);
    }

    if (priority) {
      query = query.eq("priority", priority);
    }

    if (q) {
      const sanitized = q.replace(/[%,"'()*.[\]]/g, "").trim().slice(0, 80);
      if (sanitized) {
        query = query.or(`title.ilike.%${sanitized}%,description.ilike.%${sanitized}%`);
      }
    }

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json({ issues: data || [] });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to query issues" },
      { status: 500 }
    );
  }
}
