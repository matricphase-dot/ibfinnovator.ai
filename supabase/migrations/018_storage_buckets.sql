-- Storage buckets, dual-auth policies, and message delivery fields.
alter table public.messages add column if not exists read_at timestamptz;
alter table public.messages add column if not exists updated_at timestamptz not null default now();
alter table public.messages add column if not exists edited_at timestamptz;
alter table public.messages add column if not exists deleted_at timestamptz;
create table if not exists public.message_edits(id uuid primary key default gen_random_uuid(),message_id uuid not null references public.messages(id) on delete cascade,editor_id uuid not null references public.profiles(id) on delete cascade,previous_content text not null,edited_at timestamptz not null default now());
alter table public.message_edits enable row level security;
drop policy if exists "message participants read edit history" on public.message_edits;
create policy "message participants read edit history" on public.message_edits for select to authenticated using(editor_id=public.current_profile_id() or exists(select 1 from public.messages m where m.id=message_id and (m.sender_id=public.current_profile_id() or m.recipient_id=public.current_profile_id() or (m.room_id is not null and public.can_access_team_room(m.room_id)))));
drop policy if exists "message owner records edits" on public.message_edits;
create policy "message owner records edits" on public.message_edits for insert to authenticated with check(editor_id=public.current_profile_id());
alter table public.projects add column if not exists attachments text[] not null default '{}';
drop policy if exists "recipients mark messages read" on public.messages;
create policy "recipients mark messages read" on public.messages for update to authenticated using(recipient_id=public.current_profile_id()) with check(recipient_id=public.current_profile_id());

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values
 ('avatars','avatars',true,10485760,array['image/png','image/jpeg','image/webp']),
 ('resumes','resumes',false,10485760,array['application/pdf']),
 ('project-files','project-files',false,10485760,array['application/pdf','image/png','image/jpeg','image/webp','application/vnd.openxmlformats-officedocument.wordprocessingml.document','application/zip']),
 ('team-files','team-files',false,10485760,array['application/pdf','image/png','image/jpeg','image/webp','application/vnd.openxmlformats-officedocument.wordprocessingml.document','application/zip'])
on conflict(id) do update set file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types,public=excluded.public;

-- Public avatars; write paths must start with the internal profile UUID.
drop policy if exists "avatar public read" on storage.objects;
create policy "avatar public read" on storage.objects for select using(bucket_id='avatars');
drop policy if exists "avatar owner upload" on storage.objects;
create policy "avatar owner upload" on storage.objects for insert to authenticated with check(bucket_id='avatars' and (storage.foldername(name))[1]=public.current_profile_id()::text);
drop policy if exists "avatar owner manage" on storage.objects;
create policy "avatar owner manage" on storage.objects for update to authenticated using(bucket_id='avatars' and (storage.foldername(name))[1]=public.current_profile_id()::text);
drop policy if exists "avatar owner delete" on storage.objects;
create policy "avatar owner delete" on storage.objects for delete to authenticated using(bucket_id='avatars' and (storage.foldername(name))[1]=public.current_profile_id()::text);

-- Resume owner access. Founders receive time-limited signed URLs stored with applications.
drop policy if exists "resume owner read" on storage.objects;
create policy "resume owner read" on storage.objects for select to authenticated using(bucket_id='resumes' and (storage.foldername(name))[1]=public.current_profile_id()::text);
drop policy if exists "resume owner upload" on storage.objects;
create policy "resume owner upload" on storage.objects for insert to authenticated with check(bucket_id='resumes' and (storage.foldername(name))[1]=public.current_profile_id()::text);
drop policy if exists "resume owner delete" on storage.objects;
create policy "resume owner delete" on storage.objects for delete to authenticated using(bucket_id='resumes' and (storage.foldername(name))[1]=public.current_profile_id()::text);

-- Project files are readable by authenticated collaborators; owners write within UUID folders.
drop policy if exists "authenticated read project files" on storage.objects;
create policy "authenticated read project files" on storage.objects for select to authenticated using(bucket_id='project-files');
drop policy if exists "project file owner upload" on storage.objects;
create policy "project file owner upload" on storage.objects for insert to authenticated with check(bucket_id='project-files' and (storage.foldername(name))[1]=public.current_profile_id()::text);
drop policy if exists "project file owner delete" on storage.objects;
create policy "project file owner delete" on storage.objects for delete to authenticated using(bucket_id='project-files' and (storage.foldername(name))[1]=public.current_profile_id()::text);

-- Team paths begin with room UUID and require membership/founder access.
drop policy if exists "team members read files" on storage.objects;
create policy "team members read files" on storage.objects for select to authenticated using(bucket_id='team-files' and public.can_access_team_room(((storage.foldername(name))[1])::uuid));
drop policy if exists "team members upload files" on storage.objects;
create policy "team members upload files" on storage.objects for insert to authenticated with check(bucket_id='team-files' and public.can_access_team_room(((storage.foldername(name))[1])::uuid));
drop policy if exists "team members delete files" on storage.objects;
create policy "team members delete files" on storage.objects for delete to authenticated using(bucket_id='team-files' and public.can_access_team_room(((storage.foldername(name))[1])::uuid));

do $$ begin
 if not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='message_reactions') then alter publication supabase_realtime add table public.message_reactions; end if;
end $$;
