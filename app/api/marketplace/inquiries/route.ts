import { NextResponse, type NextRequest } from "next/server";
import { requireUserOr401 } from "@/lib/auth/require-user-http";
import { z } from "zod";

/**
 * The inquiry inbox / outbox.
 *
 *   GET   /api/marketplace/inquiries                -> { received, sent }
 *   PATCH /api/marketplace/inquiries { id, status } -> the updated inquiry
 *
 * `received` are inquiries other members sent about your listings, `sent` are
 * the ones you wrote. Status may only move forward to CONTACTED or CLOSED, and
 * only the provider can move it — the same rule the RLS update policy enforces.
 */

const patchSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(["CONTACTED", "CLOSED"]),
});

export async function GET() {
  const auth = await requireUserOr401();
  if (auth.response) return auth.response;
  const { supabase, user } = auth.session;

  try {
    const [received, sent] = await Promise.all([
      supabase
        .from("service_inquiries")
        .select(
          "*,service:marketplace_services!service_id(id,title,status),sender:profiles!sender_id(id,name,username,avatar_url,average_rating,skills)",
        )
        .eq("provider_id", user.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("service_inquiries")
        .select(
          "*,service:marketplace_services!service_id(id,title,status),provider:profiles!provider_id(id,name,username,avatar_url,average_rating,skills)",
        )
        .eq("sender_id", user.id)
        .order("created_at", { ascending: false }),
    ]);

    if (received.error) throw received.error;
    if (sent.error) throw sent.error;

    return NextResponse.json({
      received: received.data ?? [],
      sent: sent.data ?? [],
    });
  } catch (e: any) {
    console.error("marketplace/inquiries GET failed:", e?.message);
    return NextResponse.json({ error: "Unable to load your inquiries." }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const auth = await requireUserOr401();
  if (auth.response) return auth.response;
  const { supabase, user } = auth.session;

  try {
    const payload = patchSchema.parse(await request.json());

    const { data: inquiry, error: loadError } = await supabase
      .from("service_inquiries")
      .select("id,provider_id,status")
      .eq("id", payload.id)
      .maybeSingle();

    if (loadError) {
      console.error("service_inquiries select failed:", loadError.message);
      return NextResponse.json({ error: "Unable to load this inquiry." }, { status: 500 });
    }
    if (!inquiry) {
      return NextResponse.json({ error: "Inquiry not found." }, { status: 404 });
    }
    if (inquiry.provider_id !== user.id) {
      return NextResponse.json(
        { error: "Only the provider can change an inquiry's status." },
        { status: 403 },
      );
    }

    const { data, error } = await supabase
      .from("service_inquiries")
      .update({ status: payload.status, updated_at: new Date().toISOString() })
      .eq("id", payload.id)
      .eq("provider_id", user.id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (e: any) {
    if (e instanceof z.ZodError) {
      return NextResponse.json(
        { error: e.issues[0]?.message ?? "Invalid inquiry payload." },
        { status: 400 },
      );
    }
    console.error("marketplace/inquiries PATCH failed:", e?.message);
    return NextResponse.json({ error: "Unable to update this inquiry." }, { status: 500 });
  }
}
