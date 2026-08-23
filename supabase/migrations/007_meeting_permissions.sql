-- Meeting organizer, attendee and RSVP permissions
drop policy if exists "organizers manage meetings" on public.meetings;
create policy "organizers manage meetings" on public.meetings for update to authenticated using(organizer_id=auth.uid());
drop policy if exists "organizers delete meetings" on public.meetings;
create policy "organizers delete meetings" on public.meetings for delete to authenticated using(organizer_id=auth.uid());
drop policy if exists "organizers add attendees" on public.meeting_attendees;
create policy "organizers add attendees" on public.meeting_attendees for insert to authenticated
with check(exists(select 1 from public.meetings m where m.id=meeting_id and m.organizer_id=auth.uid()));
drop policy if exists "organizers read attendees" on public.meeting_attendees;
create policy "organizers read attendees" on public.meeting_attendees for select to authenticated
using(user_id=auth.uid() or exists(select 1 from public.meetings m where m.id=meeting_id and m.organizer_id=auth.uid()));
drop policy if exists "organizers remove attendees" on public.meeting_attendees;
create policy "organizers remove attendees" on public.meeting_attendees for delete to authenticated
using(exists(select 1 from public.meetings m where m.id=meeting_id and m.organizer_id=auth.uid()));
