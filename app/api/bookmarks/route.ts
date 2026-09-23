import { NextResponse } from "next/server";
import { requireUser } from "@/lib/supabase/server";
import { apiError, parseBody } from "@/lib/api";
import { z } from "zod";

const toggle = z
  .object({
    project_id: z.string().uuid().optional(),
    profile_id: z.string().uuid().optional(),
  })
  .refine((x) => !!x.project_id !== !!x.profile_id, {
    message: "Provide exactly one of project_id or profile_id",
  });

export async function GET() {
  try {
    const { supabase, user } = await requireUser();
    const { data, error } = await supabase
      .from("bookmarks")
      .select("*,project:projects(*),profile:profiles!profile_id(*)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return NextResponse.json(data);
  } catch (e) {
    // ROOT FIX: DB failures are 500/503, never 401 (was: signin loop on outage).
    const msg = e instanceof Error ? e.message : "";
    if (msg === "UNAUTHORIZED" || msg === "PROFILE_NOT_FOUND") return apiError(e, "bookmarks:GET");
    return apiError(new Error("INTERNAL"), "bookmarks:GET");
  }
}

export async function POST(r: Request) {
  try {
    const { supabase, user } = await requireUser();
    const parsed = await parseBody(r, toggle);
    if ("response" in parsed) return parsed.response;
    const p = parsed.data;

    // ROOT FIX P0: atomic toggle without check-then-act race.
    // Try insert first; on unique-violation (23505) delete instead.
    // Two rapid clicks: one wins insert, the other hits 23505 → delete.
    // No 23505 leak, no flap, single round-trip in the common case.
    const { data: inserted, error: insertError } = p.project_id
      ? await supabase
          .from("bookmarks")
          .insert({ user_id: user.id, project_id: p.project_id })
          .select()
          .single()
      : await supabase
          .from("bookmarks")
          .insert({ user_id: user.id, profile_id: p.profile_id! })
          .select()
          .single();
    if (!insertError) return NextResponse.json({ bookmarked: true, bookmark: inserted });

    const code = (insertError as { code?: string }).code || "";
    const isConflict =
      code === "23505" || /duplicate|already exists/i.test(insertError.message || "");
    if (!isConflict) throw insertError;

    // Conflict → row exists, toggle off atomically by exact key (not stale id).
    let del = supabase.from("bookmarks").delete().eq("user_id", user.id);
    del = p.project_id ? del.eq("project_id", p.project_id) : del.eq("profile_id", p.profile_id!);
    const { error: delError } = await del;
    if (delError) throw delError;
    return NextResponse.json({ bookmarked: false });
  } catch (e) {
    return apiError(e, "bookmarks:POST");
  }
}
