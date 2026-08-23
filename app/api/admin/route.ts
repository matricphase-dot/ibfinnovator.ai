import { NextResponse } from "next/server";
import { requireUser } from "@/lib/supabase/server";
import { z } from "zod";
async function admin(s: any, id: string) {
  const { data } = await s
    .from("profiles")
    .select("role")
    .eq("id", id)
    .single();
  return data?.role === "SUPER_ADMIN";
}
export async function GET() {
  try {
    const { supabase, user } = await requireUser();
    if (!(await admin(supabase, user.id)))
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const [
      { data: users, count: userCount },
      { data: projects, count: projectCount },
      { data: reports },
      { data: inquiries },
    ] = await Promise.all([
      supabase
        .from("profiles")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false })
        .limit(100),
      supabase
        .from("projects")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false })
        .limit(100),
      supabase
        .from("reports")
        .select(
          "*,reporter:profiles!reporter_id(name),reported:profiles!reported_user_id(name)",
        )
        .order("created_at", { ascending: false }),
      supabase
        .from("investor_inquiries")
        .select("*")
        .order("created_at", { ascending: false }),
    ]);
    return NextResponse.json({
      users: users || [],
      projects: projects || [],
      reports: reports || [],
      inquiries: inquiries || [],
      stats: {
        users: userCount || 0,
        projects: projectCount || 0,
        openReports:
          reports?.filter((x: any) => x.status === "OPEN").length || 0,
      },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
export async function PATCH(r: Request) {
  try {
    const { supabase, user } = await requireUser();
    if (!(await admin(supabase, user.id)))
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const p = z
      .discriminatedUnion("type", [
        z.object({
          type: z.literal("USER"),
          id: z.string().uuid(),
          suspended: z.boolean().optional(),
          verification_status: z.string().optional(),
          role: z.enum(["FOUNDER", "STUDENT", "SUPER_ADMIN"]).optional(),
        }),
        z.object({
          type: z.literal("REPORT"),
          id: z.string().uuid(),
          status: z.enum(["OPEN", "REVIEWING", "RESOLVED", "DISMISSED"]),
        }),
      ])
      .parse(await r.json());
    const table = p.type === "USER" ? "profiles" : "reports";
    const { type, id, ...changes } = p;
    const { data, error } = await supabase
      .from(table)
      .update(changes)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
