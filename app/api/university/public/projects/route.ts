import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
export async function GET(r: Request) {
  const key = r.headers.get("x-api-key");
  if (!key)
    return NextResponse.json({ error: "Missing API key" }, { status: 401 });
  const { data: u } = await supabaseAdmin
    .from("universities")
    .select("id,name,domain")
    .eq("api_key", key)
    .eq("active", true)
    .maybeSingle();
  if (!u)
    return NextResponse.json({ error: "Invalid API key" }, { status: 401 });
  const { data, error } = await supabaseAdmin
    .from("projects")
    .select(
      "id,title,description,domain,stage,required_skills,engagement_type,commitment_hours,duration_weeks",
    )
    .eq("status", "OPEN")
    .order("created_at", { ascending: false });
  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ university: u.name, projects: data || [] });
}
