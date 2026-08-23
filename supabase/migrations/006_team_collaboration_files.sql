-- Team collaboration attachments and storage policies
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('team-files','team-files',false,10485760,array['application/pdf','image/png','image/jpeg','image/webp','text/plain','application/zip'])
on conflict(id) do update set file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;

drop policy if exists "team members read files" on storage.objects;
create policy "team members read files" on storage.objects for select to authenticated
using(bucket_id='team-files' and public.can_access_team_room(((storage.foldername(name))[1])::uuid));
drop policy if exists "team members upload files" on storage.objects;
create policy "team members upload files" on storage.objects for insert to authenticated
with check(bucket_id='team-files' and public.can_access_team_room(((storage.foldername(name))[1])::uuid));
drop policy if exists "users delete own team files" on storage.objects;
create policy "users delete own team files" on storage.objects for delete to authenticated
using(bucket_id='team-files' and owner_id=auth.uid()::text);

drop policy if exists "team members update messages" on public.messages;
create policy "team members update messages" on public.messages for update to authenticated
using(sender_id=auth.uid() or (room_type='TEAM' and public.can_access_team_room(room_id)));
