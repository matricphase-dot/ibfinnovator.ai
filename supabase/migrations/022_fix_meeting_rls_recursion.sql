-- Fix infinite recursion in meeting_attendees RLS
-- Policies on meeting_attendees referenced meeting_attendees, causing recursion.

drop policy if exists "attendees read own" on public.meeting_attendees;
drop policy if exists "organizers read attendees" on public.meeting_attendees;
drop policy if exists "organizers add attendees" on public.meeting_attendees;
drop policy if exists "organizers remove attendees" on public.meeting_attendees;
drop policy if exists "attendees update own rsvp" on public.meeting_attendees;

create or replace function public.is_meeting_attendee(
  target_meeting uuid,
  target_profile uuid
)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from public.meeting_attendees
    where meeting_id = target_meeting
      and user_id = target_profile
  );
$$;

revoke all on function public.is_meeting_attendee(uuid, uuid) from public;
grant execute on function public.is_meeting_attendee(uuid, uuid) to authenticated;

create policy "attendees read own"
on public.meeting_attendees for select to authenticated
using (
  user_id = public.current_profile_id()
  or exists (
    select 1 from public.meetings m
    where m.id = meeting_id
      and m.organizer_id = public.current_profile_id()
  )
);

create policy "organizers add attendees"
on public.meeting_attendees for insert to authenticated
with check (
  exists (
    select 1 from public.meetings m
    where m.id = meeting_id
      and m.organizer_id = public.current_profile_id()
  )
);

create policy "attendees update own rsvp"
on public.meeting_attendees for update to authenticated
using (user_id = public.current_profile_id());

create policy "organizers remove attendees"
on public.meeting_attendees for delete to authenticated
using (
  exists (
    select 1 from public.meetings m
    where m.id = meeting_id
      and m.organizer_id = public.current_profile_id()
  )
);
