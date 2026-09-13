import { NextResponse } from "next/server";
import { supabasePublic } from "@/lib/supabase/public";
export async function GET() {
  const { data, error } = await supabasePublic
    .from("profiles")
    .select(
      "id,name,username,company,industry,investor_pitch,avatar_url,projects!founder_id(id,title,stage,domain,status)",
    )
    .eq("investor_visible", true)
    .eq("role", "FOUNDER")
    .eq("suspended", false);
  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(
    (data || []).map((p: any) => {
      const project =
        (p.projects || []).find((x: any) => x.status === "OPEN") ||
        p.projects?.[0];
      return {
        id: p.id,
        name: p.name,
        username: p.username,
        company: p.company,
        industry: p.industry,
        stage: project?.stage,
        pitch: p.investor_pitch,
        avatar_url: p.avatar_url,
        project: project
          ? { id: project.id, title: project.title, domain: project.domain }
          : null,
      };
    }),
  );
}
