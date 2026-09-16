import { NextResponse, type NextRequest } from "next/server";
import { requireUserOr401 } from "@/lib/auth/require-user-http";
import { z } from "zod";
import { checkRateLimit, clientKey, rateLimitResponse } from "@/lib/rate-limit";

/**
 * Inquiries for one listing.
 *
 *   POST /api/marketplace/<id>/inquiries  { message }  -> 201, the new inquiry
 *   GET  /api/marketplace/<id>/inquiries               -> inquiries for the owner
 *
 * POST is open to any signed-in member who is not the provider, but only against
 * an ACTIVE listing. The 20-word minimum is enforced here *and* by the RLS
 * insert policy (which additionally refuses paused listings and self-inquiries),
 * so the rule holds even if this route is bypassed.
 *
 * provider_id is copied from the listing rather than the request body — a sender
 * must never be able to file an inquiry against somebody else's name.
 */

const messageSchema = z.object({
  message: z
    .string()
    .trim()
    .min(1)
    .max(2000)
    .refine((value) => wordCount(value) >= 20, {
      message: "Please write at least 20 words so the provider can help you.",
    }),
});

// Not exported: Next.js validates the exports of a route file, so a helper here
// must stay module-private (or live in lib/).
function wordCount(value: string) {
  return value.trim().split(/\s+/).filter(Boolean).length;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireUserOr401();
  if (auth.response) return auth.response;
  const { supabase, user } = auth.session;

  try {
    const { id } = await params;
    if (!z.string().uuid().safeParse(id).success) {
      return NextResponse.json({ error: "Invalid listing id." }, { status: 400 });
    }

    const payload = messageSchema.parse(await request.json());

    // 20-word messages are the point of this endpoint, so the limit is generous
    // but finite: a member cannot flood every provider on the marketplace.
    const limit = await checkRateLimit(supabase, {
      bucket: "service_inquiries",
      key: clientKey(request, user.id),
      limit: 20,
      windowSeconds: 86400,
    });
    if (!limit.allowed) return rateLimitResponse(limit);

    const { data: service, error: loadError } = await supabase
      .from("marketplace_services")
      .select("id,provider_id,title,status")
      .eq("id", id)
      .maybeSingle();

    if (loadError) {
      console.error("marketplace_services select failed:", loadError.message);
      return NextResponse.json({ error: "Unable to load this listing." }, { status: 500 });
    }
    if (!service) {
      return NextResponse.json({ error: "Listing not found." }, { status: 404 });
    }
    if (service.provider_id === user.id) {
      return NextResponse.json(
        { error: "You cannot send an inquiry about your own listing." },
        { status: 400 },
      );
    }
    if (service.status !== "ACTIVE") {
      return NextResponse.json(
        { error: "This listing is not accepting inquiries right now." },
        { status: 409 },
      );
    }

    const { data, error } = await supabase
      .from("service_inquiries")
      .insert({
        service_id: service.id,
        provider_id: service.provider_id,
        sender_id: user.id,
        message: payload.message,
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data, { status: 201 });
  } catch (e: any) {
    if (e instanceof z.ZodError) {
      return NextResponse.json(
        { error: e.issues[0]?.message ?? "Invalid inquiry payload." },
        { status: 400 },
      );
    }
    console.error("marketplace/[id]/inquiries POST failed:", e?.message);
    return NextResponse.json({ error: "Unable to send this inquiry." }, { status: 500 });
  }
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireUserOr401();
  if (auth.response) return auth.response;
  const { supabase, user } = auth.session;

  try {
    const { id } = await params;
    if (!z.string().uuid().safeParse(id).success) {
      return NextResponse.json({ error: "Invalid listing id." }, { status: 400 });
    }

    const { data: service, error: loadError } = await supabase
      .from("marketplace_services")
      .select("id,provider_id,title")
      .eq("id", id)
      .maybeSingle();

    if (loadError) {
      console.error("marketplace_services select failed:", loadError.message);
      return NextResponse.json({ error: "Unable to load this listing." }, { status: 500 });
    }
    if (!service) {
      return NextResponse.json({ error: "Listing not found." }, { status: 404 });
    }
    if (service.provider_id !== user.id) {
      return NextResponse.json(
        { error: "Only the provider can read this listing's inquiries." },
        { status: 403 },
      );
    }

    const { data, error } = await supabase
      .from("service_inquiries")
      .select(
        "*,sender:profiles!sender_id(id,name,username,avatar_url,average_rating,skills)",
      )
      .eq("service_id", id)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return NextResponse.json(data ?? []);
  } catch (e: any) {
    console.error("marketplace/[id]/inquiries GET failed:", e?.message);
    return NextResponse.json({ error: "Unable to load these inquiries." }, { status: 500 });
  }
}
