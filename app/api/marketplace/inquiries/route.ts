import { NextResponse } from "next/server";
import { requireUser } from "@/lib/supabase/server";
export async function GET() {
  try {
    const { supabase, user } = await requireUser();

    // Find services provided by this user
    const { data: userServices } = await supabase
      .from("marketplace_services")
      .select("id")
      .eq("provider_id", user.id);

    const serviceIds = (userServices || []).map((s: any) => s.id);

    let query = supabase
      .from("service_inquiries")
      .select(
        "*,service:marketplace_services(id,title,provider_id),sender:profiles!from_user_id(id,name,username,avatar_url)",
      );

    if (serviceIds.length > 0) {
      query = query.or(
        `from_user_id.eq.${user.id},service_id.in.(${serviceIds.join(",")})`,
      );
    } else {
      query = query.eq("from_user_id", user.id);
    }

    const { data, error } = await query.order("created_at", {
      ascending: false,
    });
    if (error) throw error;
    return NextResponse.json({ items: data || [], profileId: user.id });

  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 401 });
  }
}
