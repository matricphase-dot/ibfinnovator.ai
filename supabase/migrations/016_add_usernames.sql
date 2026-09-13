-- Add case-insensitive public usernames without changing UUID identity.
alter table public.profiles add column if not exists username text;
create unique index if not exists profiles_username_key on public.profiles(lower(username)) where username is not null;

update public.profiles
set username=lower(split_part(email,'@',1))||'_'||substr(id::text,1,6)
where username is null;

-- Delta safety fixes discovered while self-verifying already-applied 013/014.
drop policy if exists "room members send team messages" on public.messages;
create policy "room members send team messages" on public.messages for insert to authenticated with check(sender_id=public.current_profile_id() and (room_type<>'TEAM' or public.can_access_team_room(room_id)));
drop policy if exists "founders manage roles" on public.open_roles;
create policy "founders manage roles" on public.open_roles for all to authenticated using(exists(select 1 from public.projects p where p.id=project_id and p.founder_id=public.current_profile_id())) with check(exists(select 1 from public.projects p where p.id=project_id and p.founder_id=public.current_profile_id()));
drop policy if exists "own analytics" on public.analytics_events;
create policy "own analytics" on public.analytics_events for insert to authenticated with check(user_id=public.current_profile_id() or user_id is null);
drop policy if exists "own analytics read" on public.analytics_events;
create policy "own analytics read" on public.analytics_events for select to authenticated using(user_id=public.current_profile_id());

-- A finalize_onboarding function is not present in the current migration set.
-- When introduced, its profile update/insert must include the validated username.
