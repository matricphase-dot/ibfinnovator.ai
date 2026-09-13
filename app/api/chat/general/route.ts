import { NextRequest, NextResponse } from "next/server";
import { createClient, requireUser } from "@/lib/supabase/server";
import { z } from "zod";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";
const message = z.object({
  content: z.string().trim().min(1).max(5000),
  attachments: z.array(z.string().url()).max(10).default([]),
  parent_id: z.string().uuid().nullable().optional(),
});
export async function GET(req: NextRequest) {
  const s = await createClient();
  const before = req.nextUrl.searchParams.get("before");
  let q = s
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
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json((data || []).reverse());
}
export async function POST(r: Request) {
  try {
    const { supabase, user } = await requireUser();
    const limit = checkRateLimit(`${user.id}:general-chat`, 30, 60);
    if (!limit.allowed) return rateLimitResponse(limit);
    const p = message.parse(await r.json());
    const { data, error } = await supabase
      .from("messages")
      .insert({ sender_id: user.id, room_type: "GENERAL", ...p })
      .select(
        "*,sender:profiles!sender_id(id,name,username,avatar_url),reactions:message_reactions(user_id,emoji)",
      )
      .single();
    if (error) throw error;
    return NextResponse.json(data, { status: 201 });
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message },
      { status: e.message === "UNAUTHORIZED" ? 401 : 400 },
    );
  }
}
