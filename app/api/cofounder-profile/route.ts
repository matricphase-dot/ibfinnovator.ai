import { NextResponse } from "next/server";
import { requireUser } from "@/lib/supabase/server";
import { z } from "zod";
const schema = z.object({
  vision: z.string().trim().min(30).max(3000),
  commitment_level: z.string().min(1).max(80),
  equity_expectation: z.string().max(300),
  decision_style: z.string().max(300),
  working_style: z.record(z.any()).default({}),
  values: z.array(z.string()).min(1).max(20),
  looking_for: z.array(z.string()).min(1).max(20),
  enabled: z.boolean(),
});
export async function GET() {
  try {
    const { supabase, user } = await requireUser();
    const { data, error } = await supabase
      .from("cofounder_profiles")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();
    if (error) throw error;
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 401 });
  }
}
export async function POST(r: Request) {
  try {
    const { supabase, user } = await requireUser();
    const p = schema.safeParse(await r.json());
    if (!p.success)
      return NextResponse.json({ error: p.error.flatten() }, { status: 400 });
    const { data, error } = await supabase
      .from("cofounder_profiles")
      .upsert({
        user_id: user.id,
        ...p.data,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();
    if (error) throw error;
    await supabase
      .from("profiles")
      .update({ is_cofounder: p.data.enabled })
      .eq("id", user.id);
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
