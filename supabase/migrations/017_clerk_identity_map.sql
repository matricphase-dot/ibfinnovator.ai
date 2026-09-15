-- ==========================================================================
-- Migration 017 - Clerk identity map
-- ==========================================================================
-- Explicit Clerk subject -> profile mapping, written by the Clerk webhook.
--
-- This table is service-role only. RLS is enabled with NO policies, so the
-- anon and authenticated roles cannot read or write it at all. The webhook
-- writes through supabaseAdmin (service role), which bypasses RLS. No
-- application code reads this table.
--
-- Not to be confused with public.clerk_webhook_events (created in 012), which
-- is the webhook idempotency ledger. This table is the durable identity map.
--
-- profiles.clerk_user_id remains the source of truth for the identity
-- resolution performed by public.current_profile_id().
-- ==========================================================================

create table if not exists public.clerk_identity_map (
  clerk_id text primary key,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  email text,
  created_at timestamptz not null default now()
);

create index if not exists clerk_identity_map_profile_idx
on public.clerk_identity_map(profile_id);

alter table public.clerk_identity_map enable row level security;

-- Only service role can read/write. No authenticated policy.
-- Webhook uses supabaseAdmin (service role) to insert.
-- Application code never reads this table.
