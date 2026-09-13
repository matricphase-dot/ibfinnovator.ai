-- Dual-auth RLS: core product tables. Run after 012.
-- Profiles
drop policy if exists "profiles self update" on public.profiles;
create policy "profiles self update" on public.profiles for update to authenticated using(id=public.current_profile_id()) with check(id=public.current_profile_id());
-- Projects
drop policy if exists "founders create projects" on public.projects;
create policy "founders create projects" on public.projects for insert to authenticated with check(founder_id=public.current_profile_id() and exists(select 1 from public.profiles p where p.id=public.current_profile_id() and p.role in ('FOUNDER','SUPER_ADMIN')));
drop policy if exists "founders manage own projects" on public.projects;
create policy "founders manage own projects" on public.projects for update to authenticated using(founder_id=public.current_profile_id());
drop policy if exists "founders delete own projects" on public.projects;
create policy "founders delete own projects" on public.projects for delete to authenticated using(founder_id=public.current_profile_id());
-- Applications
drop policy if exists "application parties read" on public.applications;
create policy "application parties read" on public.applications for select to authenticated using(student_id=public.current_profile_id() or exists(select 1 from public.projects p where p.id=project_id and p.founder_id=public.current_profile_id()));
drop policy if exists "students apply" on public.applications;
create policy "students apply" on public.applications for insert to authenticated with check(student_id=public.current_profile_id());
drop policy if exists "application parties update" on public.applications;
create policy "application parties update" on public.applications for update to authenticated using(student_id=public.current_profile_id() or exists(select 1 from public.projects p where p.id=project_id and p.founder_id=public.current_profile_id()));
-- Connections
drop policy if exists "connection parties read" on public.connections;
create policy "connection parties read" on public.connections for select to authenticated using(public.current_profile_id() in (requester_id,recipient_id));
drop policy if exists "request connection" on public.connections;
create policy "request connection" on public.connections for insert to authenticated with check(requester_id=public.current_profile_id());
drop policy if exists "recipient responds" on public.connections;
create policy "recipient responds" on public.connections for update to authenticated using(recipient_id=public.current_profile_id());
-- Messages
drop policy if exists "general and party messages read" on public.messages;
create policy "general and party messages read" on public.messages for select to authenticated using(room_type='GENERAL' or public.current_profile_id() in(sender_id,recipient_id) or (room_id is not null and public.can_access_team_room(room_id)));
drop policy if exists "authenticated messages create" on public.messages;
create policy "authenticated messages create" on public.messages for insert to authenticated with check(sender_id=public.current_profile_id());
drop policy if exists "team members update messages" on public.messages;
create policy "team members update messages" on public.messages for update to authenticated using(sender_id=public.current_profile_id() or (room_type='TEAM' and public.can_access_team_room(room_id)));
-- Bookmarks
drop policy if exists "own bookmarks" on public.bookmarks;
create policy "own bookmarks" on public.bookmarks for all to authenticated using(user_id=public.current_profile_id()) with check(user_id=public.current_profile_id());
-- Notifications
drop policy if exists "own notifications" on public.notifications;
create policy "own notifications" on public.notifications for select to authenticated using(user_id=public.current_profile_id());
drop policy if exists "own notification updates" on public.notifications;
create policy "own notification updates" on public.notifications for update to authenticated using(user_id=public.current_profile_id());
-- Investor inquiries remain public-insert; admin read is handled outside customer app.
-- Co-founder profiles
drop policy if exists "cofounder public enabled read" on public.cofounder_profiles;
create policy "cofounder public enabled read" on public.cofounder_profiles for select to authenticated using(enabled or user_id=public.current_profile_id());
drop policy if exists "cofounder self manage" on public.cofounder_profiles;
create policy "cofounder self manage" on public.cofounder_profiles for all to authenticated using(user_id=public.current_profile_id()) with check(user_id=public.current_profile_id());
-- Match actions
drop policy if exists "own match actions" on public.match_actions;
create policy "own match actions" on public.match_actions for all to authenticated using(user_id=public.current_profile_id()) with check(user_id=public.current_profile_id());
