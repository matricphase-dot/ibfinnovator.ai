-- ==========================================================================
-- Migration 014 - Clerk RLS: collaboration, team, meeting and PRD tables
-- ==========================================================================
-- Identity-function migration for the remaining public.* policies, plus the
-- three helper functions that read auth.uid internally.
--
-- Policies dropped and recreated (identity function swapped ONLY):
--   * founder milestones manage  [public.milestones]
--   * authenticated reviews  [public.reviews]
--   * authenticated endorsements  [public.endorsements]
--   * rooms member read  [public.team_rooms]
--   * meetings attendee read  [public.meetings]
--   * organizer meetings create  [public.meetings]
--   * attendees self read  [public.meeting_attendees]
--   * attendees self update  [public.meeting_attendees]
--   * super admins can read investor inquiries  [public.investor_inquiries]
--   * super admins can update investor inquiries  [public.investor_inquiries]
--   * members can read own memberships  [public.team_members]
--   * cofounder public enabled read  [public.cofounder_profiles]
--   * cofounder self manage  [public.cofounder_profiles]
--   * own match actions  [public.match_actions]
--   * team members read tasks  [public.team_tasks]
--   * team members create tasks  [public.team_tasks]
--   * own reactions  [public.message_reactions]
--   * founders award badges  [public.user_badges]
--   * founders issue certificates  [public.certificates]
--   * own blocks  [public.user_blocks]
--   * submit reports  [public.reports]
--   * own reports read  [public.reports]
--   * provider manages services  [public.marketplace_services]
--   * host manages events  [public.community_events]
--   * own attendance  [public.event_attendees]
--   * members own read  [public.university_members]
--   * founders create rooms  [public.team_rooms]
--   * founders update rooms  [public.team_rooms]
--   * founders remove members  [public.team_members]
--   * members delete own tasks  [public.team_tasks]
--   * organizers manage meetings  [public.meetings]
--   * organizers delete meetings  [public.meetings]
--   * organizers add attendees  [public.meeting_attendees]
--   * organizers read attendees  [public.meeting_attendees]
--   * organizers remove attendees  [public.meeting_attendees]
-- ==========================================================================
-- Only change per policy: auth.uid -> public.current_profile_id()
-- Name, table, command, role and all other conditions are byte-identical.
-- Every DROP uses IF EXISTS so the migration is re-runnable.
-- --------------------------------------------------------------------------
-- Helper function updates (same signature, same SECURITY DEFINER, same search_path)
-- Only auth.uid -> public.current_profile_id() inside the body.
-- --------------------------------------------------------------------------

-- Was: 005_team_room_policies.sql
create or replace function public.can_access_team_room(target_room uuid)
returns boolean language sql security definer stable set search_path=public as $$
 select exists(select 1 from public.team_members tm where tm.room_id=target_room and tm.user_id=public.current_profile_id())
 or exists(select 1 from public.team_rooms tr join public.projects p on p.id=tr.project_id where tr.id=target_room and p.founder_id=public.current_profile_id());
$$;

-- Was: 003_fix_team_member_rls.sql
create or replace function public.is_project_founder_for_room(target_room uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from public.team_rooms tr
    join public.projects p on p.id = tr.project_id
    where tr.id = target_room and p.founder_id = public.current_profile_id()
  );
$$;

-- Was: 009_account_privacy.sql
create or replace function public.delete_own_account()
returns void language plpgsql security definer set search_path=public,auth as $$
declare uid uuid:=public.current_profile_id();
begin
 if uid is null then raise exception 'Not authenticated'; end if;
 delete from auth.users where id=uid;
end;$$;
revoke all on function public.delete_own_account() from public;
grant execute on function public.delete_own_account() to authenticated;

drop policy if exists "founder milestones manage" on public.milestones;
create policy "founder milestones manage" on public.milestones for all
  using (exists(select 1 from projects p where p.id=project_id and p.founder_id=public.current_profile_id()));

drop policy if exists "authenticated reviews" on public.reviews;
create policy "authenticated reviews" on public.reviews for insert
  with check (public.current_profile_id()=reviewer_id);

drop policy if exists "authenticated endorsements" on public.endorsements;
create policy "authenticated endorsements" on public.endorsements for insert
  with check (public.current_profile_id()=giver_id);

drop policy if exists "rooms member read" on public.team_rooms;
create policy "rooms member read" on public.team_rooms for select
  using (exists(select 1 from team_members where room_id=team_rooms.id and user_id=public.current_profile_id()));

drop policy if exists "meetings attendee read" on public.meetings;
create policy "meetings attendee read" on public.meetings for select
  using (public.current_profile_id()=organizer_id or exists(select 1 from meeting_attendees where meeting_id=meetings.id and user_id=public.current_profile_id()));

drop policy if exists "organizer meetings create" on public.meetings;
create policy "organizer meetings create" on public.meetings for insert
  with check (public.current_profile_id()=organizer_id);

drop policy if exists "attendees self read" on public.meeting_attendees;
create policy "attendees self read" on public.meeting_attendees for select
  using (public.current_profile_id()=user_id);

drop policy if exists "attendees self update" on public.meeting_attendees;
create policy "attendees self update" on public.meeting_attendees for update
  using (public.current_profile_id()=user_id);

drop policy if exists "super admins can read investor inquiries" on public.investor_inquiries;
create policy "super admins can read investor inquiries" on public.investor_inquiries for select to authenticated
  using (exists ( select 1 from public.profiles where profiles.id = public.current_profile_id() and profiles.role = 'SUPER_ADMIN' ));

drop policy if exists "super admins can update investor inquiries" on public.investor_inquiries;
create policy "super admins can update investor inquiries" on public.investor_inquiries for update to authenticated
  using (exists ( select 1 from public.profiles where profiles.id = public.current_profile_id() and profiles.role = 'SUPER_ADMIN' ));

drop policy if exists "members can read own memberships" on public.team_members;
create policy "members can read own memberships" on public.team_members for select to authenticated
  using (user_id = public.current_profile_id());

drop policy if exists "cofounder public enabled read" on public.cofounder_profiles;
create policy "cofounder public enabled read" on public.cofounder_profiles for select
  using (enabled or user_id=public.current_profile_id());

drop policy if exists "cofounder self manage" on public.cofounder_profiles;
create policy "cofounder self manage" on public.cofounder_profiles for all
  using (user_id=public.current_profile_id())
  with check (user_id=public.current_profile_id());

drop policy if exists "own match actions" on public.match_actions;
create policy "own match actions" on public.match_actions for all
  using (user_id=public.current_profile_id())
  with check (user_id=public.current_profile_id());

drop policy if exists "team members read tasks" on public.team_tasks;
create policy "team members read tasks" on public.team_tasks for select
  using (exists(select 1 from team_members tm where tm.room_id=team_tasks.room_id and tm.user_id=public.current_profile_id()));

drop policy if exists "team members create tasks" on public.team_tasks;
create policy "team members create tasks" on public.team_tasks for insert
  with check (created_by=public.current_profile_id() and exists(select 1 from team_members tm where tm.room_id=team_tasks.room_id and tm.user_id=public.current_profile_id()));

drop policy if exists "own reactions" on public.message_reactions;
create policy "own reactions" on public.message_reactions for all
  using (user_id=public.current_profile_id())
  with check (user_id=public.current_profile_id());

drop policy if exists "founders award badges" on public.user_badges;
create policy "founders award badges" on public.user_badges for insert
  with check (awarded_by=public.current_profile_id() and exists(select 1 from projects p where p.id=project_id and p.founder_id=public.current_profile_id()));

drop policy if exists "founders issue certificates" on public.certificates;
create policy "founders issue certificates" on public.certificates for insert
  with check (issued_by=public.current_profile_id() and exists(select 1 from projects p where p.id=project_id and p.founder_id=public.current_profile_id()));

drop policy if exists "own blocks" on public.user_blocks;
create policy "own blocks" on public.user_blocks for all
  using (blocker_id=public.current_profile_id())
  with check (blocker_id=public.current_profile_id());

drop policy if exists "submit reports" on public.reports;
create policy "submit reports" on public.reports for insert
  with check (reporter_id=public.current_profile_id());

drop policy if exists "own reports read" on public.reports;
create policy "own reports read" on public.reports for select
  using (reporter_id=public.current_profile_id());

drop policy if exists "provider manages services" on public.marketplace_services;
create policy "provider manages services" on public.marketplace_services for all
  using (provider_id=public.current_profile_id())
  with check (provider_id=public.current_profile_id());

drop policy if exists "host manages events" on public.community_events;
create policy "host manages events" on public.community_events for all
  using (host_id=public.current_profile_id())
  with check (host_id=public.current_profile_id());

drop policy if exists "own attendance" on public.event_attendees;
create policy "own attendance" on public.event_attendees for all
  using (user_id=public.current_profile_id())
  with check (user_id=public.current_profile_id());

drop policy if exists "members own read" on public.university_members;
create policy "members own read" on public.university_members for select
  using (user_id=public.current_profile_id());

drop policy if exists "founders create rooms" on public.team_rooms;
create policy "founders create rooms" on public.team_rooms for insert to authenticated
  with check (exists(select 1 from public.projects p where p.id=project_id and p.founder_id=public.current_profile_id()));

drop policy if exists "founders update rooms" on public.team_rooms;
create policy "founders update rooms" on public.team_rooms for update to authenticated
  using (exists(select 1 from public.projects p where p.id=project_id and p.founder_id=public.current_profile_id()));

drop policy if exists "founders remove members" on public.team_members;
create policy "founders remove members" on public.team_members for delete to authenticated
  using (public.is_project_founder_for_room(room_id) or user_id=public.current_profile_id());

drop policy if exists "members delete own tasks" on public.team_tasks;
create policy "members delete own tasks" on public.team_tasks for delete to authenticated
  using (created_by=public.current_profile_id() or public.is_project_founder_for_room(room_id));

drop policy if exists "organizers manage meetings" on public.meetings;
create policy "organizers manage meetings" on public.meetings for update to authenticated
  using (organizer_id=public.current_profile_id());

drop policy if exists "organizers delete meetings" on public.meetings;
create policy "organizers delete meetings" on public.meetings for delete to authenticated
  using (organizer_id=public.current_profile_id());

drop policy if exists "organizers add attendees" on public.meeting_attendees;
create policy "organizers add attendees" on public.meeting_attendees for insert to authenticated
  with check (exists(select 1 from public.meetings m where m.id=meeting_id and m.organizer_id=public.current_profile_id()));

drop policy if exists "organizers read attendees" on public.meeting_attendees;
create policy "organizers read attendees" on public.meeting_attendees for select to authenticated
  using (user_id=public.current_profile_id() or exists(select 1 from public.meetings m where m.id=meeting_id and m.organizer_id=public.current_profile_id()));

drop policy if exists "organizers remove attendees" on public.meeting_attendees;
create policy "organizers remove attendees" on public.meeting_attendees for delete to authenticated
  using (exists(select 1 from public.meetings m where m.id=meeting_id and m.organizer_id=public.current_profile_id()));

