-- 020_storage_and_messaging.sql
-- Batch 5: file uploads + messaging polish.
--
-- INVENTORY FIRST (what already existed when this migration was written):
--   buckets      : team-files only (created in 006, private, 10 MB)
--   messages     : attachments text[], parent_id uuid, read_at timestamptz already present
--   reactions    : message_reactions complete, PK(message_id,user_id,emoji)
--   storage pols : "team members read files", "team members upload files",
--                  "users delete own team files" — all team-files only
--   indexes      : messages_room_created only
--
-- So this migration adds ONLY what is missing. Every statement is idempotent.
--
-- Note on messages.channel: /api/team/messages POSTs a `channel` value and the
-- team room UI filters messages by channel, but the column never existed — every
-- team message send failed with "column channel of relation messages does not
-- exist". It is added here so team chat works.

-- ---------------------------------------------------------------------------
-- 1. Buckets — avatars/resumes/project-files/service-portfolios are new.
--    team-files already exists; the upsert only widens its allowed types so
--    .docx is accepted (the batch spec lists docx for team-files).
-- ---------------------------------------------------------------------------
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values
  ('avatars','avatars',true,2097152,array['image/png','image/jpeg','image/webp']),
  ('resumes','resumes',false,10485760,array['application/pdf']),
  ('project-files','project-files',false,10485760,array['application/pdf','image/png','image/jpeg','image/webp','application/vnd.openxmlformats-officedocument.wordprocessingml.document','application/zip','text/plain']),
  ('team-files','team-files',false,10485760,array['application/pdf','image/png','image/jpeg','image/webp','application/vnd.openxmlformats-officedocument.wordprocessingml.document','application/zip','text/plain']),
  ('service-portfolios','service-portfolios',true,10485760,array['image/png','image/jpeg','image/webp','application/pdf'])
on conflict(id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- ---------------------------------------------------------------------------
-- 2. messages columns — only edited_at / deleted_at were missing.
--    (attachments, parent_id and read_at already exist from 001; parent_id is
--    ON DELETE SET NULL there and is deliberately left as-is.)
-- ---------------------------------------------------------------------------
alter table public.messages add column if not exists edited_at timestamptz;
alter table public.messages add column if not exists deleted_at timestamptz;
alter table public.messages add column if not exists channel text not null default 'General';

-- ---------------------------------------------------------------------------
-- 3. Storage policies for the new buckets.
--    Identity always goes through public.current_profile_id() — no auth.uid()
--    anywhere, matching migrations 012-018.
-- ---------------------------------------------------------------------------

-- Avatars are a public bucket: anyone (signed out included) may read them.
drop policy if exists "avatars are publicly readable" on storage.objects;
create policy "avatars are publicly readable" on storage.objects for select to anon, authenticated
using (bucket_id = 'avatars');

-- Service portfolios are public too (they are shared as work samples).
drop policy if exists "service portfolios are publicly readable" on storage.objects;
create policy "service portfolios are publicly readable" on storage.objects for select to anon, authenticated
using (bucket_id = 'service-portfolios');

-- Private, owner-scoped reads: a member reads files they stored under their own
-- profile id folder. Resumes additionally allow a founder who is reviewing an
-- application from that student — without this the "View Resume" button could
-- never work for the person who is meant to read it.
drop policy if exists "members read own scoped files" on storage.objects;
create policy "members read own scoped files" on storage.objects for select to authenticated
using (
  bucket_id in ('resumes','project-files')
  and (storage.foldername(name))[1] = public.current_profile_id()::text
);

drop policy if exists "founders read applicant resumes" on storage.objects;
create policy "founders read applicant resumes" on storage.objects for select to authenticated
using (
  bucket_id = 'resumes'
  and exists (
    select 1
    from public.applications a
    join public.projects p on p.id = a.project_id
    where a.student_id::text = (storage.foldername(name))[1]
      and p.founder_id = public.current_profile_id()
  )
);

-- Writes are always confined to the caller's own folder.
drop policy if exists "members upload own scoped files" on storage.objects;
create policy "members upload own scoped files" on storage.objects for insert to authenticated
with check (
  bucket_id in ('avatars','resumes','project-files','service-portfolios')
  and (storage.foldername(name))[1] = public.current_profile_id()::text
);

drop policy if exists "members update own scoped files" on storage.objects;
create policy "members update own scoped files" on storage.objects for update to authenticated
using (
  bucket_id in ('avatars','resumes','project-files','service-portfolios')
  and (storage.foldername(name))[1] = public.current_profile_id()::text
)
with check (
  bucket_id in ('avatars','resumes','project-files','service-portfolios')
  and (storage.foldername(name))[1] = public.current_profile_id()::text
);

-- Delete is by owner. Mirrors the dual-auth form used by migration 015 so both
-- Supabase (uuid) and Clerk (user_*) subjects match during rollout.
drop policy if exists "members delete own scoped files" on storage.objects;
create policy "members delete own scoped files" on storage.objects for delete to authenticated
using (
  bucket_id in ('avatars','resumes','project-files','service-portfolios')
  and (
    owner_id = auth.jwt() ->> 'sub'
    or owner_id = public.current_profile_id()::text
  )
);

-- ---------------------------------------------------------------------------
-- 4. Indexes. messages_room_created already exists.
--    A separate message_reactions(message_id) index is NOT added: the primary
--    key (message_id,user_id,emoji) already indexes message_id as its leading
--    column, so an extra index would only cost write time.
-- ---------------------------------------------------------------------------
create index if not exists messages_parent_idx on public.messages(parent_id) where parent_id is not null;
create index if not exists messages_unread_idx on public.messages(read_at) where read_at is null;

-- ---------------------------------------------------------------------------
-- 5. Read receipts.
--
-- The UPDATE policy on public.messages (migration 013) is
--   using (sender_id = current_profile_id() or (room_type='TEAM' and can_access_team_room(room_id)))
-- so the *recipient* can never update a row to set read_at. RLS is row-level,
-- not column-level, so simply letting recipients UPDATE would also let them
-- rewrite the message body. Instead this SECURITY DEFINER function updates
-- exactly one column, only on rows addressed to the caller.
-- ---------------------------------------------------------------------------
create or replace function public.mark_messages_read(p_message_ids uuid[])
returns int
language sql
security definer
set search_path = public, auth
as $$
  with updated as (
    update public.messages
       set read_at = now()
     where id = any(p_message_ids)
       and recipient_id = public.current_profile_id()
       and read_at is null
    returning 1
  )
  select count(*)::int from updated;
$$;

-- Same ACL shape as finalize_onboarding in 019: authenticated only, never anon.
revoke all on function public.mark_messages_read(uuid[]) from public;
revoke all on function public.mark_messages_read(uuid[]) from anon;
grant execute on function public.mark_messages_read(uuid[]) to authenticated;

-- ---------------------------------------------------------------------------
-- 6. Verification — expect 5 buckets, 5 new columns, 7 new policies, 1 RPC.
-- ---------------------------------------------------------------------------
select
  (select count(*) from storage.buckets
    where id in ('avatars','resumes','project-files','team-files','service-portfolios')) as buckets_5,
  (select count(*) from information_schema.columns
    where table_name='messages'
      and column_name in ('attachments','parent_id','read_at','edited_at','deleted_at')) as message_columns_5,
  (select count(*) from pg_policies
    where schemaname='storage' and tablename='objects'
      and policyname in ('avatars are publicly readable','service portfolios are publicly readable',
                         'members read own scoped files','founders read applicant resumes',
                         'members upload own scoped files','members update own scoped files',
                         'members delete own scoped files')) as new_policies_7,
  (select count(*) from pg_indexes where tablename='messages' and indexname='messages_parent_idx') as parent_index_1,
  (select count(*) from pg_proc where proname='mark_messages_read'
     and pg_get_function_identity_arguments(oid)='p_message_ids uuid[]') as read_rpc_1;
