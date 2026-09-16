import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";
import { checkRateLimit, clientKey, rateLimitResponse } from "@/lib/rate-limit";
const schema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(200),
  organization: z.string().trim().min(2).max(160),
  role_title: z.string().trim().max(120).optional(),
  investor_type: z.enum([
    "ANGEL",
    "VC",
    "FAMILY_OFFICE",
    "CORPORATE",
    "ACCELERATOR",
    "UNIVERSITY",
    "OTHER",
  ]),
  request_types: z
    .array(
      z.enum([
        "PITCH_DECK",
        "DATA_ROOM",
        "PRODUCT_DEMO",
        "FOUNDER_MEETING",
        "PARTNERSHIP",
        "FINANCIAL_MODEL",
      ]),
    )
    .min(1),
  check_size: z.string().max(80).optional(),
  stage_interest: z.array(z.string().max(50)).max(10),
  sector_interest: z.array(z.string().max(60)).max(12),
  geography: z.string().trim().max(120).optional(),
  investment_thesis: z.string().trim().max(1500).optional(),
  specific_ask: z.string().trim().min(20).max(3000),
  // Honeypot. This must ACCEPT a non-empty value: with `.max(0)` the request
  // failed validation and returned 400 before the swallow below could run, so
  // the intended "silently pretend it worked" branch was unreachable and every
  // bot was told its submission had been rejected. A bot that is told it failed
  // retries; one that gets a 200 does not.
  website: z.string().max(200).optional(),
});
export async function POST(r: Request) {
  try {
    const body = await r.json();
    const p = schema.safeParse(body);
    if (!p.success)
      return NextResponse.json(
        {
          error: "Please complete all required fields.",
          details: p.error.flatten(),
        },
        { status: 400 },
      );
    const { website, ...row } = p.data;
    if (website) return NextResponse.json({ ok: true });
    const s = await createClient();

    // This endpoint is open to anonymous visitors, so it is limited per IP.
    // The honeypot above catches naive bots; this catches the ones that read
    // the form. Five submissions per ten minutes is far above any real use.
    const limit = await checkRateLimit(s, {
      bucket: "investor_inquiries",
      key: clientKey(r),
      limit: 5,
      windowSeconds: 600,
    });
    if (!limit.allowed) return rateLimitResponse(limit);
    const { data, error } = await s
      .from("investor_inquiries")
      .insert(row)
      .select("id,created_at")
      .single();
    if (error) {
      if (error.code === "42P01")
        return NextResponse.json(
          {
            error:
              "Investor inquiry storage is not configured yet. Run migration 002_investor_inquiries.sql.",
          },
          { status: 503 },
        );
      throw error;
    }
    return NextResponse.json(
      { ok: true, id: data.id, created_at: data.created_at },
      { status: 201 },
    );
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message || "Unable to submit the request." },
      { status: 500 },
    );
  }
}
