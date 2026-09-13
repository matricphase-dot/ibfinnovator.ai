import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
export async function GET(
  _: Request,
  { params }: { params: Promise<{ userId: string }> },
) {
  const { userId } = await params,
    s = await createClient();
  const [
    { data: profile, error },
    { data: reviews },
    { data: endorsements },
    { data: badges },
    { data: certificates },
  ] = await Promise.all([
    s
      .from("profiles")
      .select(
        "id,name,username,role,avatar_url,bio,skills,interests,portfolio_urls,availability,company,goals,is_cofounder,average_rating,endorsement_count,created_at",
      )
      .eq("id", userId)
      .single(),
    s
      .from("reviews")
      .select(
        "id,rating,comment,created_at,reviewer:profiles!reviewer_id(id,name,avatar_url),project:projects(id,title)",
      )
      .eq("reviewee_id", userId)
      .order("created_at", { ascending: false }),
    s
      .from("endorsements")
      .select("id,skill,created_at")
      .eq("receiver_id", userId)
      .order("created_at", { ascending: false }),
    s
      .from("user_badges")
      .select("*,badge:badge_definitions(*),project:projects(id,title)")
      .eq("receiver_id", userId)
      .order("created_at", { ascending: false }),
    s
      .from("certificates")
      .select("*,project:projects(id,title),issuer:profiles!issued_by(id,name)")
      .eq("receiver_id", userId)
      .order("created_at", { ascending: false }),
  ]);
  if (error)
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  return NextResponse.json({
    ...profile,
    reviews: reviews || [],
    endorsements: endorsements || [],
    badges: badges || [],
    certificates: certificates || [],
  });
}
