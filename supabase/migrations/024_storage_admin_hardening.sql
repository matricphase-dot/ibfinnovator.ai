-- ROOT FIX M8: tighten over-permissive storage reads.
-- Before: any authenticated user could SELECT any `project-files` object by
-- guessing `<victim-uuid>/...` paths. Avatars allowed 10MB (app allows 2MB).
-- After: project-files + resumes are owner-folder-only reads. Sharing with
-- collaborators happens via app-generated signed URLs AFTER project/room
-- authorization — never via direct storage SELECT. Avatar limits match app.

-- 1. Enforce 2MB avatar limit to match MAX_BY_BUCKET (was 10MB).
update storage.buckets set file_size_limit = 2097152 where id = 'avatars';

-- 2. Project files: owner-only read (was: any authenticated).
drop policy if exists "authenticated read project files" on storage.objects;
create policy "project file owner read" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'project-files'
    and (storage.foldername(name))[1] = public.current_profile_id()::text
  );

-- Keep owner upload/delete (re-declared for clarity after drop).
drop policy if exists "project file owner upload" on storage.objects;
create policy "project file owner upload" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'project-files'
    and (storage.foldername(name))[1] = public.current_profile_id()::text
  );
drop policy if exists "project file owner delete" on storage.objects;
create policy "project file owner delete" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'project-files'
    and (storage.foldername(name))[1] = public.current_profile_id()::text
  );

-- 3. Avatars: unify on path-based folder check (owner_id is mutable/driver-dependent).
drop policy if exists "avatar owner manage" on storage.objects;
create policy "avatar owner manage" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = public.current_profile_id()::text
  )
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = public.current_profile_id()::text
  );
drop policy if exists "avatar owner delete" on storage.objects;
create policy "avatar owner delete" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = public.current_profile_id()::text
  );

-- 4. Resumes: unify delete on path (was owner_id-based in one migration).
drop policy if exists "resume owner delete" on storage.objects;
create policy "resume owner delete" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'resumes'
    and (storage.foldername(name))[1] = public.current_profile_id()::text
  );

-- 5. Audit table for M6 admin checks (best-effort; insert-only for authenticated).
create table if not exists public.admin_audit_log (
  id uuid primary key default gen_random_uuid(),
  clerk_user_id text,
  profile_id uuid references public.profiles(id) on delete set null,
  path text not null,
  granted boolean not null,
  created_at timestamptz not null default now()
);
alter table public.admin_audit_log enable row level security;
drop policy if exists "no direct read" on public.admin_audit_log;
-- No SELECT/UPDATE/DELETE policies: only service-role (supabaseAdmin) can read.
-- Inserts go through service-role as well (requireSuperAdmin uses supabaseAdmin).
