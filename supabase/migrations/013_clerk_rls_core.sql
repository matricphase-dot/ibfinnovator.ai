-- ==========================================================================
-- Migration 013 - Clerk RLS: core tables
-- ==========================================================================
-- Identity-function migration for profile/project/application/connection/
-- message/bookmark/notification policies.
--
-- Policies dropped and recreated (identity function swapped ONLY):
--   * profiles self update  [public.profiles]
--   * founders create projects  [public.projects]
--   * founders manage own projects  [public.projects]
--   * founders delete own projects  [public.projects]
--   * application parties read  [public.applications]
--   * students apply  [public.applications]
--   * application parties update  [public.applications]
--   * connection parties read  [public.connections]
--   * request connection  [public.connections]
--   * recipient responds  [public.connections]
--   * general and party messages read  [public.messages]
--   * authenticated messages create  [public.messages]
--   * own bookmarks  [public.bookmarks]
--   * own notifications  [public.notifications]
--   * own notification updates  [public.notifications]
--   * room members send team messages  [public.messages]
--   * team members update messages  [public.messages]
-- ==========================================================================
-- Only change per policy: auth.uid -> public.current_profile_id()
-- Name, table, command, role and all other conditions are byte-identical.
-- Every DROP uses IF EXISTS so the migration is re-runnable.
drop policy if exists "profiles self update" on public.profiles;
create policy "profiles self update" on public.profiles for update
  using (public.current_profile_id()=id)
  with check (public.current_profile_id()=id);

drop policy if exists "founders create projects" on public.projects;
create policy "founders create projects" on public.projects for insert
  with check (public.current_profile_id()=founder_id and exists(select 1 from profiles where id=public.current_profile_id() and role in ('FOUNDER','SUPER_ADMIN')));

drop policy if exists "founders manage own projects" on public.projects;
create policy "founders manage own projects" on public.projects for update
  using (public.current_profile_id()=founder_id);

drop policy if exists "founders delete own projects" on public.projects;
create policy "founders delete own projects" on public.projects for delete
  using (public.current_profile_id()=founder_id);

drop policy if exists "application parties read" on public.applications;
create policy "application parties read" on public.applications for select
  using (public.current_profile_id()=student_id or exists(select 1 from projects p where p.id=project_id and p.founder_id=public.current_profile_id()));

drop policy if exists "students apply" on public.applications;
create policy "students apply" on public.applications for insert
  with check (public.current_profile_id()=student_id);

drop policy if exists "application parties update" on public.applications;
create policy "application parties update" on public.applications for update
  using (public.current_profile_id()=student_id or exists(select 1 from projects p where p.id=project_id and p.founder_id=public.current_profile_id()));

drop policy if exists "connection parties read" on public.connections;
create policy "connection parties read" on public.connections for select
  using (public.current_profile_id() in (requester_id,recipient_id));

drop policy if exists "request connection" on public.connections;
create policy "request connection" on public.connections for insert
  with check (public.current_profile_id()=requester_id);

drop policy if exists "recipient responds" on public.connections;
create policy "recipient responds" on public.connections for update
  using (public.current_profile_id()=recipient_id);

drop policy if exists "general and party messages read" on public.messages;
create policy "general and party messages read" on public.messages for select
  using (room_type='GENERAL' or public.current_profile_id() in(sender_id,recipient_id) or exists(select 1 from team_members where room_id=messages.room_id and user_id=public.current_profile_id()));

drop policy if exists "authenticated messages create" on public.messages;
create policy "authenticated messages create" on public.messages for insert
  with check (public.current_profile_id()=sender_id);

drop policy if exists "own bookmarks" on public.bookmarks;
create policy "own bookmarks" on public.bookmarks for all
  using (public.current_profile_id()=user_id)
  with check (public.current_profile_id()=user_id);

drop policy if exists "own notifications" on public.notifications;
create policy "own notifications" on public.notifications for select
  using (public.current_profile_id()=user_id);

drop policy if exists "own notification updates" on public.notifications;
create policy "own notification updates" on public.notifications for update
  using (public.current_profile_id()=user_id);

drop policy if exists "room members send team messages" on public.messages;
create policy "room members send team messages" on public.messages for insert to authenticated
  with check (sender_id=public.current_profile_id() and (room_type<>'TEAM' or public.can_access_team_room(room_id)));

drop policy if exists "team members update messages" on public.messages;
create policy "team members update messages" on public.messages for update to authenticated
  using (sender_id=public.current_profile_id() or (room_type='TEAM' and public.can_access_team_room(room_id)));

