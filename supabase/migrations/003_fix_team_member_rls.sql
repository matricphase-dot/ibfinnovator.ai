-- Fix recursive team_members RLS policy that can affect message queries.
drop policy if exists "members read" on public.team_members;

create policy "members can read own memberships"
on public.team_members for select
to authenticated
using (user_id = auth.uid());

-- Project founders can inspect room membership without a recursive table lookup.
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
    where tr.id = target_room and p.founder_id = auth.uid()
  );
$$;

create policy "founders can read room memberships"
on public.team_members for select
to authenticated
using (public.is_project_founder_for_room(room_id));
