import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
export async function GET(r: Request) {
  const key = r.headers.get("x-api-key");
  if (!key)
    return NextResponse.json({ error: "Missing API key" }, { status: 401 });
  const { data: u } = await supabaseAdmin
    .from("universities")
    .select("id,name")
    .eq("api_key", key)
    .eq("active", true)
    .maybeSingle();
  if (!u)
    return NextResponse.json({ error: "Invalid API key" }, { status: 401 });
  const { data, error } = await supabaseAdmin
    .from("university_members")
    .select(
      "profile:profiles!user_id(id,name,username,skills,availability,avatar_url)",
    )
    .eq("university_id", u.id)
    .eq("verified", true);
  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({
    university: u.name,
    students: (data || []).map((x: any) => x.profile),
  });
}
