-- 022_review_edit_policies.sql
-- Batch 6 fix: let people correct or withdraw their own review / endorsement.
--
-- INVENTORY FIRST (verified against a real Postgres built from 001-021):
--   reviews      -> SELECT "reviews public read", INSERT "authenticated reviews"
--   endorsements -> SELECT "endorsements public read", INSERT "authenticated endorsements"
--   No UPDATE or DELETE policy existed on either table, so a member editing or
--   deleting their own row silently affected 0 rows.
--
-- This migration adds only those three policies (endorsements deliberately get
-- no UPDATE: `giver_id`, `receiver_id` and `skill` are the whole row, so editing
-- one is the same as deleting and re-adding it).
--
-- Identity goes through public.current_profile_id() -> no auth.uid(), matching
-- migrations 012-021.

-- ---------------------------------------------------------------------------
-- 1. Immutability guard.
--
-- RLS is row-level, not column-level: an UPDATE policy that lets a reviewer
-- change `rating` would also let them repoint `reviewee_id` or `project_id`,
-- manufacturing a review about someone they never worked with and bypassing the
-- collaborator check in the API. This trigger keeps those three columns fixed,
-- so the policy below can be safe on its own.
-- ---------------------------------------------------------------------------
create or replace function public.reviews_keep_identifiers_fixed()
returns trigger
language plpgsql
as $$
begin
  if new.reviewer_id is distinct from old.reviewer_id
     or new.reviewee_id is distinct from old.reviewee_id
     or new.project_id is distinct from old.project_id then
    raise exception
      'reviewer, reviewee and project cannot be changed on an existing review';
  end if;
  return new;
end;
$$;

drop trigger if exists reviews_keep_identifiers_fixed on public.reviews;
create trigger reviews_keep_identifiers_fixed
  before update on public.reviews
  for each row execute function public.reviews_keep_identifiers_fixed();

-- ---------------------------------------------------------------------------
-- 2. UPDATE / DELETE policies.
--    USING   = which existing rows you may target
--    WITH CHECK = what the row must look like afterwards
--    Both are set on UPDATE so the row cannot be handed to another member.
--    An UPDATE policy also governs SELECT of the updated row (FOR ALL semantics
--    do not apply here, but keeping both clauses consistent is deliberate).
-- ---------------------------------------------------------------------------
drop policy if exists "reviewers update own review" on public.reviews;
create policy "reviewers update own review" on public.reviews for update to authenticated
using (public.current_profile_id() = reviewer_id)
with check (public.current_profile_id() = reviewer_id);

drop policy if exists "reviewers delete own review" on public.reviews;
create policy "reviewers delete own review" on public.reviews for delete to authenticated
using (public.current_profile_id() = reviewer_id);

drop policy if exists "givers delete own endorsement" on public.endorsements;
create policy "givers delete own endorsement" on public.endorsements for delete to authenticated
using (public.current_profile_id() = giver_id);

-- ---------------------------------------------------------------------------
-- 3. Verification — expect 3 policies and 2 triggers.
-- ---------------------------------------------------------------------------
select
  (select count(*) from pg_policies
    where schemaname = 'public'
      and policyname in ('reviewers update own review',
                         'reviewers delete own review',
                         'givers delete own endorsement')) as new_policies_3,
  (select count(*) from pg_trigger
    where not tgisinternal
      and tgname in ('reviews_keep_identifiers_fixed',
                     'reviews_reputation_sync')) as review_triggers_2;

-- The policy list this batch is about:
select policyname, cmd
  from pg_policies
 where tablename in ('reviews', 'endorsements')
   and cmd in ('UPDATE', 'DELETE')
 order by tablename, cmd;
