import { NextResponse } from "next/server";
import { requireUser } from "@/lib/supabase/server";
export async function GET() {
  try {
    const { supabase, user } = await requireUser();
    const { data, error } = await supabase
      .from("service_inquiries")
      .select(
        "*,service:marketplace_services(id,title,provider_id),sender:profiles!from_user_id(id,name,username,avatar_url)",
      )
      .order("created_at", { ascending: false });
    if (error) throw error;
    return NextResponse.json({ items: data || [], profileId: user.id });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 401 });
  }
}
