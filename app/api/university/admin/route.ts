import { NextResponse } from "next/server";
import { z } from "zod";
import { requireSuperAdmin } from "@/lib/security/admin";
import { getCsrfRejection } from "@/lib/security/csrf";
import { supabaseAdmin } from "@/lib/supabase/admin";
async function guard(path: string) {
  // ROOT FIX M6: Clerk privateMetadata is the source of truth, never the
  // mutable profiles.role row. Denies are audit-logged, existence is not leaked.
  await requireSuperAdmin(path);
}

function csrf(r: Request): NextResponse | null {
  const rejection = getCsrfRejection(r);
  return rejection ? NextResponse.json({ error: rejection }, { status: 403 }) : null;
}
function newApiKey(): string {
  // ROOT FIX: 256-bit API keys (was 122-bit UUID) — brute-force infeasible.
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return `ibf_${btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")}`;
}
export async function GET(req: Request) {
  try {
    const blocked = csrf(req);
    if (blocked) return blocked;
    await guard("GET /api/university/admin");
    const { data, error } = await supabaseAdmin
      .from("universities")
      .select("*")
      .order("name");
    if (error) throw error;
    return NextResponse.json(data || []);
  } catch (e: any) {
    const denied = e.message === "FORBIDDEN" || e.message === "UNAUTHORIZED";
    return NextResponse.json(
      { error: denied ? "Forbidden" : "Authentication required" },
      { status: e.message === "FORBIDDEN" ? 403 : 401 },
    );
  }
}
export async function POST(r: Request) {
  try {
    const blocked = csrf(r);
    if (blocked) return blocked;
    await guard("POST /api/university/admin");
    const p = z
      .object({
        name: z.string().min(2).max(160),
        domain: z
          .string()
          .toLowerCase()
          .regex(/^[a-z0-9.-]+\.[a-z]{2,}$/),
      })
      .parse(await r.json());
    const { data, error } = await supabaseAdmin
      .from("universities")
      .insert({ ...p, api_key: newApiKey() })
      .select()
      .single();
    if (error) throw error;
    return NextResponse.json(data, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
export async function PATCH(r: Request) {
  try {
    const blocked = csrf(r);
    if (blocked) return blocked;
    await guard("PATCH /api/university/admin");
    const p = z
      .object({
        id: z.string().uuid(),
        active: z.boolean().optional(),
        regenerate_key: z.boolean().optional(),
      })
      .parse(await r.json());
    const changes: any = {};
    if (p.active !== undefined) changes.active = p.active;
    if (p.regenerate_key) changes.api_key = newApiKey();
    const { data, error } = await supabaseAdmin
      .from("universities")
      .update(changes)
      .eq("id", p.id)
      .select()
      .single();
    if (error) throw error;
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
