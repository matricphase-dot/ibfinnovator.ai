import { NextResponse } from "next/server";
import { requireUser } from "@/lib/supabase/server";
import { z } from "zod";
export async function GET() {
  try {
    const { supabase, user } = await requireUser();
    const { data, error } = await supabase
      .from("certificates")
      .select(
        "*,project:projects(id,title),issuer:profiles!issued_by(id,name),receiver:profiles!receiver_id(id,name)",
      )
      .eq("receiver_id", user.id)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return NextResponse.json(data || []);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 401 });
  }
}
export async function POST(r: Request) {
  try {
    const { supabase, user } = await requireUser();
    const p = z
      .object({
        receiver_id: z.string().uuid(),
        project_id: z.string().uuid(),
        role_title: z.string().min(2).max(120),
        started_at: z.string().optional(),
        completed_at: z.string().optional(),
      })
      .parse(await r.json());
    const { data, error } = await supabase
      .from("certificates")
      .insert({ ...p, issued_by: user.id })
      .select()
      .single();
    if (error) throw error;
    await supabase
      .from("notifications")
      .insert({
        user_id: p.receiver_id,
        type: "CERTIFICATE_ISSUED",
        message: "A verified experience certificate was issued to you",
        link: "/credentials",
      });
    return NextResponse.json(data, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
