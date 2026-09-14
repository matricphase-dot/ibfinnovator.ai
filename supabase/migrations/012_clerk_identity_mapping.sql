-- Add Clerk identity mapping without touching the UUID primary key
alter table public.profiles
add column if not exists clerk_user_id text;

create unique index if not exists profiles_clerk_user_id_key
on public.profiles(clerk_user_id)
where clerk_user_id is not null;

create index if not exists profiles_email_lower_idx
on public.profiles(lower(email));

-- Idempotency tracking for Clerk webhooks
create table if not exists public.clerk_webhook_events (
  id text primary key,
  event_type text not null,
  status text not null default 'PROCESSING'
    check (status in ('PROCESSING','DONE','FAILED')),
  attempts int not null default 1,
  last_error text,
  payload jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Subject-type-aware identity resolver
create or replace function public.current_profile_id()
returns uuid
language plpgsql
security definer
stable
set search_path = public, auth
as $$
declare
  subj text := auth.jwt() ->> 'sub';
  pid uuid;
begin
  if subj is null or subj = '' then return null; end if;

  if subj like 'user\_%' then
    select id into pid from public.profiles
    where clerk_user_id = subj limit 1;
    return pid;
  end if;

  if subj ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$' then
    return subj::uuid;
  end if;

  return null;
end;
$$;

revoke all on function public.current_profile_id() from public;
grant execute on function public.current_profile_id() to authenticated;
