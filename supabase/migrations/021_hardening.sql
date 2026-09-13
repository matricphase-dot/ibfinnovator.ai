-- Production hardening fields. Additive; no existing identity or FK changes.
alter table public.profiles add column if not exists email_opt_in boolean not null default true;
alter table public.profiles add column if not exists last_seen_at timestamptz;
alter table public.notifications add column if not exists delivered_email_at timestamptz;
create index if not exists profiles_last_seen_idx on public.profiles(last_seen_at desc);

-- A caller can update only its own activity timestamp through the mapped UUID.
create or replace function public.touch_current_profile()
returns void language plpgsql security definer set search_path=public as $$
begin
 update public.profiles set last_seen_at=now()
 where id=public.current_profile_id()
   and (last_seen_at is null or last_seen_at<now()-interval '60 seconds');
end;$$;
revoke all on function public.touch_current_profile() from public;
grant execute on function public.touch_current_profile() to authenticated;
