import { NextResponse } from "next/server";
import { createClient, requireUser } from "@/lib/supabase/server";
import { z } from "zod";
const schema = z.object({
  title: z.string().min(3).max(140),
  description: z.string().min(30).max(3000),
  skills: z.array(z.string()).min(1).max(20),
  pricing_note: z.string().max(200).optional(),
  availability: z.string().max(120).optional(),
});
export async function GET() {
  const s = await createClient();
  const { data, error } = await s
    .from("marketplace_services")
    .select(
      "*,provider:profiles!provider_id(id,name,avatar_url,bio,average_rating)",
    )
    .eq("status", "ACTIVE")
    .order("created_at", { ascending: false });
  return error
    ? NextResponse.json({ error: error.message }, { status: 500 })
    : NextResponse.json(data || []);
}
export async function POST(r: Request) {
  try {
    const { supabase, user } = await requireUser(),
      p = schema.parse(await r.json());
    const { data, error } = await supabase
      .from("marketplace_services")
      .insert({ ...p, provider_id: user.id })
      .select()
      .single();
    if (error) throw error;
    return NextResponse.json(data, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
