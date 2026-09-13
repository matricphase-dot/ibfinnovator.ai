import { NextResponse } from "next/server";
import { requireUser } from "@/lib/supabase/server";
import { z } from "zod";
const message = z
  .string()
  .trim()
  .max(2000)
  .refine(
    (v) => v.split(/\s+/).filter(Boolean).length >= 20,
    "Message must be at least 20 words",
  );
export async function POST(
  r: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params,
      { supabase, user } = await requireUser(),
      p = z.object({ message }).parse(await r.json());
    const { data, error } = await supabase
      .from("service_inquiries")
      .insert({ service_id: id, from_user_id: user.id, message: p.message })
      .select()
      .single();
    if (error) throw error;
    return NextResponse.json(data, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
export async function GET(
  _: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params,
      { supabase, user } = await requireUser();
    const { data: service } = await supabase
      .from("marketplace_services")
      .select("provider_id")
      .eq("id", id)
      .single();
    if (service?.provider_id !== user.id)
      return NextResponse.json(
        { error: "Only the provider can view service inquiries" },
        { status: 403 },
      );
    const { data, error } = await supabase
      .from("service_inquiries")
      .select("*,sender:profiles!from_user_id(id,name,username,avatar_url)")
      .eq("service_id", id)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return NextResponse.json(data || []);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
