-- ==========================================================================
-- Migration 016 - Clerk RLS: remaining policies missed by table scoping
-- ==========================================================================
-- These two tables were not included in the 013/014 table lists, so their
-- policies were still using the legacy identity function. The same swap is
-- applied here so no policy anywhere in the schema is left behind.
--
-- Policies dropped and recreated (identity function swapped ONLY):
--   * founders manage roles  [public.open_roles]
--   * own analytics  [public.analytics_events]
--   * own analytics read  [public.analytics_events]
-- ==========================================================================
-- Only change per policy: the legacy identity call -> public.current_profile_id()
-- Name, table, command and all other conditions are preserved exactly.
-- None of these three policies originally declared a role, so no TO clause is
-- added (adding one would change semantics for anon/authenticated access).
-- Every DROP uses IF EXISTS so the migration is re-runnable.
-- ==========================================================================

drop policy if exists "founders manage roles" on public.open_roles;
create policy "founders manage roles" on public.open_roles for all
  using (exists(select 1 from projects p where p.id=project_id and p.founder_id=public.current_profile_id()));

drop policy if exists "own analytics" on public.analytics_events;
create policy "own analytics" on public.analytics_events for insert
  with check (public.current_profile_id()=user_id or user_id is null);

drop policy if exists "own analytics read" on public.analytics_events;
create policy "own analytics read" on public.analytics_events for select
  using (public.current_profile_id()=user_id);
