-- Dual-auth RLS: collaboration, reputation, safety and ecosystem.
create or replace function public.is_project_founder_for_room(target_room uuid) returns boolean language sql security definer stable set search_path=public as $$ select exists(select 1 from public.team_rooms tr join public.projects p on p.id=tr.project_id where tr.id=target_room and p.founder_id=public.current_profile_id()); $$;
create or replace function public.can_access_team_room(target_room uuid) returns boolean language sql security definer stable set search_path=public as $$ select exists(select 1 from public.team_members tm where tm.room_id=target_room and tm.user_id=public.current_profile_id()) or public.is_project_founder_for_room(target_room); $$;
create or replace function public.is_super_admin() returns boolean language sql security definer stable set search_path=public as $$ select exists(select 1 from public.profiles p where p.id=public.current_profile_id() and p.role='SUPER_ADMIN'); $$;
create or replace function public.delete_own_account() returns void language plpgsql security definer set search_path=public,auth as $$ declare pid uuid:=public.current_profile_id(); legacy_id uuid; begin if pid is null then raise exception 'Not authenticated'; end if; select id into legacy_id from auth.users where id=pid; if legacy_id is not null then delete from auth.users where id=pid; else delete from public.profiles where id=pid; end if; end; $$;
revoke all on function public.delete_own_account() from public; grant execute on function public.delete_own_account() to authenticated;

-- Open roles and analytics
drop policy if exists "founders manage roles" on public.open_roles;
create policy "founders manage roles" on public.open_roles for all to authenticated using(exists(select 1 from public.projects p where p.id=project_id and p.founder_id=public.current_profile_id())) with check(exists(select 1 from public.projects p where p.id=project_id and p.founder_id=public.current_profile_id()));
drop policy if exists "own analytics" on public.analytics_events;
create policy "own analytics" on public.analytics_events for insert to authenticated with check(user_id=public.current_profile_id() or user_id is null);
drop policy if exists "own analytics read" on public.analytics_events;
create policy "own analytics read" on public.analytics_events for select to authenticated using(user_id=public.current_profile_id());

-- Milestones
drop policy if exists "founder milestones manage" on public.milestones;
create policy "founder milestones manage" on public.milestones for all to authenticated using(exists(select 1 from public.projects p where p.id=project_id and p.founder_id=public.current_profile_id()));
-- Team rooms/members/tasks
drop policy if exists "rooms member read" on public.team_rooms; create policy "rooms member read" on public.team_rooms for select to authenticated using(public.can_access_team_room(id));
drop policy if exists "founders create rooms" on public.team_rooms; create policy "founders create rooms" on public.team_rooms for insert to authenticated with check(exists(select 1 from public.projects p where p.id=project_id and p.founder_id=public.current_profile_id()));
drop policy if exists "founders update rooms" on public.team_rooms; create policy "founders update rooms" on public.team_rooms for update to authenticated using(exists(select 1 from public.projects p where p.id=project_id and p.founder_id=public.current_profile_id()));
drop policy if exists "members can read own memberships" on public.team_members; create policy "members can read own memberships" on public.team_members for select to authenticated using(user_id=public.current_profile_id());
drop policy if exists "founders can read room memberships" on public.team_members; create policy "founders can read room memberships" on public.team_members for select to authenticated using(public.is_project_founder_for_room(room_id));
drop policy if exists "founders add members" on public.team_members; create policy "founders add members" on public.team_members for insert to authenticated with check(public.is_project_founder_for_room(room_id));
drop policy if exists "founders remove members" on public.team_members; create policy "founders remove members" on public.team_members for delete to authenticated using(user_id=public.current_profile_id() or public.is_project_founder_for_room(room_id));
drop policy if exists "team members read tasks" on public.team_tasks; create policy "team members read tasks" on public.team_tasks for select to authenticated using(public.can_access_team_room(room_id));
drop policy if exists "team members create tasks" on public.team_tasks; create policy "team members create tasks" on public.team_tasks for insert to authenticated with check(created_by=public.current_profile_id() and public.can_access_team_room(room_id));
drop policy if exists "members update tasks" on public.team_tasks; create policy "members update tasks" on public.team_tasks for update to authenticated using(public.can_access_team_room(room_id));
drop policy if exists "members delete own tasks" on public.team_tasks; create policy "members delete own tasks" on public.team_tasks for delete to authenticated using(created_by=public.current_profile_id() or public.is_project_founder_for_room(room_id));
-- Reactions
drop policy if exists "own reactions" on public.message_reactions; create policy "own reactions" on public.message_reactions for all to authenticated using(user_id=public.current_profile_id()) with check(user_id=public.current_profile_id());
-- Meetings
drop policy if exists "meetings attendee read" on public.meetings; create policy "meetings attendee read" on public.meetings for select to authenticated using(organizer_id=public.current_profile_id() or exists(select 1 from public.meeting_attendees a where a.meeting_id=id and a.user_id=public.current_profile_id()));
drop policy if exists "organizer meetings create" on public.meetings; create policy "organizer meetings create" on public.meetings for insert to authenticated with check(organizer_id=public.current_profile_id());
drop policy if exists "organizers manage meetings" on public.meetings; create policy "organizers manage meetings" on public.meetings for update to authenticated using(organizer_id=public.current_profile_id());
drop policy if exists "organizers delete meetings" on public.meetings; create policy "organizers delete meetings" on public.meetings for delete to authenticated using(organizer_id=public.current_profile_id());
drop policy if exists "attendees self read" on public.meeting_attendees; create policy "attendees self read" on public.meeting_attendees for select to authenticated using(user_id=public.current_profile_id());
drop policy if exists "attendees self update" on public.meeting_attendees; create policy "attendees self update" on public.meeting_attendees for update to authenticated using(user_id=public.current_profile_id());
drop policy if exists "organizers add attendees" on public.meeting_attendees; create policy "organizers add attendees" on public.meeting_attendees for insert to authenticated with check(exists(select 1 from public.meetings m where m.id=meeting_id and m.organizer_id=public.current_profile_id()));
drop policy if exists "organizers read attendees" on public.meeting_attendees; create policy "organizers read attendees" on public.meeting_attendees for select to authenticated using(user_id=public.current_profile_id() or exists(select 1 from public.meetings m where m.id=meeting_id and m.organizer_id=public.current_profile_id()));
drop policy if exists "organizers remove attendees" on public.meeting_attendees; create policy "organizers remove attendees" on public.meeting_attendees for delete to authenticated using(exists(select 1 from public.meetings m where m.id=meeting_id and m.organizer_id=public.current_profile_id()));
-- Reviews, endorsements and credentials
drop policy if exists "authenticated reviews" on public.reviews; create policy "authenticated reviews" on public.reviews for insert to authenticated with check(reviewer_id=public.current_profile_id());
drop policy if exists "authenticated endorsements" on public.endorsements; create policy "authenticated endorsements" on public.endorsements for insert to authenticated with check(giver_id=public.current_profile_id());
drop policy if exists "founders award badges" on public.user_badges; create policy "founders award badges" on public.user_badges for insert to authenticated with check(awarded_by=public.current_profile_id() and exists(select 1 from public.projects p where p.id=project_id and p.founder_id=public.current_profile_id()));
drop policy if exists "founders issue certificates" on public.certificates; create policy "founders issue certificates" on public.certificates for insert to authenticated with check(issued_by=public.current_profile_id() and exists(select 1 from public.projects p where p.id=project_id and p.founder_id=public.current_profile_id()));
-- Safety and ecosystem
drop policy if exists "own blocks" on public.user_blocks; create policy "own blocks" on public.user_blocks for all to authenticated using(blocker_id=public.current_profile_id()) with check(blocker_id=public.current_profile_id());
drop policy if exists "submit reports" on public.reports; create policy "submit reports" on public.reports for insert to authenticated with check(reporter_id=public.current_profile_id());
drop policy if exists "own reports read" on public.reports; create policy "own reports read" on public.reports for select to authenticated using(reporter_id=public.current_profile_id());
drop policy if exists "provider manages services" on public.marketplace_services; create policy "provider manages services" on public.marketplace_services for all to authenticated using(provider_id=public.current_profile_id()) with check(provider_id=public.current_profile_id());
drop policy if exists "host manages events" on public.community_events; create policy "host manages events" on public.community_events for all to authenticated using(host_id=public.current_profile_id()) with check(host_id=public.current_profile_id());
drop policy if exists "own attendance" on public.event_attendees; create policy "own attendance" on public.event_attendees for all to authenticated using(user_id=public.current_profile_id()) with check(user_id=public.current_profile_id());
drop policy if exists "members own read" on public.university_members; create policy "members own read" on public.university_members for select to authenticated using(user_id=public.current_profile_id());
