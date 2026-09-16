import { NextResponse } from "next/server";
import { requireUserOr401 } from "@/lib/auth/require-user-http";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";

/**
 * Founder insights — one request for the whole dashboard.
 *
 *   GET /api/analytics/founder
 *
 * Everything here comes from tables the founder can already read through RLS
 * (projects, applications, connections, messages). Nothing is invented: where a
 * signal does not exist yet it is reported as absent rather than estimated.
 *
 * The one exception is funnel views. `analytics_events` is readable only by the
 * member it belongs to — it records the *viewer* — so a founder cannot count
 * other people's project views today. That number is returned as 0 with
 * `views_available: false` so the UI can say "not measured yet" instead of
 * showing a confident zero.
 *
 * Response:
 *   {
 *     projects_by_status, totals, last_30_days,
 *     avg_days_to_first_application, completion_rate,
 *     funnel: { views, views_available, applications, accepted, completed },
 *     series:   [{ day, applications }]  // 30 entries, oldest first
 *     projects: [{ id, title, status, applications, days_to_first_application }]
 *   }
 */

const DAY_MS = 86_400_000;
const SERIES_DAYS = 30;

function dayKey(value: string | Date) {
  return new Date(value).toISOString().slice(0, 10);
}

export async function GET() {
  const auth = await requireUserOr401();
  if (auth.response) return auth.response;
  const { supabase, user } = auth.session;

  try {
    // Several aggregate queries per call, so a refresh loop is worth capping.
    const limit = await checkRateLimit(supabase, {
      bucket: "analytics_founder",
      // No request object on GET; the caller is always keyed by their own id.
      key: `u:${user.id}`,
      limit: 60,
      windowSeconds: 3600,
    });
    if (!limit.allowed) return rateLimitResponse(limit);

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError) throw profileError;
    if (!profile) {
      return NextResponse.json({ error: "Profile not found." }, { status: 404 });
    }
    // SUPER_ADMIN is treated as founder-capable throughout the app (it is what
    // the sidebar keys off), so the same rule applies here.
    if (profile.role !== "FOUNDER" && profile.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "Founder insights are available to founder accounts." },
        { status: 403 },
      );
    }

    const cutoff = new Date(Date.now() - SERIES_DAYS * DAY_MS).toISOString();

    const { data: projects, error: projectsError } = await supabase
      .from("projects")
      .select("id,title,status,created_at")
      .eq("founder_id", user.id)
      .order("created_at", { ascending: false });
    if (projectsError) throw projectsError;

    const projectIds = (projects ?? []).map((project: any) => project.id);

    // applications table is small per founder; one query beats N per project.
    let applications: any[] = [];
    if (projectIds.length) {
      const { data, error } = await supabase
        .from("applications")
        .select("id,project_id,status,created_at")
        .in("project_id", projectIds)
        .order("created_at");
      if (error) throw error;
      applications = data ?? [];
    }

    const [connections, messages] = await Promise.all([
      supabase
        .from("connections")
        .select("*", { count: "exact", head: true })
        .gte("created_at", cutoff)
        .or(`requester_id.eq.${user.id},recipient_id.eq.${user.id}`),
      supabase
        .from("messages")
        .select("*", { count: "exact", head: true })
        .eq("sender_id", user.id)
        .gte("created_at", cutoff),
    ]);
    if (connections.error) throw connections.error;
    if (messages.error) throw messages.error;

    // --- projects by status + completion rate -----------------------------
    const projectsByStatus: Record<string, number> = {
      OPEN: 0,
      CLOSED: 0,
      COMPLETED: 0,
    };
    for (const project of projects ?? []) {
      projectsByStatus[project.status] = (projectsByStatus[project.status] ?? 0) + 1;
    }
    const totalProjects = (projects ?? []).length;

    // --- first application per project ------------------------------------
    const firstApplication = new Map<string, string>();
    for (const application of applications) {
      const current = firstApplication.get(application.project_id);
      if (!current || application.created_at < current) {
        firstApplication.set(application.project_id, application.created_at);
      }
    }

    const perProject = (projects ?? []).map((project: any) => {
      const first = firstApplication.get(project.id);
      return {
        id: project.id,
        title: project.title,
        status: project.status,
        applications: applications.filter((a) => a.project_id === project.id).length,
        days_to_first_application: first
          ? Number(
              ((new Date(first).getTime() - new Date(project.created_at).getTime()) /
                DAY_MS
              ).toFixed(1),
            )
          : null,
      };
    });

    const times = perProject
      .map((project) => project.days_to_first_application)
      .filter((value): value is number => value !== null);
    const avgDays =
      times.length > 0
        ? Number((times.reduce((sum, value) => sum + value, 0) / times.length).toFixed(1))
        : null;

    // --- 30-day series, oldest first --------------------------------------
    const series: { day: string; applications: number }[] = [];
    const buckets = new Map<string, { day: string; applications: number }>();
    for (let offset = SERIES_DAYS - 1; offset >= 0; offset -= 1) {
      const day = dayKey(new Date(Date.now() - offset * DAY_MS));
      const bucket = { day, applications: 0 };
      series.push(bucket);
      buckets.set(day, bucket);
    }
    for (const application of applications) {
      const bucket = buckets.get(dayKey(application.created_at));
      if (bucket) bucket.applications += 1;
    }

    const accepted = applications.filter((a) => a.status === "ACCEPTED").length;

    return NextResponse.json({
      role: profile.role,
      projects_by_status: projectsByStatus,
      totals: {
        projects: totalProjects,
        applications: applications.length,
        accepted,
        completed: projectsByStatus.COMPLETED ?? 0,
      },
      last_30_days: {
        applications: applications.filter((a) => a.created_at >= cutoff).length,
        connections: connections.count ?? 0,
        messages: messages.count ?? 0,
      },
      avg_days_to_first_application: avgDays,
      completion_rate:
        totalProjects > 0
          ? Number((((projectsByStatus.COMPLETED ?? 0) / totalProjects) * 100).toFixed(1))
          : 0,
      funnel: {
        views: 0,
        views_available: false,
        applications: applications.length,
        accepted,
        completed: projectsByStatus.COMPLETED ?? 0,
      },
      series,
      projects: perProject,
    });
  } catch (e: any) {
    console.error("analytics/founder GET failed:", e?.message);
    return NextResponse.json(
      { error: "Unable to load founder insights." },
      { status: 500 },
    );
  }
}
