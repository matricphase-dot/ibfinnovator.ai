-- Migration 023: Complete meeting RLS fixes
-- Adds the missing is_meeting_organizer function and ensures no policy recursion.

create or replace function public.is_meeting_organizer(
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
    select 1 from public.meetings
    where id = target_meeting
      and organizer_id = target_profile
  );
$$;

revoke all on function public.is_meeting_organizer(uuid, uuid) from public;
grant execute on function public.is_meeting_organizer(uuid, uuid) to authenticated;

-- Meetings: organizer-only SELECT (attendees see meeting via their own attendee row)
drop policy if exists "meeting attendees can view meeting" on public.meetings;
drop policy if exists "attendees view meetings" on public.meetings;
drop policy if exists "organizers view own meetings" on public.meetings;

create policy "organizers view own meetings"
on public.meetings for select to authenticated
using (organizer_id = public.current_profile_id());

-- Meeting attendees: use security-definer helpers only (no policy recursion)
drop policy if exists "attendees read own" on public.meeting_attendees;
drop policy if exists "organizers read attendees" on public.meeting_attendees;
drop policy if exists "organizers add attendees" on public.meeting_attendees;
drop policy if exists "organizers remove attendees" on public.meeting_attendees;
drop policy if exists "attendees update own rsvp" on public.meeting_attendees;

create policy "attendees read own"
on public.meeting_attendees for select to authenticated
using (
  user_id = public.current_profile_id()
  or public.is_meeting_organizer(meeting_id, public.current_profile_id())
);

create policy "organizers add attendees"
on public.meeting_attendees for insert to authenticated
with check (
  public.is_meeting_organizer(meeting_id, public.current_profile_id())
);

create policy "attendees update own rsvp"
on public.meeting_attendees for update to authenticated
using (user_id = public.current_profile_id());

create policy "organizers remove attendees"
on public.meeting_attendees for delete to authenticated
using (
  public.is_meeting_organizer(meeting_id, public.current_profile_id())
);

-- Verify no policy on meeting_attendees references meeting_attendees in USING/WITH CHECK
-- (all references go through security-definer helpers)
