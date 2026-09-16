-- ==========================================================================
-- Migration 015 - Clerk storage policies
-- ==========================================================================
-- Storage bucket coverage in this repo:
--   * team-files  -> bucket created in 006_team_collaboration_files.sql
--
-- Only ONE storage policy reads auth.uid directly:
--   * "users delete own team files"  [storage.objects, DELETE]
--
-- The other two team-files policies do NOT reference auth.uid and are
-- therefore deliberately left untouched (they delegate identity to
-- public.can_access_team_room(), which migration 014 already migrates):
--   * "team members read files"    -> can_access_team_room((storage.foldername(name))[1])::uuid
--   * "team members upload files"  -> can_access_team_room((storage.foldername(name))[1])::uuid
--
-- Ownership check uses the dual-auth form so Supabase and Clerk sessions both
-- match the storage owner during rollout:
--   owner_id = auth.jwt() ->> 'sub'   (works for Supabase UUID subs AND Clerk user_* subs)
--   or owner_id = public.current_profile_id()::text  (resolved profile UUID)
-- For a Supabase subject both clauses are equivalent to the previous
-- owner_id = auth.uid::text, so existing behaviour is preserved exactly.
-- ==========================================================================

drop policy if exists "users delete own team files" on storage.objects;
create policy "users delete own team files" on storage.objects for delete to authenticated
  using (bucket_id='team-files' and ((owner_id = auth.jwt() ->> 'sub') or (owner_id = public.current_profile_id()::text)));
