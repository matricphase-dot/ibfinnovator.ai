import { NextResponse, type NextRequest } from "next/server";
import { requireUserOr401 } from "@/lib/auth/require-user-http";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { randomUUID } from "crypto";
import { z } from "zod";

/**
 * University partner keys — SUPER_ADMIN only.
 *
 *   GET   /api/university/admin                 -> universities, keys masked
 *   GET   /api/university/admin?reveal=<id>     -> { id, api_key } for one row
 *   POST  /api/university/admin  { name, domain }        -> 201, the new row
 *   PATCH /api/university/admin  { id, active? }         -> toggled row
 *   PATCH /api/university/admin  { id, regenerate: true }-> row with a new key
 *
 * This is NOT a general admin console: it manages universities and nothing else.
 *
 * Two layers protect the keys. The row-level check below is done with the
 * caller's own session, so a member can never reach the data. The key column
 * itself is readable only through the service role — migration 023 revokes
 * table-wide SELECT on `universities` from `authenticated` — which is why the
 * queries here use supabaseAdmin after the role check has passed.
 */

const createSchema = z.object({
  name: z.string().trim().min(2).max(160),
  domain: z.string().trim().min(3).max(160),
});

const patchSchema = z
  .object({
    id: z.string().uuid(),
    active: z.boolean().optional(),
    regenerate: z.boolean().optional(),
  })
  .refine((value) => value.active !== undefined || value.regenerate === true, {
    message: "Provide `active` or `regenerate: true`.",
  });

/** Shows enough of a key to identify it without disclosing it on screen. */
function mask(key: string | null) {
  if (!key) return null;
  return `${key.slice(0, 4)}••••${key.slice(-4)}`;
}

function normalizeDomain(input: string) {
  return input
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/^@/, "")
    .replace(/\/.*$/, "");
}

async function requireSuperAdmin() {
  const auth = await requireUserOr401();
  if (auth.response) return { response: auth.response };

  const { data: profile, error } = await auth.session.supabase
    .from("profiles")
    .select("id,role")
    .eq("id", auth.session.user.id)
    .maybeSingle();

  if (error) {
    console.error("profiles select failed:", error.message);
    return {
      response: NextResponse.json(
        { error: "Unable to verify your account." },
        { status: 500 },
      ),
    };
  }
  if (profile?.role !== "SUPER_ADMIN") {
    return {
      response: NextResponse.json(
        { error: "SUPER_ADMIN access is required for this page." },
        { status: 403 },
      ),
    };
  }
  return { userId: auth.session.user.id };
}

export async function GET(request: NextRequest) {
  const guard = await requireSuperAdmin();
  if (guard.response) return guard.response;

  try {
    const reveal = new URL(request.url).searchParams.get("reveal");

    if (reveal) {
      if (!z.string().uuid().safeParse(reveal).success) {
        return NextResponse.json({ error: "Invalid university id." }, { status: 400 });
      }
      const { data, error } = await supabaseAdmin
        .from("universities")
        .select("id,api_key")
        .eq("id", reveal)
        .maybeSingle();
      if (error) throw error;
      if (!data) {
        return NextResponse.json({ error: "University not found." }, { status: 404 });
      }
      return NextResponse.json({ id: data.id, api_key: data.api_key });
    }

    const [universities, members] = await Promise.all([
      supabaseAdmin
        .from("universities")
        .select("id,name,domain,logo_url,active,created_at,api_key")
        .order("name"),
      supabaseAdmin.from("university_members").select("university_id"),
    ]);

    if (universities.error) throw universities.error;
    if (members.error) throw members.error;

    const counts = new Map<string, number>();
    for (const row of members.data ?? []) {
      counts.set(row.university_id, (counts.get(row.university_id) ?? 0) + 1);
    }

    return NextResponse.json(
      (universities.data ?? []).map((row) => ({
        id: row.id,
        name: row.name,
        domain: row.domain,
        logo_url: row.logo_url,
        active: row.active,
        created_at: row.created_at,
        members: counts.get(row.id) ?? 0,
        api_key_masked: mask(row.api_key),
        has_key: Boolean(row.api_key),
      })),
    );
  } catch (e: any) {
    console.error("university/admin GET failed:", e?.message);
    return NextResponse.json({ error: "Unable to load universities." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const guard = await requireSuperAdmin();
  if (guard.response) return guard.response;

  try {
    const payload = createSchema.parse(await request.json());
    const domain = normalizeDomain(payload.domain);

    const { data, error } = await supabaseAdmin
      .from("universities")
      .insert({
        name: payload.name.trim(),
        domain,
        api_key: randomUUID(),
        active: true,
      })
      .select("id,name,domain,logo_url,active,created_at,api_key")
      .single();

    if (error) {
      // 23505 = unique violation: universities.name and universities.domain are
      // both unique, so a duplicate is a client error, not a server fault.
      if (error.code === "23505") {
        return NextResponse.json(
          { error: "A university with that name or domain already exists." },
          { status: 409 },
        );
      }
      throw error;
    }

    return NextResponse.json(
      {
        id: data.id,
        name: data.name,
        domain: data.domain,
        logo_url: data.logo_url,
        active: data.active,
        created_at: data.created_at,
        members: 0,
        api_key_masked: mask(data.api_key),
        has_key: true,
        api_key: data.api_key,
      },
      { status: 201 },
    );
  } catch (e: any) {
    if (e instanceof z.ZodError) {
      return NextResponse.json(
        { error: e.issues[0]?.message ?? "Invalid university payload." },
        { status: 400 },
      );
    }
    console.error("university/admin POST failed:", e?.message);
    return NextResponse.json({ error: "Unable to create this university." }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const guard = await requireSuperAdmin();
  if (guard.response) return guard.response;

  try {
    const payload = patchSchema.parse(await request.json());

    const update: Record<string, unknown> = {};
    if (payload.active !== undefined) update.active = payload.active;
    if (payload.regenerate) update.api_key = randomUUID();

    const { data, error } = await supabaseAdmin
      .from("universities")
      .update(update)
      .eq("id", payload.id)
      .select("id,name,domain,logo_url,active,created_at,api_key")
      .maybeSingle();

    if (error) throw error;
    if (!data) {
      return NextResponse.json({ error: "University not found." }, { status: 404 });
    }

    return NextResponse.json({
      id: data.id,
      name: data.name,
      domain: data.domain,
      logo_url: data.logo_url,
      active: data.active,
      created_at: data.created_at,
      api_key_masked: mask(data.api_key),
      has_key: Boolean(data.api_key),
      ...(payload.regenerate ? { api_key: data.api_key } : {}),
    });
  } catch (e: any) {
    if (e instanceof z.ZodError) {
      return NextResponse.json(
        { error: e.issues[0]?.message ?? "Invalid request." },
        { status: 400 },
      );
    }
    console.error("university/admin PATCH failed:", e?.message);
    return NextResponse.json({ error: "Unable to update this university." }, { status: 500 });
  }
}
