-- ============================================================================
-- 023_phase3_extensions.sql
-- Phase 3: service inquiries, university partner API keys, investor visibility.
--
-- Scope is deliberately narrow. The Batch 7 inventory proved that everything
-- else Phase 3 needs already exists:
--   * the `service-portfolios` bucket and its storage policies  (020)
--   * owner ALL policies on marketplace_services / community_events /
--     event_attendees, so owner PATCH/DELETE and the RSVP upsert need no
--     new DDL                                                  (001)
-- Because of that, this migration does NOT create a bucket and does NOT add
-- marketplace/event owner policies.
--
-- Nothing in migrations 001-022 is modified. Every statement is idempotent.
-- ============================================================================


-- ---------------------------------------------------------------------------
-- 1. profiles: investor visibility (opt-in directory listing)
-- ---------------------------------------------------------------------------
alter table public.profiles
  add column if not exists investor_visible boolean not null default false;

alter table public.profiles
  add column if not exists investor_pitch text;

comment on column public.profiles.investor_visible is
  'Founder opt-in: when true (and role = FOUNDER) this profile appears in the investor directory.';
comment on column public.profiles.investor_pitch is
  'Founder-written summary shown to investors. The 50-word minimum is enforced by the app, not here.';


-- ---------------------------------------------------------------------------
-- 2. universities: partner API keys
--    A partial unique index (rather than a column constraint) keeps the
--    statement idempotent and still allows the column to be NULL.
-- ---------------------------------------------------------------------------
alter table public.universities
  add column if not exists api_key text;

create unique index if not exists universities_api_key_key
  on public.universities (api_key)
  where api_key is not null;

-- Give every existing partner a key so their feed works without an admin
-- having to click "regenerate" first. Only rows that have none are touched.
update public.universities
   set api_key = gen_random_uuid()::text
 where api_key is null;

comment on column public.universities.api_key is
  'Bearer key for /api/university/public/*. Readable only through the service role (see section 3).';


-- ---------------------------------------------------------------------------
-- 3. universities: keep the key out of every non-service-role read.
--
--    `universities` has a public-read policy, and `authenticated` holds
--    table-wide SELECT, so the moment api_key exists any signed-in member
--    could read it straight from PostgREST — a credential leak. Column-level
--    privileges fix that: table-wide SELECT is revoked and only the six
--    non-secret columns are granted back. PostgreSQL cannot "subtract" one
--    column from a table-wide grant, and `SELECT *` needs every column, so
--    queries must name the columns they need (see app/api/university/route.ts).
--    The admin and public API routes read the key through supabaseAdmin.
-- ---------------------------------------------------------------------------
revoke select on public.universities from authenticated;
revoke select on public.universities from anon;

grant select (id, name, domain, logo_url, active, created_at)
  on public.universities to authenticated;


-- ---------------------------------------------------------------------------
-- 4. universities: SUPER_ADMIN management policy.
--    Same shape as migration 014's investor_inquiries policies. Row-level
--    access is what lets an admin toggle `active`; the key column stays
--    unreachable because of the column privileges above.
-- ---------------------------------------------------------------------------
drop policy if exists "super admins manage universities" on public.universities;
create policy "super admins manage universities" on public.universities for all to authenticated
  using (exists (select 1 from public.profiles
                  where profiles.id = public.current_profile_id()
                    and profiles.role = 'SUPER_ADMIN'))
  with check (exists (select 1 from public.profiles
                       where profiles.id = public.current_profile_id()
                         and profiles.role = 'SUPER_ADMIN'));


-- ---------------------------------------------------------------------------
-- 5. service_inquiries: a member contacting a service provider.
--    provider_id is denormalised from marketplace_services so the RLS
--    predicates stay index-friendly and so a listing can be deleted without
--    orphaning the conversation record.
-- ---------------------------------------------------------------------------
create table if not exists public.service_inquiries (
  id          uuid primary key default gen_random_uuid(),
  service_id  uuid not null references public.marketplace_services(id) on delete cascade,
  provider_id uuid not null references public.profiles(id) on delete cascade,
  sender_id   uuid not null references public.profiles(id) on delete cascade,
  message     text not null,
  status      text not null default 'NEW',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  constraint service_inquiries_no_self_inquiry check (sender_id <> provider_id),
  constraint service_inquiries_status_check check (status in ('NEW', 'CONTACTED', 'CLOSED'))
);

create index if not exists service_inquiries_provider_created_idx
  on public.service_inquiries (provider_id, created_at desc);
create index if not exists service_inquiries_sender_created_idx
  on public.service_inquiries (sender_id, created_at desc);
create index if not exists service_inquiries_service_idx
  on public.service_inquiries (service_id);

alter table public.service_inquiries enable row level security;

grant select, insert, update on public.service_inquiries to authenticated;

drop policy if exists "senders create own inquiries" on public.service_inquiries;
create policy "senders create own inquiries" on public.service_inquiries for insert to authenticated
with check (
  sender_id = public.current_profile_id()
  and status = 'NEW'
  and exists (select 1 from public.marketplace_services s
               where s.id = service_id and s.status = 'ACTIVE')
);

drop policy if exists "participants read inquiries" on public.service_inquiries;
create policy "participants read inquiries" on public.service_inquiries for select to authenticated
using (
  sender_id = public.current_profile_id()
  or provider_id = public.current_profile_id()
);

drop policy if exists "providers update inquiry status" on public.service_inquiries;
create policy "providers update inquiry status" on public.service_inquiries for update to authenticated
using (provider_id = public.current_profile_id())
with check (
  provider_id = public.current_profile_id()
  and status in ('CONTACTED', 'CLOSED')
);


-- ---------------------------------------------------------------------------
-- 6. Verification.
--    Expect: 2 | 1 | 1 | 3 | 1 | f
--      profiles_investor_columns_2 : investor_visible + investor_pitch
--      universities_api_key_1      : the key column exists
--      service_inquiries_1         : the table exists
--      service_inquiry_policies_3  : insert / select / update
--      super_admin_policies_1      : admin management on universities
--      authenticated_can_read_key  : must be false — this is the leak check
-- ---------------------------------------------------------------------------
select
  (select count(*) from information_schema.columns
    where table_schema = 'public' and table_name = 'profiles'
      and column_name in ('investor_visible', 'investor_pitch')) as profiles_investor_columns_2,
  (select count(*) from information_schema.columns
    where table_schema = 'public' and table_name = 'universities'
      and column_name = 'api_key') as universities_api_key_1,
  (select count(*) from information_schema.tables
    where table_schema = 'public' and table_name = 'service_inquiries') as service_inquiries_1,
  (select count(*) from pg_policies
    where schemaname = 'public' and tablename = 'service_inquiries') as service_inquiry_policies_3,
  (select count(*) from pg_policies
    where schemaname = 'public' and tablename = 'universities'
      and policyname = 'super admins manage universities') as super_admin_policies_1,
  has_column_privilege('authenticated', 'public.universities', 'api_key', 'select')
    as authenticated_can_read_key;

-- The policies this batch added:
select tablename, policyname, cmd
  from pg_policies
 where tablename in ('universities', 'service_inquiries')
 order by tablename, cmd;
