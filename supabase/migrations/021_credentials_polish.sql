-- 021_credentials_polish.sql
-- Batch 6: badges, certificates, reviews and endorsements.
--
-- INVENTORY FIRST (verified against a real Postgres built from 001-020):
--   profiles.average_rating        ALREADY EXISTS (001)
--   profiles.endorsement_count     ALREADY EXISTS (001)
--   certificates.verification_code, started_at, completed_at  ALREADY EXIST (004)
--   reviews UNIQUE(reviewer,reviewee,project), CHECK(reviewer<>reviewee),
--   CHECK(rating 1..5), endorsements UNIQUE(giver,receiver,skill),
--   CHECK(giver<>receiver), user_badges UNIQUE(badge,receiver,project),
--   certificates UNIQUE(receiver,project)        ALL ALREADY EXIST
--   functions matching %reputation%/%rating%      NONE
--   triggers on reviews/endorsements              NONE
--   indexes on reviews/endorsements/user_badges/certificates beyond the
--   constraint indexes                            NONE
--
-- So this migration adds ONLY: four indexes, the reputation function, its
-- triggers, and a backfill. Nothing here recreates an existing column,
-- constraint or table. Every statement is idempotent.

-- ---------------------------------------------------------------------------
-- 1. Indexes for the queries the UI actually runs.
--    (The unique constraints already cover the duplicate checks; these support
--    "newest first" listing by receiver and per-skill endorsement grouping.)
-- ---------------------------------------------------------------------------
create index if not exists reviews_reviewee_created_idx
  on public.reviews(reviewee_id, created_at desc);

create index if not exists endorsements_receiver_skill_idx
  on public.endorsements(receiver_id, skill);

create index if not exists user_badges_receiver_created_idx
  on public.user_badges(receiver_id, created_at desc);

create index if not exists certificates_receiver_created_idx
  on public.certificates(receiver_id, created_at desc);

-- ---------------------------------------------------------------------------
-- 2. Reputation recompute.
--
--    Replaces the read-modify-write the API routes used to do (which could lose
--    concurrent updates): the aggregate is computed in a single statement.
--    SECURITY DEFINER because profiles is not writable by other members, so the
--    triggers below could not update another member's row otherwise. It only
--    ever writes the two derived reputation columns.
-- ---------------------------------------------------------------------------
create or replace function public.recompute_profile_reputation(p_profile uuid)
returns void
language sql
security definer
set search_path = public, auth
as $$
  update public.profiles p
     set average_rating = agg.avg_rating,
         endorsement_count = agg.endorsement_count
    from (
      select
        (select round(avg(r.rating)::numeric, 2)
           from public.reviews r
          where r.reviewee_id = p_profile) as avg_rating,
        (select count(*)
           from public.endorsements e
          where e.receiver_id = p_profile) as endorsement_count
    ) agg
   where p.id = p_profile;
$$;

-- Same ACL shape as finalize_onboarding (019) and mark_messages_read (020):
-- callable by signed-in members, never by anon. Anonymous visitors still read
-- the resulting values through the public profiles SELECT policy.
revoke all on function public.recompute_profile_reputation(uuid) from public;
revoke all on function public.recompute_profile_reputation(uuid) from anon;
grant execute on function public.recompute_profile_reputation(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- 3. Triggers — keep the two derived columns correct no matter which path
--    writes, and also on delete (a removed review must not leave a stale mean).
--    old/new are only referenced when they are non-null: a DELETE has no NEW,
--    an INSERT has no OLD.
-- ---------------------------------------------------------------------------
create or replace function public.reviews_recompute_reputation()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if (tg_op = 'DELETE') then
    perform public.recompute_profile_reputation(old.reviewee_id);
  elsif (tg_op = 'INSERT') then
    perform public.recompute_profile_reputation(new.reviewee_id);
  else
    perform public.recompute_profile_reputation(new.reviewee_id);
    if (new.reviewee_id is distinct from old.reviewee_id) then
      perform public.recompute_profile_reputation(old.reviewee_id);
    end if;
  end if;
  return null;
end;
$$;

create or replace function public.endorsements_recompute_reputation()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if (tg_op = 'DELETE') then
    perform public.recompute_profile_reputation(old.receiver_id);
  else
    perform public.recompute_profile_reputation(new.receiver_id);
  end if;
  return null;
end;
$$;

drop trigger if exists reviews_reputation_sync on public.reviews;
create trigger reviews_reputation_sync
  after insert or update or delete on public.reviews
  for each row execute function public.reviews_recompute_reputation();

drop trigger if exists endorsements_reputation_sync on public.endorsements;
create trigger endorsements_reputation_sync
  after insert or delete on public.endorsements
  for each row execute function public.endorsements_recompute_reputation();

-- ---------------------------------------------------------------------------
-- 4. Backfill — bring every existing profile in line with the current data.
-- ---------------------------------------------------------------------------
select public.recompute_profile_reputation(id) from public.profiles;

-- ---------------------------------------------------------------------------
-- 5. Verification — expect profiles_2 | function_1 | triggers_2 | indexes_4.
-- ---------------------------------------------------------------------------
select
  (select count(*) from information_schema.columns
    where table_name = 'profiles'
      and column_name in ('average_rating', 'endorsement_count')) as profiles_2,
  (select count(*) from pg_proc
    where proname = 'recompute_profile_reputation'
      and pg_get_function_identity_arguments(oid) = 'p_profile uuid') as function_1,
  (select count(*) from pg_trigger
    where not tgisinternal
      and tgname in ('reviews_reputation_sync', 'endorsements_reputation_sync')) as triggers_2,
  (select count(*) from pg_indexes
    where indexname in ('reviews_reviewee_created_idx', 'endorsements_receiver_skill_idx',
                        'user_badges_receiver_created_idx', 'certificates_receiver_created_idx')) as indexes_4;
