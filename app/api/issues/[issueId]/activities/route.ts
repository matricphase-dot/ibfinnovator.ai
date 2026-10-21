import { NextResponse } from "next/server";
import { requireUser } from "@/lib/supabase/server";

export async function GET(
  _: Request,
  { params }: { params: Promise<{ issueId: string }> }
) {
  try {
    const { issueId } = await params;
    const { supabase } = await requireUser();

    const { data, error } = await supabase
      .from("issue_activities")
      .select(`
        *,
        actor:profiles!actor_id(id, name, full_name, username, avatar_url)
      `)
      .eq("issue_id", issueId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return NextResponse.json(data || []);
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to fetch activities" },
      { status: err.message === "UNAUTHORIZED" ? 401 : 500 }
    );
  }
}
