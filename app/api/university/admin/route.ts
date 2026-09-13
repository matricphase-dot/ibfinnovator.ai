import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
async function guard() {
  const { user } = await requireUser();
  if (user.role !== "SUPER_ADMIN") throw new Error("FORBIDDEN");
}
export async function GET() {
  try {
    await guard();
    const { data, error } = await supabaseAdmin
      .from("universities")
      .select("*")
      .order("name");
    if (error) throw error;
    return NextResponse.json(data || []);
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message },
      { status: e.message === "FORBIDDEN" ? 403 : 401 },
    );
  }
}
export async function POST(r: Request) {
  try {
    await guard();
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
      .insert({ ...p, api_key: crypto.randomUUID() })
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
    await guard();
    const p = z
      .object({
        id: z.string().uuid(),
        active: z.boolean().optional(),
        regenerate_key: z.boolean().optional(),
      })
      .parse(await r.json());
    const changes: any = {};
    if (p.active !== undefined) changes.active = p.active;
    if (p.regenerate_key) changes.api_key = crypto.randomUUID();
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
