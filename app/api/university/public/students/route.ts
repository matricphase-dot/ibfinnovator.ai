import { NextResponse, type NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { createHash } from "crypto";

/**
 * Partner feed: the verified members of one university.
 *
 *   GET /api/university/public/students   header: x-api-key: <universities.api_key>
 *   -> { university: { id, name }, count, students: [...] }
 *
 * Deliberately non-personal: name, username, skills, availability and avatar
 * only — the fields the partner feed is allowed to publish. No email, no
 * internal uuid, no resume, no location. `member_role` and `verified` describe
 * the university's own roster entry rather than the person. The query names its
 * columns instead of using `*` so a future column cannot leak by accident.
 *
 * There is no session here — the key is the credential — so this runs on the
 * service role, which is also the only role that can read `universities.api_key`
 * (see migration 023). The key itself is never echoed back.
 */

const PUBLIC_PROFILE_COLUMNS = "name,username,skills,availability,avatar_url";

export async function GET(request: NextRequest) {
  const key = request.headers.get("x-api-key")?.trim();
  if (!key) {
    return NextResponse.json(
      { error: "Missing x-api-key header." },
      { status: 401 },
    );
  }

  try {
    const { data: university, error: lookupError } = await supabaseAdmin
      .from("universities")
      .select("id,name,active")
      .eq("api_key", key)
      .maybeSingle();

    if (lookupError) throw lookupError;
    if (!university) {
      return NextResponse.json({ error: "Unknown API key." }, { status: 401 });
    }
    if (!university.active) {
      return NextResponse.json(
        { error: "This university's API key is disabled." },
        { status: 403 },
      );
    }

    // Limit per partner, not per IP: one integration looping is the realistic
    // problem, and it should not exhaust the budget for everyone else. The key
    // is hashed so the secret itself is never written to the counter table.
    const partnerKey = createHash("sha256").update(key).digest("hex").slice(0, 32);
    const limit = await checkRateLimit(supabaseAdmin, {
      bucket: "university_feed_students",
      key: `k:${partnerKey}`,
      limit: 120,
      windowSeconds: 3600,
    });
    if (!limit.allowed) return rateLimitResponse(limit);

    const { data, error } = await supabaseAdmin
      .from("university_members")
      .select(`member_role,verified,profile:profiles!user_id(${PUBLIC_PROFILE_COLUMNS})`)
      .eq("university_id", university.id);

    if (error) throw error;

    const students = (data ?? [])
      .filter((row: any) => row.profile)
      .map((row: any) => ({
        member_role: row.member_role,
        verified: row.verified,
        name: row.profile.name,
        username: row.profile.username,
        skills: row.profile.skills ?? [],
        availability: row.profile.availability,
        avatar_url: row.profile.avatar_url,
      }));

    return NextResponse.json({
      university: { id: university.id, name: university.name },
      count: students.length,
      students,
    });
  } catch (e: any) {
    console.error("university/public/students failed:", e?.message);
    return NextResponse.json(
      { error: "Unable to load this university's students." },
      { status: 500 },
    );
  }
}
