import { NextResponse } from "next/server";
import { requireUser } from "@/lib/supabase/server";
export async function GET() {
  try {
    const { supabase, user } = await requireUser();
    const tables = [
      "profiles",
      "applications",
      "connections",
      "messages",
      "bookmarks",
      "notifications",
      "reviews",
      "endorsements",
      "milestones",
      "meetings",
      "user_badges",
      "certificates",
      "match_actions",
    ];
    const entries = await Promise.all(
      tables.map(async (table) => {
        let q = supabase.from(table).select("*");
        if (table === "profiles") q = q.eq("id", user.id);
        else if (["applications"].includes(table))
          q = q.eq("student_id", user.id);
        else if (
          ["bookmarks", "notifications", "match_actions"].includes(table)
        )
          q = q.eq("user_id", user.id);
        else if (table === "messages") q = q.eq("sender_id", user.id);
        else if (table === "reviews")
          q = q.or(`reviewer_id.eq.${user.id},reviewee_id.eq.${user.id}`);
        else if (table === "endorsements")
          q = q.or(`giver_id.eq.${user.id},receiver_id.eq.${user.id}`);
        else if (table === "connections")
          q = q.or(`requester_id.eq.${user.id},recipient_id.eq.${user.id}`);
        else if (["user_badges", "certificates"].includes(table))
          q = q.eq("receiver_id", user.id);
        else q = q.limit(1000);
        const { data } = await q;
        return [table, data || []] as const;
      }),
    );
    return new Response(
      JSON.stringify(
        {
          exported_at: new Date().toISOString(),
          user: { id: user.id, email: user.email },
          data: Object.fromEntries(entries),
        },
        null,
        2,
      ),
      {
        headers: {
          "content-type": "application/json",
          "content-disposition":
            'attachment; filename="ibf-account-export.json"',
        },
      },
    );
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 401 });
  }
}
export async function DELETE() {
  try {
    const { supabase } = await requireUser();
    const { error } = await supabase.rpc("delete_own_account");
    if (error) throw error;
    return NextResponse.json({ deleted: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
