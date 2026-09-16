import { NextResponse, type NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

/**
 * Partner feed: projects currently open to collaborators.
 *
 *   GET /api/university/public/projects   header: x-api-key: <universities.api_key>
 *   -> { university: { id, name }, count, projects: [...] }
 *
 * Returns every OPEN project (not only those founded by the university's own
 * members) because that is what a partner portal is for — showing students what
 * they could join. No founder identity is included: founders are people, and
 * this feed has no consent to publish them.
 */

const PUBLIC_PROJECT_COLUMNS =
  "id,title,tagline,description,domain,stage,required_skills,engagement_type,commitment_hours,duration_weeks,created_at";

export async function GET(request: NextRequest) {
  const key = request.headers.get("x-api-key")?.trim();
  if (!key) {
    return NextResponse.json(
      { error: "Missing x-api-key header." },
      { status: 401 },
    );
  }

  try {
    const { data: university, error: lookupError } = await supabaseAdmin
      .from("universities")
      .select("id,name,active")
      .eq("api_key", key)
      .maybeSingle();

    if (lookupError) throw lookupError;
    if (!university) {
      return NextResponse.json({ error: "Unknown API key." }, { status: 401 });
    }
    if (!university.active) {
      return NextResponse.json(
        { error: "This university's API key is disabled." },
        { status: 403 },
      );
    }

    const { data, error } = await supabaseAdmin
      .from("projects")
      .select(PUBLIC_PROJECT_COLUMNS)
      .eq("status", "OPEN")
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) throw error;

    return NextResponse.json({
      university: { id: university.id, name: university.name },
      count: (data ?? []).length,
      projects: data ?? [],
    });
  } catch (e: any) {
    console.error("university/public/projects failed:", e?.message);
    return NextResponse.json(
      { error: "Unable to load open projects." },
      { status: 500 },
    );
  }
}
