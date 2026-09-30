import { NextResponse } from "next/server";
import { requireUser } from "@/lib/supabase/server";
import { z } from "zod";
export async function GET() {
  try {
    const { supabase, user } = await requireUser();
    const { data: membership } = await supabase
      .from("university_members")
      .select("*,university:universities(id,name,domain,logo_url,active)")
      .eq("user_id", user.id)
      .maybeSingle();
    if (!membership) {
      const { data: universities } = await supabase
        .from("universities")
        .select("id,name,domain")
        .eq("active", true)
        .order("name");
      return NextResponse.json({
        membership: null,
        role: user.role,
        universities: universities || [],
        students: [],
        projects: [],
      });
    }
    const [{ data: members }, { data: projects }] = await Promise.all([
      supabase
        .from("university_members")
        .select(
          "*,profile:profiles!user_id(id,name,username,skills,interests,availability,avatar_url)",
        )
        .eq("university_id", membership.university_id),
      supabase
        .from("projects")
        .select("*,founder:profiles!founder_id(name,username)")
        .eq("status", "OPEN")
        .order("created_at", { ascending: false }),
    ]);
    return NextResponse.json({
      membership,
      role: user.role,
      students: members || [],
      projects: projects || [],
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 401 });
  }
}
export async function POST(r: Request) {
  try {
    const { supabase } = await requireUser(),
      { university_id } = z
        .object({ university_id: z.string().uuid() })
        .parse(await r.json());
    const { data, error } = await supabase.rpc("join_university", {
      p_university_id: university_id,
    });
    if (error) throw error;
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
