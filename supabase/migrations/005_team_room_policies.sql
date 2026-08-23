-- Team room management and collaboration policies
create or replace function public.can_access_team_room(target_room uuid)
returns boolean language sql security definer stable set search_path=public as $$
 select exists(select 1 from public.team_members tm where tm.room_id=target_room and tm.user_id=auth.uid())
 or exists(select 1 from public.team_rooms tr join public.projects p on p.id=tr.project_id where tr.id=target_room and p.founder_id=auth.uid());
$$;

drop policy if exists "founders create rooms" on public.team_rooms;
create policy "founders create rooms" on public.team_rooms for insert to authenticated
with check(exists(select 1 from public.projects p where p.id=project_id and p.founder_id=auth.uid()));
drop policy if exists "founders update rooms" on public.team_rooms;
create policy "founders update rooms" on public.team_rooms for update to authenticated
using(exists(select 1 from public.projects p where p.id=project_id and p.founder_id=auth.uid()));
drop policy if exists "founders add members" on public.team_members;
create policy "founders add members" on public.team_members for insert to authenticated
with check(public.is_project_founder_for_room(room_id));
drop policy if exists "founders remove members" on public.team_members;
create policy "founders remove members" on public.team_members for delete to authenticated
using(public.is_project_founder_for_room(room_id) or user_id=auth.uid());
drop policy if exists "room members read team messages" on public.messages;
create policy "room members read team messages" on public.messages for select to authenticated
using(room_type<>'TEAM' or public.can_access_team_room(room_id));
drop policy if exists "room members send team messages" on public.messages;
create policy "room members send team messages" on public.messages for insert to authenticated
with check(sender_id=auth.uid() and (room_type<>'TEAM' or public.can_access_team_room(room_id)));
drop policy if exists "members update tasks" on public.team_tasks;
create policy "members update tasks" on public.team_tasks for update to authenticated using(public.can_access_team_room(room_id));
drop policy if exists "members delete own tasks" on public.team_tasks;
create policy "members delete own tasks" on public.team_tasks for delete to authenticated using(created_by=auth.uid() or public.is_project_founder_for_room(room_id));
