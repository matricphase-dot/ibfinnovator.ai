import { NextResponse } from "next/server";
import { requireUser } from "@/lib/supabase/server";
import { z } from "zod";
import { dispatchEmail } from "@/lib/email/dispatch";
import ConnectionAcceptedEmail from "@/lib/email/templates/ConnectionAcceptedEmail";
export async function PATCH(
  r: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { supabase, user } = await requireUser(),
      p = z
        .object({ status: z.enum(["ACCEPTED", "REJECTED"]) })
        .parse(await r.json()),
      { id } = await params;
    const { data, error } = await supabase
      .from("connections")
      .update({ ...p, updated_at: new Date().toISOString() })
      .eq("id", id)
      .eq("recipient_id", user.id)
      .select()
      .single();
    if (error) throw error;
    if (p.status === "ACCEPTED") {
      await supabase.from("notifications").insert({
        user_id: data.requester_id,
        type: "CONNECTION_ACCEPTED",
        message: "Your connection request was accepted",
        link: "/dashboard",
      });
      dispatchEmail({
        profileId: data.requester_id,
        subject: "Your IBF connection was accepted",
        react: ConnectionAcceptedEmail({
          href: `${process.env.NEXT_PUBLIC_APP_URL || "https://innovators-global.com"}/dashboard`,
        }),
      });
    }
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
