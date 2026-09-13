import { NextResponse } from "next/server";
import { requireUser } from "@/lib/supabase/server";
export async function GET() {
  try {
    const { supabase, user } = await requireUser();
    if (user.role !== "FOUNDER" && user.role !== "SUPER_ADMIN")
      return NextResponse.json(
        { error: "Founder account required" },
        { status: 403 },
      );
    const since = new Date(Date.now() - 30 * 86400000).toISOString();
    const { data: projects, error } = await supabase
      .from("projects")
      .select("id,status,created_at")
      .eq("founder_id", user.id);
    if (error) throw error;
    const ids = (projects || []).map((p) => p.id);
    const [
      { data: apps },
      { data: connections },
      { data: messages },
      { data: views },
    ] = await Promise.all([
      ids.length
        ? supabase
            .from("applications")
            .select("id,status,project_id,created_at")
            .in("project_id", ids)
            .gte("created_at", since)
        : Promise.resolve({ data: [] }),
      ids.length
        ? supabase
            .from("connections")
            .select("id,status,project_id,created_at")
            .in("project_id", ids)
            .gte("created_at", since)
        : Promise.resolve({ data: [] }),
      supabase
        .from("messages")
        .select("id,created_at")
        .eq("sender_id", user.id)
        .gte("created_at", since),
      supabase
        .from("analytics_events")
        .select("id,created_at,metadata")
        .eq("event_type", "view_project")
        .gte("created_at", since),
    ]);
    const statusCounts = (projects || []).reduce(
        (a: any, p: any) => ((a[p.status] = (a[p.status] || 0) + 1), a),
        {},
      ),
      firstTimes = (projects || [])
        .map((p) => {
          const first = (apps || [])
            .filter((a: any) => a.project_id === p.id)
            .sort(
              (a: any, b: any) =>
                +new Date(a.created_at) - +new Date(b.created_at),
            )[0];
          return first
            ? (+new Date(first.created_at) - +new Date(p.created_at)) / 3600000
            : null;
        })
        .filter((x: number | null): x is number => x !== null),
      daily = Array.from({ length: 30 }, (_, i) => {
        const date = new Date(Date.now() - (29 - i) * 86400000)
          .toISOString()
          .slice(0, 10);
        return {
          date,
          applications: (apps || []).filter(
            (x: any) => x.created_at.slice(0, 10) === date,
          ).length,
          connections: (connections || []).filter(
            (x: any) => x.created_at.slice(0, 10) === date,
          ).length,
          messages: (messages || []).filter(
            (x: any) => x.created_at.slice(0, 10) === date,
          ).length,
        };
      });
    return NextResponse.json({
      projectsByStatus: statusCounts,
      daily,
      timeToFirstApplicationHours: firstTimes.length
        ? Math.round(
            firstTimes.reduce((a: number, b: number) => a + b, 0) /
              firstTimes.length,
          )
        : null,
      completionRate: projects?.length
        ? Math.round(((statusCounts.COMPLETED || 0) / projects.length) * 100)
        : 0,
      funnel: {
        views: views?.length || 0,
        applications: apps?.length || 0,
        accepted: (apps || []).filter((x: any) => x.status === "ACCEPTED")
          .length,
        completed: statusCounts.COMPLETED || 0,
      },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
