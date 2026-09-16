-- Remove meetings <-> meeting_attendees recursive RLS evaluation.
create or replace function public.is_meeting_organizer(p_meeting_id uuid)
returns boolean language sql security definer stable set search_path=public as $$
 select exists(select 1 from public.meetings m where m.id=p_meeting_id and m.organizer_id=public.current_profile_id());
$$;
create or replace function public.can_access_meeting(p_meeting_id uuid)
returns boolean language sql security definer stable set search_path=public as $$
 select public.is_meeting_organizer(p_meeting_id) or exists(select 1 from public.meeting_attendees a where a.meeting_id=p_meeting_id and a.user_id=public.current_profile_id());
$$;
revoke all on function public.is_meeting_organizer(uuid) from public;revoke all on function public.can_access_meeting(uuid) from public;
grant execute on function public.is_meeting_organizer(uuid) to authenticated;grant execute on function public.can_access_meeting(uuid) to authenticated;

drop policy if exists "meetings attendee read" on public.meetings;
create policy "meetings attendee read" on public.meetings for select to authenticated using(public.can_access_meeting(id));
drop policy if exists "organizers add attendees" on public.meeting_attendees;
create policy "organizers add attendees" on public.meeting_attendees for insert to authenticated with check(public.is_meeting_organizer(meeting_id));
drop policy if exists "organizers read attendees" on public.meeting_attendees;
create policy "organizers read attendees" on public.meeting_attendees for select to authenticated using(user_id=public.current_profile_id() or public.is_meeting_organizer(meeting_id));
drop policy if exists "organizers remove attendees" on public.meeting_attendees;
create policy "organizers remove attendees" on public.meeting_attendees for delete to authenticated using(public.is_meeting_organizer(meeting_id));
