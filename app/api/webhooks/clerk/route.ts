import { NextResponse, type NextRequest } from "next/server";
import { verifyWebhook } from "@clerk/nextjs/webhooks";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";

/**
 * Minimal structural shape of the Clerk user payload we rely on. Using a local
 * shape keeps this file independent of Clerk's internal type export paths.
 */
type ClerkUserPayload = {
  id: string;
  first_name?: string | null;
  last_name?: string | null;
  username?: string | null;
  primary_email_address_id?: string | null;
  email_addresses?: Array<{
    id: string;
    email_address: string;
    verification?: { status?: string } | null;
  }>;
};

type Claim = { id: string; attempts: number };

const normalizeEmail = (email: string) => email.trim().toLowerCase();

const displayNameFrom = (data: ClerkUserPayload) =>
  [data.first_name, data.last_name].filter(Boolean).join(" ").trim() ||
  data.username ||
  "";

/**
 * Atomic claim on clerk_webhook_events.
 * - upsert + ignoreDuplicates == INSERT ... ON CONFLICT (id) DO NOTHING
 * - a returned row means we own this delivery
 * - no row means it was already claimed; we may reclaim a FAILED row
 * - returns null when there is nothing to do (already processed / in flight)
 */
async function claimEvent(id: string, eventType: string): Promise<Claim | null> {
  const { data, error } = await supabaseAdmin
    .from("clerk_webhook_events")
    .upsert(
      { id, event_type: eventType, status: "PROCESSING" },
      { onConflict: "id", ignoreDuplicates: true },
    )
    .select("id, attempts");

  if (!error) {
    const inserted = (data ?? [])[0];
    if (inserted) return { id: inserted.id, attempts: inserted.attempts ?? 1 };
    // Conflict with an existing row: fall through and try to reclaim it.
  } else if ((error as { code?: string }).code !== "23505") {
    throw error;
  }

  const { data: failed, error: readError } = await supabaseAdmin
    .from("clerk_webhook_events")
    .select("id, attempts")
    .eq("id", id)
    .eq("status", "FAILED")
    .maybeSingle();

  if (readError) throw readError;
  if (!failed) return null;

  const { data: reclaimed, error: reclaimError } = await supabaseAdmin
    .from("clerk_webhook_events")
    .update({
      status: "PROCESSING",
      attempts: (failed.attempts ?? 1) + 1,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("status", "FAILED")
    .select("id, attempts");

  if (reclaimError) throw reclaimError;
  const row = (reclaimed ?? [])[0];
  return row ? { id: row.id, attempts: row.attempts ?? 1 } : null;
}

/** Case-insensitive profile lookup: exact match first, then a LIKE fallback. */
async function findProfileByEmail(email: string) {
  const columns = "id, email, name, clerk_user_id, role";

  const exact = await supabaseAdmin
    .from("profiles")
    .select(columns)
    .eq("email", email)
    .maybeSingle();
  if (exact.error) throw exact.error;
  if (exact.data) return exact.data;

  const loose = await supabaseAdmin
    .from("profiles")
    .select(columns)
    .ilike("email", email)
    .limit(1);
  if (loose.error) throw loose.error;
  return (loose.data ?? [])[0] ?? null;
}

/** Paginate auth.users to find an existing account by email. */
async function findAuthUserIdByEmail(email: string): Promise<string | null> {
  const perPage = 1000;
  for (let page = 1; page <= 20; page++) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({
      page,
      perPage,
    });
    if (error) throw error;
    const users = data?.users ?? [];
    const match = users.find(
      (candidate) => normalizeEmail(candidate.email ?? "") === email,
    );
    if (match) return match.id;
    if (users.length < perPage) return null;
  }
  return null;
}

/**
 * Create the shadow Supabase auth user required by profiles.id -> auth.users.id.
 * A duplicate email means the account already exists, so we reuse it.
 */
async function ensureShadowAuthUser(
  email: string,
  clerkId: string,
): Promise<string> {
  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    email_confirm: true,
    user_metadata: { source: "clerk", clerk_user_id: clerkId },
  });

  if (!error && data?.user) return data.user.id;

  const existingId = await findAuthUserIdByEmail(email);
  if (existingId) return existingId;

  throw error ?? new Error("SHADOW_USER_CREATE_FAILED");
}

/**
 * Best-effort identity map write. The clerk_identity_map table is not part of
 * the applied schema yet (migrations 001-016), so a failure here must never
 * fail the webhook. profiles.clerk_user_id remains the source of truth used by
 * public.current_profile_id().
 */
async function upsertIdentityMap(
  clerkId: string,
  profileId: string,
  email: string,
) {
  const { error } = await supabaseAdmin
    .from("clerk_identity_map")
    .upsert(
      { clerk_id: clerkId, profile_id: profileId, email },
      { onConflict: "clerk_id" },
    );
  if (error) {
    console.warn(
      "[clerk-webhook] clerk_identity_map write skipped:",
      error.message,
    );
  }
}

async function handleUserChanged(data: ClerkUserPayload) {
  const verified = (data.email_addresses ?? []).filter(
    (address) => address.verification?.status === "verified",
  );
  const emailAddress =
    verified.find((address) => address.id === data.primary_email_address_id) ??
    verified[0];

  if (!emailAddress?.email_address) throw new Error("NO_VERIFIED_EMAIL");

  const email = normalizeEmail(emailAddress.email_address);
  const name = displayNameFrom(data);
  const profile = await findProfileByEmail(email);

  if (profile) {
    if (profile.clerk_user_id && profile.clerk_user_id !== data.id) {
      throw new Error("CONFLICT");
    }
    if (profile.clerk_user_id === data.id) {
      // Already linked to this Clerk user: nothing to do.
      return { profileId: profile.id as string, email, linked: false };
    }

    const patch: Record<string, unknown> = {
      clerk_user_id: data.id,
      updated_at: new Date().toISOString(),
    };
    if (!profile.name && name) patch.name = name;

    const { error } = await supabaseAdmin
      .from("profiles")
      .update(patch)
      .eq("id", profile.id);
    if (error) throw error;

    return { profileId: profile.id as string, email, linked: true };
  }

  const shadowId = await ensureShadowAuthUser(email, data.id);

  const { error } = await supabaseAdmin.from("profiles").upsert(
    { id: shadowId, email, name, clerk_user_id: data.id },
    { onConflict: "id" },
  );
  if (error) throw error;

  return { profileId: shadowId, email, linked: true };
}

async function handleUserDeleted(clerkId: string) {
  const { data, error } = await supabaseAdmin
    .from("profiles")
    .select("id")
    .eq("clerk_user_id", clerkId)
    .maybeSingle();
  if (error) throw error;

  const anonymousEmail = `deleted+${data?.id ?? clerkId}@deleted.invalid`;

  const { error: updateError } = await supabaseAdmin
    .from("profiles")
    .update({
      name: "Deleted user",
      email: anonymousEmail,
      clerk_user_id: null,
      updated_at: new Date().toISOString(),
    })
    .eq("clerk_user_id", clerkId);
  if (updateError) throw updateError;
}

export async function POST(request: NextRequest) {
  if (!process.env.CLERK_WEBHOOK_SIGNING_SECRET) {
    return NextResponse.json(
      { error: "CLERK_WEBHOOK_SIGNING_SECRET is not configured" },
      { status: 500 },
    );
  }

  let event;
  try {
    event = await verifyWebhook(request);
  } catch {
    return NextResponse.json(
      { error: "Invalid webhook signature" },
      { status: 400 },
    );
  }

  const payloadId = (event.data as { id?: string } | null)?.id;
  const eventId =
    request.headers.get("svix-id") ||
    (event as { id?: string }).id ||
    `${event.type}:${payloadId ?? crypto.randomUUID()}`;

  let claim: Claim | null;
  try {
    claim = await claimEvent(eventId, event.type);
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error)?.message ?? "Unable to claim webhook event" },
      { status: 500 },
    );
  }

  if (!claim) return NextResponse.json({ ok: true, duplicate: true });

  try {
    if (event.type === "user.created" || event.type === "user.updated") {
      const result = await handleUserChanged(event.data as ClerkUserPayload);
      if (result.linked) {
        await upsertIdentityMap(
          (event.data as ClerkUserPayload).id,
          result.profileId,
          result.email,
        );
      }
    } else if (event.type === "user.deleted") {
      if (payloadId) await handleUserDeleted(payloadId);
    }

    await supabaseAdmin
      .from("clerk_webhook_events")
      .update({ status: "DONE", updated_at: new Date().toISOString() })
      .eq("id", eventId);

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = (error as Error)?.message ?? String(error);
    await supabaseAdmin
      .from("clerk_webhook_events")
      .update({
        status: "FAILED",
        last_error: message,
        attempts: claim.attempts + 1,
        updated_at: new Date().toISOString(),
      })
      .eq("id", eventId);

    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }
}
