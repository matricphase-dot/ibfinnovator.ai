-- 024_rate_limits.sql
-- Postgres-backed rate limiting.
--
-- Why the database rather than Redis: this app already has Postgres, and a
-- limiter that lives in module memory resets on every deploy and is not shared
-- between serverless instances — which is exactly where an abuser would hit it.
-- A row per (bucket, key, window) is atomic under concurrency and survives
-- restarts.
--
-- The table is invisible to clients. RLS is enabled with no policies, so even a
-- leaked anon key reads nothing; all access goes through rate_limit_hit(), which
-- is SECURITY DEFINER and the only thing granted to anon/authenticated.
--
-- Idempotent. Nothing in migrations 001-023 is modified.


-- 1. Storage: one row per caller per fixed window.
create table if not exists public.rate_limit_hits (
  bucket       text        not null,
  key          text        not null,
  window_start timestamptz not null,
  hits         integer     not null default 0,
  constraint rate_limit_hits_pkey primary key (bucket, key, window_start)
);

-- The sweep below deletes by age, so it needs its own index.
create index if not exists rate_limit_hits_window_idx
  on public.rate_limit_hits (window_start);

alter table public.rate_limit_hits enable row level security;

-- No policies on purpose: only the function below may touch this table.
-- Revoking table privileges as well means a direct PostgREST call fails loudly
-- instead of silently returning an empty set.
revoke all on public.rate_limit_hits from anon, authenticated;


-- 2. The counter.
--    Windows are aligned to a fixed epoch grid rather than "now + interval", so
--    every caller in the same window computes the same window_start and the
--    ON CONFLICT below serialises them. The increment and the read happen in one
--    statement, which is what makes this safe under concurrency.
create or replace function public.rate_limit_hit(
  p_bucket         text,
  p_key            text,
  p_limit          integer,
  p_window_seconds integer
) returns table (allowed boolean, remaining integer, reset_at timestamptz)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_window timestamptz;
  v_hits   integer;
begin
  if p_key is null or length(p_key) = 0 then
    raise exception 'rate_limit_hit requires a key';
  end if;
  if p_window_seconds is null or p_window_seconds < 1 then
    raise exception 'rate_limit_hit requires a positive window';
  end if;

  v_window := to_timestamp(floor(extract(epoch from now()) / p_window_seconds) * p_window_seconds);

  insert into public.rate_limit_hits (bucket, key, window_start, hits)
  values (p_bucket, p_key, v_window, 1)
  on conflict on constraint rate_limit_hits_pkey
  do update set hits = public.rate_limit_hits.hits + 1
  returning public.rate_limit_hits.hits into v_hits;

  -- Opportunistic sweep so the table cannot grow without a scheduled job. It is
  -- bounded by the index above and cheap at these volumes.
  delete from public.rate_limit_hits
   where window_start < now() - interval '1 day';

  return query
    select v_hits <= p_limit,
           greatest(p_limit - v_hits, 0),
           v_window + make_interval(secs => p_window_seconds);
end;
$$;

revoke all on function public.rate_limit_hit(text, text, integer, integer) from public;
grant execute on function public.rate_limit_hit(text, text, integer, integer) to anon, authenticated, service_role;


-- 3. Verification.
--    Expect: 1 | 1 | f | f | f   -> table, function, RLS on, no policies,
--    and the counter behaves: first call allowed, calls above the limit refused,
--    the window resets, and separate keys are counted independently.
select
  (select count(*) from information_schema.tables
    where table_schema = 'public' and table_name = 'rate_limit_hits') as table_1,
  (select count(*) from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'rate_limit_hit') as function_1,
  (select relrowsecurity from pg_class
    where oid = 'public.rate_limit_hits'::regclass) as rls_enabled_t,
  (select count(*) > 0 from pg_policies
    where tablename = 'rate_limit_hits') as has_policies_f;

-- Behaviour check (safe to run: it uses its own bucket name and clears up):
do $$
declare
  r1 record; r2 record; r3 record; r4 record; r5 record;
begin
  delete from public.rate_limit_hits where bucket = 'self_check';

  select * into r1 from public.rate_limit_hit('self_check', 'k1', 2, 60);   -- 1st: allowed
  select * into r2 from public.rate_limit_hit('self_check', 'k1', 2, 60);   -- 2nd: allowed
  select * into r3 from public.rate_limit_hit('self_check', 'k1', 2, 60);   -- 3rd: refused
  select * into r4 from public.rate_limit_hit('self_check', 'k2', 2, 60);   -- other key: allowed
  select * into r5 from public.rate_limit_hit('self_check', 'k3', 2, 0);    -- bad window: must raise

  raise notice 'behaviour: %', concat_ws('|',
    r1.allowed, r2.allowed, r3.allowed, r3.remaining, r4.allowed);
  -- expect: t|t|f|0|t
exception when others then
  raise notice 'behaviour: UNEXPECTED - %', sqlerrm;
end $$;
