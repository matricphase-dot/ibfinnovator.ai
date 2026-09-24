import { NextResponse } from "next/server";
import { requireUser } from "@/lib/supabase/server";
import { apiError, parseBody, parseQuery } from "@/lib/api";
import { z } from "zod";
import { dispatchEmail } from "@/lib/email/dispatch";
import ConnectionRequestEmail from "@/lib/email/templates/ConnectionRequestEmail";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";
const input = z.object({
  recipient_id: z.string().uuid(),
  project_id: z.string().uuid().nullable().optional(),
  type: z.enum(["PROJECT", "COFOUNDER"]).default("PROJECT"),
});
export async function GET(request: Request) {
  try {
    const { supabase, user } = await requireUser();
    const { searchParams } = new URL(request.url);
    // ROOT FIX: validate query (was: status=FOO → silent [], before=garbage → 400 leak).
    const parsed = parseQuery(
      searchParams,
      z.object({
        project_id: z.string().uuid().optional(),
        status: z.enum(["PENDING", "ACCEPTED", "REJECTED"]).optional(),
      }),
    );
    if ("response" in parsed) return parsed.response;
    const { project_id: projectId, status } = parsed.data;
    let query = supabase
      .from("connections")
      .select(
        "*,requester:profiles!requester_id(id,name,username,avatar_url),recipient:profiles!recipient_id(id,name,username,avatar_url),project:projects(id,title)",
      )
      .or(`requester_id.eq.${user.id},recipient_id.eq.${user.id}`);
    if (projectId) query = query.eq("project_id", projectId);
    if (status) query = query.eq("status", status);
    const { data, error } = await query.order("created_at", {
      ascending: false,
    });
    if (error) throw error;
    return NextResponse.json(data);
  } catch (e) {
    return apiError(e, "connections:GET");
  }
}
export async function POST(r: Request) {
  try {
    const { supabase, user } = await requireUser();
    const limit = checkRateLimit(`${user.id}:connections`, 10, 60);
    if (!limit.allowed) return rateLimitResponse(limit);
    const p = input.safeParse(await r.json());
    if (!p.success)
      return NextResponse.json({ error: p.error.flatten() }, { status: 400 });
    if (p.data.recipient_id === user.id)
      return NextResponse.json(
        { error: "You cannot send a connection request to yourself." },
        { status: 400 },
      );
    if (p.data.project_id) {
      const { data: project, error: projectError } = await supabase
        .from("projects")
        .select("founder_id,status")
        .eq("id", p.data.project_id)
        .single();
      if (projectError)
        return NextResponse.json(
          { error: "Project not found." },
          { status: 404 },
        );
      if (project.founder_id !== p.data.recipient_id)
        return NextResponse.json(
          { error: "The selected recipient does not own this project." },
          { status: 400 },
        );
      if (project.status !== "OPEN")
        return NextResponse.json(
          { error: "This project is not accepting new connections." },
          { status: 400 },
        );
    }
    const { data: existing } = await supabase
      .from("connections")
      .select("id,status")
      .eq("requester_id", user.id)
      .eq("recipient_id", p.data.recipient_id)
      .eq("project_id", p.data.project_id || "")
      .maybeSingle();
    if (existing)
      return NextResponse.json(
        {
          error: `A connection request already exists (${existing.status.toLowerCase()}).`,
          connection: existing,
        },
        { status: 409 },
      );
    const { data, error } = await supabase
      .from("connections")
      .insert({ ...p.data, requester_id: user.id })
      .select()
      .single();
    if (error) {
      if (error.code === "23505")
        return NextResponse.json(
          { error: "A connection request already exists." },
          { status: 409 },
        );
      throw error;
    }
    await supabase.from("notifications").insert({
      user_id: p.data.recipient_id,
      type: "CONNECTION_REQUEST",
      message: "You have a new connection request",
      link: "/dashboard",
    });
    dispatchEmail({
      profileId: p.data.recipient_id,
      subject: "New IBF connection request",
      react: ConnectionRequestEmail({
        name: "IBF member",
        href: `${process.env.NEXT_PUBLIC_APP_URL || "https://innovators-global.com"}/dashboard`,
      }),
    });
    return NextResponse.json(data, { status: 201 });
  } catch (e: any) {
    return NextResponse.json(
      {
        error:
          e.message === "UNAUTHORIZED"
            ? "Sign in before sending a connection request."
            : e.message,
      },
      { status: e.message === "UNAUTHORIZED" ? 401 : 400 },
    );
  }
}
