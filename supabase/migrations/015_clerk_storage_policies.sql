-- Dual-auth storage policies. Existing UUID-owned and new Clerk-owned objects remain valid.
insert into storage.buckets(id,name,public,file_size_limit) values
 ('avatars','avatars',true,5242880),('resumes','resumes',false,10485760)
on conflict(id) do nothing;

drop policy if exists "team members read files" on storage.objects;
create policy "team members read files" on storage.objects for select to authenticated using(bucket_id='team-files' and public.can_access_team_room(((storage.foldername(name))[1])::uuid));
drop policy if exists "team members upload files" on storage.objects;
create policy "team members upload files" on storage.objects for insert to authenticated with check(bucket_id='team-files' and public.can_access_team_room(((storage.foldername(name))[1])::uuid));
drop policy if exists "users delete own team files" on storage.objects;
create policy "users delete own team files" on storage.objects for delete to authenticated using(bucket_id='team-files' and (owner_id=auth.jwt()->>'sub' or owner_id=public.current_profile_id()::text));

drop policy if exists "avatar public read" on storage.objects;
create policy "avatar public read" on storage.objects for select using(bucket_id='avatars');
drop policy if exists "avatar owner upload" on storage.objects;
create policy "avatar owner upload" on storage.objects for insert to authenticated with check(bucket_id='avatars' and ((storage.foldername(name))[1]=public.current_profile_id()::text));
drop policy if exists "avatar owner manage" on storage.objects;
create policy "avatar owner manage" on storage.objects for update to authenticated using(bucket_id='avatars' and (owner_id=auth.jwt()->>'sub' or owner_id=public.current_profile_id()::text));
drop policy if exists "avatar owner delete" on storage.objects;
create policy "avatar owner delete" on storage.objects for delete to authenticated using(bucket_id='avatars' and (owner_id=auth.jwt()->>'sub' or owner_id=public.current_profile_id()::text));

drop policy if exists "resume owner read" on storage.objects;
create policy "resume owner read" on storage.objects for select to authenticated using(bucket_id='resumes' and ((storage.foldername(name))[1]=public.current_profile_id()::text));
drop policy if exists "resume owner upload" on storage.objects;
create policy "resume owner upload" on storage.objects for insert to authenticated with check(bucket_id='resumes' and ((storage.foldername(name))[1]=public.current_profile_id()::text));
drop policy if exists "resume owner delete" on storage.objects;
create policy "resume owner delete" on storage.objects for delete to authenticated using(bucket_id='resumes' and (owner_id=auth.jwt()->>'sub' or owner_id=public.current_profile_id()::text));
