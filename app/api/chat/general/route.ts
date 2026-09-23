import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/supabase/server";
import { apiError, parseBody, parseQuery } from "@/lib/api";
import { safeHttpsUrlSchema } from "@/lib/security/url";
import { z } from "zod";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";
const message = z.object({
  content: z.string().trim().min(1).max(5000),
  attachments: z.array(safeHttpsUrlSchema()).max(10).default([]),
  parent_id: z.string().uuid().nullable().optional(),
});
export async function GET(req: NextRequest) {
  try {
    const { supabase, user } = await requireUser();
    const limit = checkRateLimit(`${user.id}:general-chat-read`, 60, 60);
    if (!limit.allowed) return rateLimitResponse(limit);

    // ROOT FIX: validate `before` datetime (was: garbage → PostgREST 400 leak).
    const parsedQ = parseQuery(
      req.nextUrl.searchParams,
      z.object({ before: z.string().datetime().optional() }),
    );
    if ("response" in parsedQ) return parsedQ.response;
    const { before } = parsedQ.data;
    let q = supabase
      .from("messages")
      .select(
        "*,sender:profiles!sender_id(id,name,username,avatar_url),reactions:message_reactions(user_id,emoji),parent:messages!parent_id(id,content,sender:profiles!sender_id(name,username))",
      )
      .eq("room_type", "GENERAL")
      .order("created_at", { ascending: false })
      .limit(50);
    if (before) q = q.lt("created_at", before);
    const { data, error } = await q;
    if (error)
      return NextResponse.json({ error: "Failed to load messages" }, { status: 500 });
    return NextResponse.json((data || []).reverse());
  } catch (e) {
    return apiError(e, "chat:general:GET");
  }
}

export async function POST(r: Request) {
  try {
    const { supabase, user } = await requireUser();
    const limit = checkRateLimit(`${user.id}:general-chat`, 30, 60);
    if (!limit.allowed) return rateLimitResponse(limit);
    const parsed = await parseBody(r, message);
    if ("response" in parsed) return parsed.response;
    const p = parsed.data;
    const { data, error } = await supabase
      .from("messages")
      .insert({ sender_id: user.id, room_type: "GENERAL", ...p })
      .select(
        "*,sender:profiles!sender_id(id,name,username,avatar_url),reactions:message_reactions(user_id,emoji)",
      )
      .single();
    if (error) throw error;
    return NextResponse.json(data, { status: 201 });
  } catch (e) {
    return apiError(e, "chat:general:POST");
  }
}
