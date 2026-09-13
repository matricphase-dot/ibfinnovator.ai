-- Clerk identity mapping; additive and dual-auth compatible.
alter table public.profiles add column if not exists clerk_user_id text;
alter table public.profiles add column if not exists onboarding_completed boolean not null default false;
create unique index if not exists profiles_clerk_user_id_key on public.profiles(clerk_user_id) where clerk_user_id is not null;
create index if not exists profiles_email_lower_idx on public.profiles(lower(email));

create table if not exists public.clerk_identity_map (
  clerk_id text primary key,
  profile_id uuid not null unique references public.profiles(id) on delete cascade,
  email text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists clerk_identity_email_lower_key on public.clerk_identity_map(lower(email));

create table if not exists public.clerk_webhook_events (
  id text primary key,
  event_type text not null,
  status text not null default 'PROCESSING' check(status in ('PROCESSING','DONE','FAILED')),
  attempts int not null default 1,
  last_error text,
  payload jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.current_profile_id()
returns uuid language plpgsql security definer stable set search_path=public,auth as $$
declare subj text:=auth.jwt()->>'sub'; pid uuid;
begin
  if subj is null or subj='' then return null; end if;
  if subj like 'user\_%' then
    select p.id into pid from public.profiles p where p.clerk_user_id=subj limit 1;
    return pid;
  end if;
  if subj ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$' then return subj::uuid; end if;
  return null;
end;$$;
revoke all on function public.current_profile_id() from public;
grant execute on function public.current_profile_id() to authenticated;

create or replace function public.claim_clerk_webhook(p_id text,p_event_type text,p_payload jsonb)
returns table(claimed boolean,attempts int) language plpgsql security definer set search_path=public as $$
declare n int;
begin
  insert into public.clerk_webhook_events(id,event_type,payload) values(p_id,p_event_type,p_payload)
  on conflict(id) do nothing returning clerk_webhook_events.attempts into n;
  if found then return query select true,n; return; end if;
  update public.clerk_webhook_events set status='PROCESSING',attempts=clerk_webhook_events.attempts+1,last_error=null,payload=p_payload,updated_at=now()
  where id=p_id and status='FAILED' returning clerk_webhook_events.attempts into n;
  if found then return query select true,n; else return query select false,0; end if;
end;$$;
revoke all on function public.claim_clerk_webhook(text,text,jsonb) from public;
grant execute on function public.claim_clerk_webhook(text,text,jsonb) to service_role;

alter table public.clerk_identity_map enable row level security;
alter table public.clerk_webhook_events enable row level security;
