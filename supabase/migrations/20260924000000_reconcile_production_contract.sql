begin;

create extension if not exists pgcrypto;
create extension if not exists vector;

alter table public.profiles add column if not exists college text;
alter table public.profiles add column if not exists education_year text;
alter table public.profiles add column if not exists linkedin_url text;
alter table public.profiles add column if not exists github_url text;
alter table public.profiles add column if not exists timezone text;
alter table public.profiles add column if not exists location text;
alter table public.profiles add column if not exists role_preferences text[] not null default '{}';
alter table public.profiles add column if not exists working_style jsonb not null default '{}'::jsonb;
alter table public.profiles add column if not exists values_profile jsonb not null default '{}'::jsonb;
alter table public.profiles add column if not exists verification_status text not null default 'UNVERIFIED';
alter table public.profiles add column if not exists response_score numeric(5,2);
alter table public.profiles add column if not exists profile_embedding vector(384);
alter table public.profiles add column if not exists preferred_role text;
alter table public.profiles add column if not exists resume_url text;
alter table public.profiles add column if not exists industry text;
alter table public.profiles add column if not exists email_opt_in boolean not null default true;
alter table public.profiles add column if not exists onboarding_completed boolean not null default false;
alter table public.profiles add column if not exists last_seen_at timestamptz;

alter table public.projects add column if not exists tagline text;
alter table public.projects add column if not exists logo_url text;
alter table public.projects add column if not exists timezone text;
alter table public.projects add column if not exists terms_private boolean not null default false;
alter table public.projects add column if not exists application_policy text not null default 'OPEN';
alter table public.projects add column if not exists description_embedding vector(384);
alter table public.projects add column if not exists attachments text[] not null default '{}';

alter table public.messages add column if not exists channel text not null default 'General';
alter table public.messages add column if not exists parent_id uuid;
alter table public.messages add column if not exists attachments text[] not null default '{}';
alter table public.messages add column if not exists pinned boolean not null default false;
alter table public.messages add column if not exists read_at timestamptz;
alter table public.messages add column if not exists edited_at timestamptz;
alter table public.messages add column if not exists deleted_at timestamptz;
alter table public.messages add column if not exists updated_at timestamptz not null default now();

alter table public.message_edits add column if not exists content text;
alter table public.message_edits add column if not exists editor_id uuid;
alter table public.message_edits add column if not exists previous_content text;

alter table public.team_rooms add column if not exists channels text[] not null default array['General','Development','Design','Marketing']::text[];
alter table public.team_rooms add column if not exists created_at timestamptz not null default now();

alter table public.meetings add column if not exists location text;
alter table public.meetings add column if not exists meeting_url text;

alter table public.milestones add column if not exists target_date date;
alter table public.milestones add column if not exists due_date timestamptz;
alter table public.milestones add column if not exists assigned_to uuid;
alter table public.milestones add column if not exists sort_order integer not null default 0;

alter table public.bookmarks add column if not exists target_type text not null default 'PROJECT';
alter table public.bookmarks add column if not exists profile_id uuid;

alter table public.notifications add column if not exists title text;
alter table public.notifications add column if not exists body text;
alter table public.notifications add column if not exists message text;
alter table public.notifications add column if not exists delivered_email_at timestamptz;

alter table public.endorsements add column if not exists project_id uuid;
alter table public.analytics_events add column if not exists project_id uuid;

alter table public.message_edits alter column content drop not null;
alter table public.notifications alter column title drop not null;
alter table public.notifications alter column body drop not null;

update public.profiles set updated_at = coalesce(updated_at, created_at, now()) where updated_at is null;
update public.messages set updated_at = coalesce(updated_at, created_at, now()) where updated_at is null;
update public.team_rooms set channels = array['General','Development','Design','Marketing']::text[] where channels is null or cardinality(channels) = 0;
update public.team_tasks set sort_order = 0 where sort_order is null;
update public.milestones set due_date = target_date::timestamptz where due_date is null and target_date is not null;
update public.milestones set sort_order = 0 where sort_order is null;
update public.bookmarks set profile_id = target_user_id where profile_id is null and target_user_id is not null;
update public.message_edits set previous_content = content where previous_content is null and content is not null;
update public.notifications set message = coalesce(nullif(btrim(message), ''), nullif(btrim(body), ''), nullif(btrim(title), ''), 'Notification') where message is null or btrim(message) = '';
alter table public.notifications alter column message set not null;

with ranked as (
  select id, row_number() over (partition by lower(username) order by created_at, id) as rn
  from public.profiles
  where username is not null
)
update public.profiles p
set username = lower(left(coalesce(nullif(p.username, ''), 'user'), 22) || '_' || substr(replace(p.id::text, '-', ''), 1, 6))
from ranked
where p.id = ranked.id and ranked.rn > 1;

create unique index if not exists profiles_username_unique_idx
on public.profiles (lower(username)) where username is not null;

create temporary table _ibf_team_room_merge on commit drop as
select id as duplicate_id, canonical_id
from (
  select
    id,
    first_value(id) over (partition by project_id order by created_at, id) as canonical_id,
    row_number() over (partition by project_id order by created_at, id) as rn
  from public.team_rooms
) s
where rn > 1;

delete from public.team_members tm
using _ibf_team_room_merge m
where tm.room_id = m.duplicate_id
  and exists (
    select 1 from public.team_members keep
    where keep.room_id = m.canonical_id and keep.user_id = tm.user_id
  );

update public.team_members tm
set room_id = m.canonical_id
from _ibf_team_room_merge m
where tm.room_id = m.duplicate_id;

update public.team_tasks tt
set room_id = m.canonical_id
from _ibf_team_room_merge m
where tt.room_id = m.duplicate_id;

update public.messages msg
set room_id = m.canonical_id
from _ibf_team_room_merge m
where msg.room_id = m.duplicate_id;

delete from public.team_rooms tr
using _ibf_team_room_merge m
where tr.id = m.duplicate_id;

insert into public.team_members (room_id, user_id, role)
select tr.id, p.founder_id, 'ADMIN'
from public.team_rooms tr
join public.projects p on p.id = tr.project_id
on conflict (room_id, user_id) do update set role = excluded.role;

insert into public.team_members (room_id, user_id, role)
select tr.id, c.requester_id, 'MEMBER'
from public.team_rooms tr
join public.connections c on c.project_id = tr.project_id and c.status = 'ACCEPTED'
where c.requester_id <> tr.project_id
on conflict (room_id, user_id) do nothing;

insert into public.team_members (room_id, user_id, role)
select tr.id, c.recipient_id, 'MEMBER'
from public.team_rooms tr
join public.connections c on c.project_id = tr.project_id and c.status = 'ACCEPTED'
where c.recipient_id <> tr.project_id
on conflict (room_id, user_id) do nothing;

create unique index if not exists team_rooms_project_unique_idx on public.team_rooms(project_id);

delete from public.bookmarks b
using (
  select id from (
    select id, row_number() over (partition by user_id, project_id order by created_at, id) as rn
    from public.bookmarks where project_id is not null
  ) x where rn > 1
) d where b.id = d.id;

delete from public.bookmarks b
using (
  select id from (
    select id, row_number() over (partition by user_id, profile_id order by created_at, id) as rn
    from public.bookmarks where profile_id is not null
  ) x where rn > 1
) d where b.id = d.id;

create unique index if not exists bookmarks_project_unique_idx
on public.bookmarks(user_id, project_id) where project_id is not null;
create unique index if not exists bookmarks_profile_unique_idx
on public.bookmarks(user_id, profile_id) where profile_id is not null;

create temporary table _ibf_connection_merge on commit drop as
select id
from (
  select id, row_number() over (
    partition by
      case when requester_id < recipient_id then requester_id else recipient_id end,
      case when requester_id < recipient_id then recipient_id else requester_id end,
      coalesce(project_id, '00000000-0000-0000-0000-000000000000'::uuid)
    order by created_at, id
  ) as rn
  from public.connections
) s where rn > 1;

delete from public.connections c using _ibf_connection_merge d where c.id = d.id;

create unique index if not exists connections_pair_project_unique_idx
on public.connections (
  case when requester_id < recipient_id then requester_id else recipient_id end,
  case when requester_id < recipient_id then recipient_id else requester_id end,
  coalesce(project_id, '00000000-0000-0000-0000-000000000000'::uuid)
);

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'messages_parent_id_fkey' and conrelid = 'public.messages'::regclass) then
    alter table public.messages add constraint messages_parent_id_fkey foreign key (parent_id) references public.messages(id) on delete set null not valid;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'messages_room_id_team_rooms_fkey' and conrelid = 'public.messages'::regclass) then
    alter table public.messages add constraint messages_room_id_team_rooms_fkey foreign key (room_id) references public.team_rooms(id) on delete set null not valid;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'message_edits_editor_id_fkey' and conrelid = 'public.message_edits'::regclass) then
    alter table public.message_edits add constraint message_edits_editor_id_fkey foreign key (editor_id) references public.profiles(id) on delete set null not valid;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'milestones_assigned_to_fkey' and conrelid = 'public.milestones'::regclass) then
    alter table public.milestones add constraint milestones_assigned_to_fkey foreign key (assigned_to) references public.profiles(id) on delete set null not valid;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'bookmarks_profile_id_fkey' and conrelid = 'public.bookmarks'::regclass) then
    alter table public.bookmarks add constraint bookmarks_profile_id_fkey foreign key (profile_id) references public.profiles(id) on delete cascade not valid;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'endorsements_project_id_fkey' and conrelid = 'public.endorsements'::regclass) then
    alter table public.endorsements add constraint endorsements_project_id_fkey foreign key (project_id) references public.projects(id) on delete set null not valid;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'analytics_events_project_id_fkey' and conrelid = 'public.analytics_events'::regclass) then
    alter table public.analytics_events add constraint analytics_events_project_id_fkey foreign key (project_id) references public.projects(id) on delete set null not valid;
  end if;
end $$;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'bookmarks_target_xor_check' and conrelid = 'public.bookmarks'::regclass) then
    alter table public.bookmarks add constraint bookmarks_target_xor_check check (
      (project_id is not null and profile_id is null)
      or (project_id is null and profile_id is not null)
      or (project_id is null and profile_id is null and target_type in ('SERVICE', 'EVENT'))
    ) not valid;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'messages_team_room_shape_check' and conrelid = 'public.messages'::regclass) then
    alter table public.messages add constraint messages_team_room_shape_check check (room_type <> 'TEAM' or room_id is not null) not valid;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'meetings_time_order_check' and conrelid = 'public.meetings'::regclass) then
    alter table public.meetings add constraint meetings_time_order_check check (ends_at > starts_at) not valid;
  end if;
end $$;

create or replace function public.current_profile_id()
returns uuid language sql stable security definer set search_path = ''
as $$ select auth.uid(); $$;
revoke all on function public.current_profile_id() from public, anon;
grant execute on function public.current_profile_id() to anon, authenticated;

create or replace function public.is_super_admin()
returns boolean language sql stable security definer set search_path = ''
as $$
  select exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'SUPER_ADMIN');
$$;
revoke all on function public.is_super_admin() from public, anon;
grant execute on function public.is_super_admin() to anon, authenticated;

create or replace function public.is_project_founder_for_room(target_room uuid)
returns boolean language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.team_rooms tr
    join public.projects p on p.id = tr.project_id
    where tr.id = target_room and p.founder_id = auth.uid()
  );
$$;
revoke all on function public.is_project_founder_for_room(uuid) from public, anon;
grant execute on function public.is_project_founder_for_room(uuid) to authenticated;

create or replace function public.can_access_team_room(target_room uuid)
returns boolean language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.team_members tm
    where tm.room_id = target_room and tm.user_id = auth.uid()
  ) or public.is_project_founder_for_room(target_room);
$$;
revoke all on function public.can_access_team_room(uuid) from public, anon;
grant execute on function public.can_access_team_room(uuid) to authenticated;

create or replace function public.can_manage_team_room(target_room uuid)
returns boolean language sql stable security definer set search_path = ''
as $$
  select public.is_project_founder_for_room(target_room)
    or public.is_super_admin()
    or exists (
      select 1 from public.team_members tm
      where tm.room_id = target_room and tm.user_id = auth.uid() and tm.role in ('ADMIN', 'LEAD')
    );
$$;
revoke all on function public.can_manage_team_room(uuid) from public, anon;
grant execute on function public.can_manage_team_room(uuid) to authenticated;

create or replace function public.is_project_visible(target_project uuid)
returns boolean language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.projects p
    where p.id = target_project
      and (not p.terms_private or p.founder_id = auth.uid() or public.is_super_admin())
  );
$$;
revoke all on function public.is_project_visible(uuid) from public, anon;
grant execute on function public.is_project_visible(uuid) to anon, authenticated;

create or replace function public.is_project_participant(target_project uuid, target_profile uuid)
returns boolean language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.projects p where p.id = target_project and p.founder_id = target_profile
  ) or exists (
    select 1 from public.connections c
    where c.project_id = target_project
      and c.status = 'ACCEPTED'
      and target_profile in (c.requester_id, c.recipient_id)
  );
$$;
revoke all on function public.is_project_participant(uuid, uuid) from public, anon;
grant execute on function public.is_project_participant(uuid, uuid) to authenticated;

create or replace function public.can_join_team_room(target_room uuid)
returns boolean language sql stable security definer set search_path = ''
as $$
  select public.is_project_founder_for_room(target_room)
    or exists (
      select 1
      from public.team_rooms tr
      where tr.id = target_room
        and public.is_project_participant(tr.project_id, auth.uid())
    );
$$;
revoke all on function public.can_join_team_room(uuid) from public, anon;
grant execute on function public.can_join_team_room(uuid) to authenticated;

create or replace function public.can_message_direct(target_project uuid, target_recipient uuid)
returns boolean language sql stable security definer set search_path = ''
as $$
  select target_recipient is not null
    and public.is_project_participant(target_project, auth.uid())
    and public.is_project_participant(target_project, target_recipient);
$$;
revoke all on function public.can_message_direct(uuid, uuid) from public, anon;
grant execute on function public.can_message_direct(uuid, uuid) to authenticated;

create or replace function public.can_read_message(target_message uuid)
returns boolean language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.messages m
    where m.id = target_message
      and (
        m.room_type = 'GENERAL'
        or auth.uid() in (m.sender_id, m.recipient_id)
        or (m.room_type = 'TEAM' and public.can_access_team_room(m.room_id))
      )
  );
$$;
revoke all on function public.can_read_message(uuid) from public, anon;
grant execute on function public.can_read_message(uuid) to authenticated;

create or replace function public.is_meeting_attendee(target_meeting uuid, target_profile uuid)
returns boolean language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.meeting_attendees
    where meeting_id = target_meeting and user_id = target_profile
  );
$$;
revoke all on function public.is_meeting_attendee(uuid, uuid) from public, anon;
grant execute on function public.is_meeting_attendee(uuid, uuid) to authenticated;

create or replace function public.is_meeting_organizer(target_meeting uuid, target_profile uuid)
returns boolean language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.meetings
    where id = target_meeting and organizer_id = target_profile
  );
$$;
revoke all on function public.is_meeting_organizer(uuid, uuid) from public, anon;
grant execute on function public.is_meeting_organizer(uuid, uuid) to authenticated;

create or replace function public.is_university_member(target_university uuid, target_profile uuid)
returns boolean language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.university_members um
    where um.university_id = target_university and um.user_id = target_profile
  );
$$;
revoke all on function public.is_university_member(uuid, uuid) from public, anon;
grant execute on function public.is_university_member(uuid, uuid) to authenticated;

create or replace function public.is_university_email(target_university uuid)
returns boolean language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1
    from public.universities u
    join public.profiles p on p.id = auth.uid()
    where u.id = target_university
      and u.active
      and p.email ilike '%@' || u.domain
  );
$$;
revoke all on function public.is_university_email(uuid) from public, anon;
grant execute on function public.is_university_email(uuid) to authenticated;

create or replace function public.can_review_project(target_project uuid, target_reviewee uuid)
returns boolean language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.projects p
    where p.id = target_project and p.status = 'COMPLETED'
      and exists (
        select 1 from public.connections c
        where c.project_id = target_project
          and c.status = 'ACCEPTED'
          and ((c.requester_id = auth.uid() and c.recipient_id = target_reviewee)
            or (c.recipient_id = auth.uid() and c.requester_id = target_reviewee))
      )
  );
$$;
revoke all on function public.can_review_project(uuid, uuid) from public, anon;
grant execute on function public.can_review_project(uuid, uuid) to authenticated;

create or replace function public.can_endorse_receiver(target_receiver uuid, target_skill text)
returns boolean language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = target_receiver and lower(target_skill) = any (select lower(x) from unnest(p.skills) x)
  );
$$;
revoke all on function public.can_endorse_receiver(uuid, text) from public, anon;
grant execute on function public.can_endorse_receiver(uuid, text) to authenticated;

create or replace function public.generate_certificate_code()
returns text language sql security definer set search_path = ''
as $$ select encode(public.gen_random_bytes(12), 'hex'); $$;
revoke all on function public.generate_certificate_code() from public, anon, authenticated;

create or replace function public.finalize_onboarding(
  p_role text,
  p_name text,
  p_company text,
  p_linkedin_url text,
  p_github_url text,
  p_availability text,
  p_timezone text,
  p_past_ventures text,
  p_industry text,
  p_startup_name text,
  p_tagline text,
  p_domain text,
  p_stage text,
  p_problem text,
  p_solution text,
  p_roles jsonb,
  p_college text,
  p_education_year text,
  p_skills jsonb,
  p_interests text[],
  p_preferred_role text,
  p_goals text,
  p_portfolio_urls text[],
  p_resume_url text,
  p_username text
)
returns jsonb language plpgsql security definer set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_project uuid;
  v_role jsonb;
  v_completed boolean;
  v_skills jsonb := coalesce(p_skills, '[]'::jsonb);
  v_roles jsonb := coalesce(p_roles, '[]'::jsonb);
  v_skill_names text[];
begin
  if v_user is null then raise exception 'Not authenticated'; end if;
  if p_role not in ('FOUNDER', 'STUDENT') then raise exception 'Invalid role'; end if;
  if nullif(trim(p_name), '') is null then raise exception 'Name is required'; end if;
  if nullif(trim(p_username), '') is null then raise exception 'Username is required'; end if;
  if jsonb_typeof(v_skills) <> 'array' or jsonb_typeof(v_roles) <> 'array' then
    raise exception 'Invalid onboarding arrays';
  end if;
  select onboarding_completed into v_completed
  from public.profiles where id = v_user for update;
  if not found then raise exception 'Profile not found'; end if;
  if v_completed then return jsonb_build_object('ok', true, 'already_completed', true); end if;

  select coalesce(array_agg(x->>'name' order by ord), '{}'::text[])
  into v_skill_names
  from jsonb_array_elements(v_skills) with ordinality as j(x, ord)
  where nullif(btrim(x->>'name'), '') is not null;

  update public.profiles
  set role = p_role::public.user_role,
      name = btrim(p_name),
      company = nullif(btrim(p_company), ''),
      linkedin_url = nullif(btrim(p_linkedin_url), ''),
      github_url = nullif(btrim(p_github_url), ''),
      availability = p_availability,
      timezone = p_timezone,
      past_ventures = nullif(btrim(p_past_ventures), ''),
      industry = nullif(btrim(p_industry), ''),
      college = nullif(btrim(p_college), ''),
      education_year = nullif(btrim(p_education_year), ''),
      proficiency = v_skills,
      skills = v_skill_names,
      interests = coalesce(p_interests, '{}'),
      role_preferences = case when nullif(btrim(p_preferred_role), '') is null then '{}' else array[btrim(p_preferred_role)] end,
      goals = nullif(btrim(p_goals), ''),
      portfolio_urls = coalesce(p_portfolio_urls, '{}'),
      resume_url = nullif(btrim(p_resume_url), ''),
      username = lower(btrim(p_username)),
      onboarding_completed = true,
      updated_at = now()
  where id = v_user;

  if p_role = 'FOUNDER' then
    if nullif(trim(p_startup_name), '') is null or nullif(trim(p_problem), '') is null or nullif(trim(p_solution), '') is null then
      raise exception 'Startup details are required';
    end if;
    insert into public.projects (
      founder_id, title, description, tagline, domain, stage,
      problem_statement, solution_overview, status
    ) values (
      v_user, btrim(p_startup_name), btrim(p_problem), nullif(btrim(p_tagline), ''),
      nullif(btrim(p_domain), ''), p_stage, btrim(p_problem), btrim(p_solution), 'OPEN'
    ) returning id into v_project;

    for v_role in select value from jsonb_array_elements(v_roles) loop
      if nullif(btrim(v_role->>'title'), '') is null or nullif(btrim(v_role->>'description'), '') is null then
        raise exception 'Each founder role requires a title and description';
      end if;
      insert into public.open_roles (
        project_id, title, description, required_skills, engagement_type,
        equity_range, stipend_range, commitment_hours, duration_weeks, status
      ) values (
        v_project, btrim(v_role->>'title'), btrim(v_role->>'description'),
        coalesce(array(select jsonb_array_elements_text(coalesce(v_role->'skills', '[]'::jsonb))), '{}'),
        v_role->>'engagement', nullif(v_role->>'equity_range', ''), nullif(v_role->>'stipend_range', ''),
        case when (v_role->>'hours') ~ '^[0-9]+$' then (v_role->>'hours')::int else 10 end,
        case when (v_role->>'duration') ~ '^[0-9]+$' then (v_role->>'duration')::int else 12 end,
        'OPEN'
      );
    end loop;
  end if;

  return jsonb_build_object('ok', true, 'project_id', v_project);
end;
$$;
revoke all on function public.finalize_onboarding(text,text,text,text,text,text,text,text,text,text,text,text,text,text,text,jsonb,text,text,jsonb,text[],text,text,text[],text,text) from public, anon;
grant execute on function public.finalize_onboarding(text,text,text,text,text,text,text,text,text,text,text,text,text,text,text,jsonb,text,text,jsonb,text[],text,text,text[],text,text) to authenticated;

create or replace function public.touch_current_profile()
returns void language plpgsql security definer set search_path = ''
as $$
begin
  if auth.uid() is null then raise exception 'Not authenticated'; end if;
  update public.profiles
  set last_seen_at = now(), updated_at = now()
  where id = auth.uid()
    and (last_seen_at is null or last_seen_at < now() - interval '60 seconds');
end;
$$;
revoke all on function public.touch_current_profile() from public, anon;
grant execute on function public.touch_current_profile() to authenticated;

create or replace function public.set_onboarding_role(p_role text)
returns jsonb language plpgsql security definer set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_completed boolean;
begin
  if v_user is null then raise exception 'Not authenticated'; end if;
  if p_role not in ('FOUNDER', 'STUDENT') then raise exception 'Invalid role'; end if;
  select onboarding_completed into v_completed from public.profiles where id = v_user for update;
  if not found then raise exception 'Profile not found'; end if;
  if v_completed then raise exception 'Onboarding already completed'; end if;
  update public.profiles set role = p_role::public.user_role, updated_at = now() where id = v_user;
  return jsonb_build_object('ok', true, 'role', p_role);
end;
$$;
revoke all on function public.set_onboarding_role(text) from public, anon;
grant execute on function public.set_onboarding_role(text) to authenticated;

create or replace function public.edit_message(p_message_id uuid, p_content text)
returns jsonb language plpgsql security definer set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_message public.messages%rowtype;
  v_result jsonb;
begin
  if v_user is null then raise exception 'Not authenticated'; end if;
  if p_content is null or btrim(p_content) = '' or char_length(p_content) > 5000 then
    raise exception 'Invalid message content';
  end if;
  select * into v_message from public.messages where id = p_message_id for update;
  if not found then raise exception 'Message not found'; end if;
  if v_message.sender_id <> v_user then raise exception 'Only the message author can edit this message'; end if;
  if v_message.deleted_at is not null then raise exception 'Message already deleted'; end if;
  insert into public.message_edits (message_id, editor_id, previous_content)
  values (v_message.id, v_user, v_message.content);
  update public.messages
  set content = p_content, edited_at = now(), updated_at = now()
  where id = v_message.id;
  select to_jsonb(m) into v_result from public.messages m where m.id = v_message.id;
  return v_result;
end;
$$;
revoke all on function public.edit_message(uuid, text) from public, anon;
grant execute on function public.edit_message(uuid, text) to authenticated;

create or replace function public.join_university(p_university_id uuid)
returns public.university_members language plpgsql security definer set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_result public.university_members%rowtype;
begin
  if v_user is null then raise exception 'Not authenticated'; end if;
  if not public.is_university_email(p_university_id) then raise exception 'Verified university email required'; end if;
  insert into public.university_members (university_id, user_id, member_role, verified)
  values (p_university_id, v_user, 'STUDENT', true)
  on conflict (university_id, user_id) do update set verified = true, member_role = 'STUDENT'
  returning * into v_result;
  return v_result;
end;
$$;
revoke all on function public.join_university(uuid) from public, anon;
grant execute on function public.join_university(uuid) to authenticated;

create or replace function public.delete_own_account()
returns void language plpgsql security definer set search_path = ''
as $$
declare v_user uuid := auth.uid();
begin
  if v_user is null then raise exception 'Not authenticated'; end if;
  delete from auth.users where id = v_user;
end;
$$;
revoke all on function public.delete_own_account() from public, anon;
grant execute on function public.delete_own_account() to authenticated;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = ''
as $$
declare
  v_raw_role text := new.raw_user_meta_data ->> 'role';
  v_role public.user_role := 'STUDENT';
  v_email text := coalesce(new.email, new.id::text || '@users.invalid');
  v_name text;
  v_avatar text;
  v_username text;
begin
  if v_raw_role in ('FOUNDER', 'STUDENT') then v_role := v_raw_role::public.user_role; end if;
  v_name := coalesce(
    nullif(trim(new.raw_user_meta_data ->> 'name'), ''),
    nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''),
    nullif(trim(concat_ws(' ', new.raw_user_meta_data ->> 'given_name', new.raw_user_meta_data ->> 'family_name')), ''),
    split_part(v_email, '@', 1)
  );
  v_avatar := coalesce(new.raw_user_meta_data ->> 'avatar_url', new.raw_user_meta_data ->> 'picture');
  v_username := lower(regexp_replace(split_part(v_email, '@', 1), '[^a-z0-9_]', '_', 'g')) || '_' || substr(replace(new.id::text, '-', ''), 1, 6);
  insert into public.profiles (id, email, name, role, avatar_url, username, onboarding_completed, created_at, updated_at)
  values (new.id, v_email, v_name, v_role, v_avatar, v_username, false, now(), now())
  on conflict (id) do update set
    email = excluded.email,
    name = case when public.profiles.name = '' then excluded.name else public.profiles.name end,
    avatar_url = coalesce(public.profiles.avatar_url, excluded.avatar_url),
    updated_at = now();
  return new;
end;
$$;
revoke all on function public.handle_new_user() from public, anon, authenticated;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

create or replace function public.recompute_profile_reputation(p_profile_id uuid)
returns void language plpgsql security definer set search_path = ''
as $$
begin
  update public.profiles p
  set average_rating = (select round(avg(r.rating)::numeric, 2) from public.reviews r where r.reviewee_id = p_profile_id),
      endorsement_count = (select count(*)::integer from public.endorsements e where e.receiver_id = p_profile_id),
      updated_at = now()
  where p.id = p_profile_id;
end;
$$;
revoke all on function public.recompute_profile_reputation(uuid) from public, anon, authenticated;

create or replace function public.refresh_review_reputation()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  perform public.recompute_profile_reputation(coalesce(new.reviewee_id, old.reviewee_id));
  return coalesce(new, old);
end;
$$;
revoke all on function public.refresh_review_reputation() from public, anon, authenticated;

create or replace function public.refresh_endorsement_reputation()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  perform public.recompute_profile_reputation(coalesce(new.receiver_id, old.receiver_id));
  return coalesce(new, old);
end;
$$;
revoke all on function public.refresh_endorsement_reputation() from public, anon, authenticated;

drop trigger if exists reviews_reputation_trigger on public.reviews;
create trigger reviews_reputation_trigger after insert or update or delete on public.reviews for each row execute function public.refresh_review_reputation();
drop trigger if exists endorsements_reputation_trigger on public.endorsements;
create trigger endorsements_reputation_trigger after insert or update or delete on public.endorsements for each row execute function public.refresh_endorsement_reputation();

create or replace function public.set_updated_at()
returns trigger language plpgsql set search_path = ''
as $$
begin new.updated_at = now(); return new; end;
$$;
revoke all on function public.set_updated_at() from public, anon, authenticated;

do $$
declare r record;
begin
  for r in
    select c.relname
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    join pg_attribute a on a.attrelid = c.oid and a.attname = 'updated_at' and a.attnum > 0 and not a.attisdropped
    where n.nspname = 'public' and c.relkind in ('r', 'p')
  loop
    execute format('drop trigger if exists ibf_set_updated_at on public.%I', r.relname);
    execute format('create trigger ibf_set_updated_at before update on public.%I for each row execute function public.set_updated_at()', r.relname);
  end loop;
end $$;

create or replace function public.protect_message_update()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  if auth.uid() is null then return new; end if;
  if old.sender_id = auth.uid() then
    if new.sender_id <> old.sender_id
      or new.recipient_id is distinct from old.recipient_id
      or new.project_id is distinct from old.project_id
      or new.room_type is distinct from old.room_type
      or new.room_id is distinct from old.room_id
      or new.parent_id is distinct from old.parent_id
      or new.pinned is distinct from old.pinned then
      raise exception 'Message fields cannot be changed by the author';
    end if;
    return new;
  end if;
  if new.room_type = 'TEAM'
    and public.can_manage_team_room(new.room_id)
    and new.pinned is distinct from old.pinned
    and new.content is not distinct from old.content
    and new.attachments is not distinct from old.attachments
    and new.deleted_at is not distinct from old.deleted_at then
    return new;
  end if;
  if new.room_type = 'DIRECT'
    and new.recipient_id = auth.uid()
    and new.read_at is distinct from old.read_at
    and new.content is not distinct from old.content
    and new.attachments is not distinct from old.attachments
    and new.pinned is not distinct from old.pinned
    and new.deleted_at is not distinct from old.deleted_at then
    return new;
  end if;
  raise exception 'Message update is not permitted';
end;
$$;
revoke all on function public.protect_message_update() from public, anon, authenticated;

drop trigger if exists ibf_protect_message_update on public.messages;
create trigger ibf_protect_message_update before update on public.messages for each row execute function public.protect_message_update();

alter table public.profiles enable row level security;
alter table public.projects enable row level security;
alter table public.open_roles enable row level security;
alter table public.applications enable row level security;
alter table public.connections enable row level security;
alter table public.messages enable row level security;
alter table public.message_reactions enable row level security;
alter table public.message_edits enable row level security;
alter table public.team_rooms enable row level security;
alter table public.team_members enable row level security;
alter table public.team_tasks enable row level security;
alter table public.meetings enable row level security;
alter table public.meeting_attendees enable row level security;
alter table public.milestones enable row level security;
alter table public.bookmarks enable row level security;
alter table public.notifications enable row level security;
alter table public.reviews enable row level security;
alter table public.endorsements enable row level security;
alter table public.badge_definitions enable row level security;
alter table public.user_badges enable row level security;
alter table public.certificates enable row level security;
alter table public.cofounder_profiles enable row level security;
alter table public.match_actions enable row level security;
alter table public.investor_inquiries enable row level security;
alter table public.marketplace_services enable row level security;
alter table public.service_inquiries enable row level security;
alter table public.service_purchases enable row level security;
alter table public.community_events enable row level security;
alter table public.event_attendees enable row level security;
alter table public.universities enable row level security;
alter table public.university_members enable row level security;
alter table public.reports enable row level security;
alter table public.user_blocks enable row level security;
alter table public.analytics_events enable row level security;
alter table public.admin_audit_log enable row level security;

do $$
declare r record;
begin
  for r in
    select c.relname, p.polyname
    from pg_policy p
    join pg_class c on c.oid = p.polrelid
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relkind in ('r', 'p')
  loop
    execute format('drop policy if exists %I on public.%I', r.polyname, r.relname);
  loop;
end $$;

alter table public.profiles force row level security;
alter table public.projects force row level security;
alter table public.open_roles force row level security;
alter table public.applications force row level security;
alter table public.connections force row level security;
alter table public.messages force row level security;
alter table public.message_reactions force row level security;
alter table public.message_edits force row level security;
alter table public.team_rooms force row level security;
alter table public.team_members force row level security;
alter table public.team_tasks force row level security;
alter table public.meetings force row level security;
alter table public.meeting_attendees force row level security;
alter table public.milestones force row level security;
alter table public.bookmarks force row level security;
alter table public.notifications force row level security;
alter table public.reviews force row level security;
alter table public.endorsements force row level security;
alter table public.badge_definitions force row level security;
alter table public.user_badges force row level security;
alter table public.certificates force row level security;
alter table public.cofounder_profiles force row level security;
alter table public.match_actions force row level security;
alter table public.investor_inquiries force row level security;
alter table public.marketplace_services force row level security;
alter table public.service_inquiries force row level security;
alter table public.service_purchases force row level security;
alter table public.community_events force row level security;
alter table public.event_attendees force row level security;
alter table public.universities force row level security;
alter table public.university_members force row level security;
alter table public.reports force row level security;
alter table public.user_blocks force row level security;
alter table public.analytics_events force row level security;
alter table public.admin_audit_log force row level security;

create policy "profiles public read" on public.profiles for select to anon, authenticated using (not suspended);
create policy "profiles self update" on public.profiles for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);
create policy "projects public read" on public.projects for select to anon, authenticated using (not terms_private or founder_id = auth.uid() or public.is_super_admin());
create policy "founders create projects" on public.projects for insert to authenticated with check (auth.uid() = founder_id and exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('FOUNDER', 'SUPER_ADMIN')));
create policy "founders update projects" on public.projects for update to authenticated using (auth.uid() = founder_id) with check (auth.uid() = founder_id);
create policy "founders delete projects" on public.projects for delete to authenticated using (auth.uid() = founder_id);
create policy "open roles public read" on public.open_roles for select to anon, authenticated using (public.is_project_visible(project_id));
create policy "founders manage open roles" on public.open_roles for all to authenticated using (exists (select 1 from public.projects p where p.id = project_id and p.founder_id = auth.uid())) with check (exists (select 1 from public.projects p where p.id = project_id and p.founder_id = auth.uid()));
create policy "applications party read" on public.applications for select to authenticated using (auth.uid() = student_id or exists (select 1 from public.projects p where p.id = project_id and p.founder_id = auth.uid()));
create policy "students submit application" on public.applications for insert to authenticated with check (auth.uid() = student_id and exists (select 1 from public.projects p where p.id = project_id and p.status = 'OPEN' and p.founder_id <> auth.uid()));
create policy "founders update application" on public.applications for update to authenticated using (exists (select 1 from public.projects p where p.id = project_id and p.founder_id = auth.uid())) with check (exists (select 1 from public.projects p where p.id = project_id and p.founder_id = auth.uid()) and status in ('ACCEPTED', 'REJECTED'));
create policy "connections party read" on public.connections for select to authenticated using (auth.uid() in (requester_id, recipient_id));
create policy "users request connection" on public.connections for insert to authenticated with check (auth.uid() = requester_id and (project_id is null or exists (select 1 from public.projects p where p.id = project_id and p.founder_id = recipient_id and p.status = 'OPEN')));
create policy "recipient updates connection" on public.connections for update to authenticated using (auth.uid() = recipient_id) with check (auth.uid() = recipient_id and status in ('ACCEPTED', 'REJECTED'));
create policy "messages read access" on public.messages for select to authenticated using (room_type = 'GENERAL' or auth.uid() in (sender_id, recipient_id) or (room_type = 'TEAM' and public.can_access_team_room(room_id)));
create policy "messages send access" on public.messages for insert to authenticated with check (auth.uid() = sender_id and (room_type = 'GENERAL' or (room_type = 'TEAM' and public.can_access_team_room(room_id)) or (room_type = 'DIRECT' and public.can_message_direct(project_id, recipient_id))));
create policy "messages update access" on public.messages for update to authenticated using (sender_id = auth.uid() or (room_type = 'TEAM' and public.can_manage_team_room(room_id)) or (room_type = 'DIRECT' and recipient_id = auth.uid()));
create policy "reactions readable" on public.message_reactions for select to authenticated using (public.can_read_message(message_id));
create policy "own reactions manage" on public.message_reactions for all to authenticated using (user_id = auth.uid() and public.can_read_message(message_id)) with check (user_id = auth.uid() and public.can_read_message(message_id));
create policy "message edits read" on public.message_edits for select to authenticated using (public.can_read_message(message_id));
create policy "message edits insert" on public.message_edits for insert to authenticated with check (editor_id = auth.uid() and exists (select 1 from public.messages m where m.id = message_id and m.sender_id = auth.uid()));
create policy "team rooms read" on public.team_rooms for select to authenticated using (public.can_access_team_room(id));
create policy "project founders manage team rooms" on public.team_rooms for all to authenticated using (exists (select 1 from public.projects p where p.id = project_id and p.founder_id = auth.uid())) with check (exists (select 1 from public.projects p where p.id = project_id and p.founder_id = auth.uid()));
create policy "team members read" on public.team_members for select to authenticated using (public.can_access_team_room(room_id));
create policy "members join team rooms" on public.team_members for insert to authenticated with check (user_id = auth.uid() and public.can_join_team_room(room_id));
create policy "founders manage team members" on public.team_members for update to authenticated using (public.is_project_founder_for_room(room_id)) with check (public.is_project_founder_for_room(room_id));
create policy "founders remove team members" on public.team_members for delete to authenticated using (public.is_project_founder_for_room(room_id));
create policy "team tasks read" on public.team_tasks for select to authenticated using (public.can_access_team_room(room_id));
create policy "team tasks create" on public.team_tasks for insert to authenticated with check (created_by = auth.uid() and public.can_access_team_room(room_id));
create policy "team tasks update" on public.team_tasks for update to authenticated using (public.can_access_team_room(room_id)) with check (public.can_access_team_room(room_id));
create policy "team tasks delete" on public.team_tasks for delete to authenticated using (created_by = auth.uid() or public.can_manage_team_room(room_id));
create policy "meetings read access" on public.meetings for select to authenticated using (organizer_id = auth.uid() or public.is_meeting_attendee(id, auth.uid()));
create policy "authorized users create meetings" on public.meetings for insert to authenticated with check (organizer_id = auth.uid() and public.is_project_participant(project_id, auth.uid()));
create policy "organizers update meetings" on public.meetings for update to authenticated using (organizer_id = auth.uid()) with check (organizer_id = auth.uid());
create policy "organizers delete meetings" on public.meetings for delete to authenticated using (organizer_id = auth.uid());
create policy "attendees read own and organizer read" on public.meeting_attendees for select to authenticated using (user_id = auth.uid() or public.is_meeting_organizer(meeting_id, auth.uid()));
create policy "organizers add attendees" on public.meeting_attendees for insert to authenticated with check (public.is_meeting_organizer(meeting_id, auth.uid()));
create policy "attendees update own rsvp" on public.meeting_attendees for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "organizers remove attendees" on public.meeting_attendees for delete to authenticated using (public.is_meeting_organizer(meeting_id, auth.uid()));
create policy "milestones public read" on public.milestones for select to anon, authenticated using (public.is_project_visible(project_id));
create policy "founders manage milestones" on public.milestones for all to authenticated using (exists (select 1 from public.projects p where p.id = project_id and p.founder_id = auth.uid())) with check (exists (select 1 from public.projects p where p.id = project_id and p.founder_id = auth.uid()));
create policy "own bookmarks manage" on public.bookmarks for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own notifications read" on public.notifications for select to authenticated using (auth.uid() = user_id);
create policy "own notifications update" on public.notifications for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "reviews public read" on public.reviews for select to anon, authenticated using (true);
create policy "authenticated create reviews" on public.reviews for insert to authenticated with check (auth.uid() = reviewer_id and reviewee_id <> auth.uid() and public.can_review_project(project_id, reviewee_id));
create policy "endorsements public read" on public.endorsements for select to anon, authenticated using (true);
create policy "authenticated create endorsements" on public.endorsements for insert to authenticated with check (auth.uid() = giver_id and receiver_id <> auth.uid() and public.can_endorse_receiver(receiver_id, skill));
create policy "badge definitions read" on public.badge_definitions for select to anon, authenticated using (active);
create policy "user badges public read" on public.user_badges for select to anon, authenticated using (true);
create policy "founders award badges" on public.user_badges for insert to authenticated with check (awarded_by = auth.uid() and public.is_project_participant(project_id, receiver_id) and exists (select 1 from public.projects p where p.id = project_id and p.founder_id = auth.uid()));
create policy "certificates public read" on public.certificates for select to anon, authenticated using (true);
create policy "founders issue certificates" on public.certificates for insert to authenticated with check (issued_by = auth.uid() and public.is_project_participant(project_id, receiver_id) and exists (select 1 from public.projects p where p.id = project_id and p.founder_id = auth.uid()));
create policy "cofounder public enabled read" on public.cofounder_profiles for select to anon, authenticated using (enabled or user_id = auth.uid());
create policy "cofounder self manage" on public.cofounder_profiles for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own match actions manage" on public.match_actions for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "public submit inquiries" on public.investor_inquiries for insert to anon, authenticated with check (status = 'NEW');
create policy "super admins read inquiries" on public.investor_inquiries for select to authenticated using (public.is_super_admin());
create policy "super admins update inquiries" on public.investor_inquiries for update to authenticated using (public.is_super_admin()) with check (public.is_super_admin());
create policy "marketplace public read" on public.marketplace_services for select to anon, authenticated using (status = 'ACTIVE');
create policy "provider manages services" on public.marketplace_services for all to authenticated using (provider_id = auth.uid()) with check (provider_id = auth.uid());
create policy "service inquiries read" on public.service_inquiries for select to authenticated using (from_user_id = auth.uid() or exists (select 1 from public.marketplace_services s where s.id = service_id and s.provider_id = auth.uid()));
create policy "sender creates service inquiry" on public.service_inquiries for insert to authenticated with check (from_user_id = auth.uid() and exists (select 1 from public.marketplace_services s where s.id = service_id and s.status = 'ACTIVE' and s.provider_id <> auth.uid()));
create policy "provider updates service inquiry" on public.service_inquiries for update to authenticated using (exists (select 1 from public.marketplace_services s where s.id = service_id and s.provider_id = auth.uid())) with check (exists (select 1 from public.marketplace_services s where s.id = service_id and s.provider_id = auth.uid()));
create policy "parties read service purchases" on public.service_purchases for select to authenticated using (auth.uid() in (buyer_id, provider_id));
create policy "buyer creates service purchase" on public.service_purchases for insert to authenticated with check (auth.uid() = buyer_id and exists (select 1 from public.marketplace_services s where s.id = service_id and s.provider_id = provider_id));
create policy "events public read" on public.community_events for select to anon, authenticated using (status = 'PUBLISHED');
create policy "hosts manage events" on public.community_events for all to authenticated using (host_id = auth.uid()) with check (host_id = auth.uid());
create policy "attendees readable" on public.event_attendees for select to anon, authenticated using (user_id = auth.uid() or exists (select 1 from public.community_events e where e.id = event_id and e.status = 'PUBLISHED'));
create policy "own attendance manage" on public.event_attendees for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "universities public read" on public.universities for select to anon, authenticated using (active);
create policy "university members read" on public.university_members for select to authenticated using (user_id = auth.uid() or public.is_university_member(university_id, auth.uid()));
create policy "own university membership" on public.university_members for insert to authenticated with check (user_id = auth.uid() and verified = public.is_university_email(university_id));
create policy "own university membership update" on public.university_members for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid() and verified = public.is_university_email(university_id));
create policy "submit reports" on public.reports for insert to authenticated with check (reporter_id = auth.uid());
create policy "own reports read" on public.reports for select to authenticated using (reporter_id = auth.uid() or public.is_super_admin());
create policy "own blocks manage" on public.user_blocks for all to authenticated using (blocker_id = auth.uid()) with check (blocker_id = auth.uid());
create policy "own analytics insert" on public.analytics_events for insert to authenticated with check (user_id = auth.uid());
create policy "own analytics read" on public.analytics_events for select to authenticated using (user_id = auth.uid() or public.is_super_admin());

create index if not exists profiles_last_seen_idx on public.profiles(last_seen_at desc);
create index if not exists messages_parent_idx on public.messages(parent_id, created_at desc);
create index if not exists messages_direct_thread_idx on public.messages(project_id, recipient_id, sender_id, created_at desc) where room_type = 'DIRECT';
create index if not exists messages_updated_idx on public.messages(updated_at desc);
create index if not exists message_edits_message_idx on public.message_edits(message_id, edited_at desc);
create index if not exists team_rooms_project_idx on public.team_rooms(project_id);
create index if not exists team_members_user_idx on public.team_members(user_id, room_id);
create index if not exists team_tasks_assignee_idx on public.team_tasks(assignee_id, due_at);
create index if not exists meetings_attendee_idx on public.meeting_attendees(user_id, meeting_id);
create index if not exists meetings_project_starts_idx on public.meetings(project_id, starts_at);
create index if not exists milestones_project_sort_idx on public.milestones(project_id, sort_order, due_date);
create index if not exists milestones_assigned_idx on public.milestones(assigned_to, due_date);
create index if not exists bookmarks_profile_idx on public.bookmarks(profile_id);
create index if not exists notifications_user_created_idx on public.notifications(user_id, created_at desc);
create index if not exists reviews_reviewee_created_idx on public.reviews(reviewee_id, created_at desc);
create index if not exists endorsements_receiver_skill_idx on public.endorsements(receiver_id, skill);
create index if not exists endorsements_project_idx on public.endorsements(project_id);
create index if not exists user_badges_receiver_created_idx on public.user_badges(receiver_id, created_at desc);
create index if not exists certificates_receiver_created_idx on public.certificates(receiver_id, created_at desc);
create index if not exists analytics_project_event_idx on public.analytics_events(project_id, event_type, created_at desc);
create index if not exists service_purchases_provider_idx on public.service_purchases(provider_id, created_at desc);
create index if not exists event_attendees_event_idx on public.event_attendees(event_id, status);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('avatars', 'avatars', true, 2097152, array['image/png', 'image/jpeg', 'image/webp']),
  ('resumes', 'resumes', false, 10485760, array['application/pdf']),
  ('project-files', 'project-files', false, 10485760, array['application/pdf', 'image/png', 'image/jpeg', 'image/webp', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/zip']),
  ('team-files', 'team-files', false, 10485760, array['application/pdf', 'image/png', 'image/jpeg', 'image/webp', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/zip']),
  ('service-portfolios', 'service-portfolios', true, 10485760, array['image/png', 'image/jpeg', 'image/webp'])
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "avatar public read" on storage.objects;
drop policy if exists "avatar owner upload" on storage.objects;
drop policy if exists "avatar owner manage" on storage.objects;
drop policy if exists "avatar owner delete" on storage.objects;
drop policy if exists "resume owner read" on storage.objects;
drop policy if exists "resume owner upload" on storage.objects;
drop policy if exists "resume owner delete" on storage.objects;
drop policy if exists "project file owner read" on storage.objects;
drop policy if exists "project file owner upload" on storage.objects;
drop policy if exists "project file owner delete" on storage.objects;
drop policy if exists "team members read files" on storage.objects;
drop policy if exists "team members upload files" on storage.objects;
drop policy if exists "users delete own team files" on storage.objects;
drop policy if exists "service portfolio public read" on storage.objects;
drop policy if exists "service portfolio owner upload" on storage.objects;
drop policy if exists "service portfolio owner manage" on storage.objects;
drop policy if exists "authenticated read project files" on storage.objects;
drop policy if exists "authenticated read team files" on storage.objects;
drop policy if exists "authenticated upload project files" on storage.objects;
drop policy if exists "authenticated upload team files" on storage.objects;
drop policy if exists "authenticated delete project files" on storage.objects;
drop policy if exists "authenticated delete team files" on storage.objects;

create policy "avatar public read" on storage.objects for select to anon, authenticated using (bucket_id = 'avatars');
create policy "avatar owner upload" on storage.objects for insert to authenticated with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "avatar owner manage" on storage.objects for update to authenticated using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text) with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "avatar owner delete" on storage.objects for delete to authenticated using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "resume owner read" on storage.objects for select to authenticated using (bucket_id = 'resumes' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "resume owner upload" on storage.objects for insert to authenticated with check (bucket_id = 'resumes' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "resume owner delete" on storage.objects for delete to authenticated using (bucket_id = 'resumes' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "project file owner read" on storage.objects for select to authenticated using (bucket_id = 'project-files' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "project file owner upload" on storage.objects for insert to authenticated with check (bucket_id = 'project-files' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "project file owner delete" on storage.objects for delete to authenticated using (bucket_id = 'project-files' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "team members read files" on storage.objects for select to authenticated using (bucket_id = 'team-files' and case when (storage.foldername(name))[1] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then public.can_access_team_room(((storage.foldername(name))[1])::uuid) else false end);
create policy "team members upload files" on storage.objects for insert to authenticated with check (bucket_id = 'team-files' and case when (storage.foldername(name))[1] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then public.can_access_team_room(((storage.foldername(name))[1])::uuid) else false end);
create policy "users delete own team files" on storage.objects for delete to authenticated using (bucket_id = 'team-files' and owner_id = auth.uid()::text);
create policy "service portfolio public read" on storage.objects for select to anon, authenticated using (bucket_id = 'service-portfolios');
create policy "service portfolio owner upload" on storage.objects for insert to authenticated with check (bucket_id = 'service-portfolios' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "service portfolio owner manage" on storage.objects for delete to authenticated using (bucket_id = 'service-portfolios' and (storage.foldername(name))[1] = auth.uid()::text);

do $$
begin
  alter publication supabase_realtime add table public.messages;
exception when duplicate_object then null;
end $$;
do $$
begin
  alter publication supabase_realtime add table public.notifications;
exception when duplicate_object then null;
end $$;
do $$
begin
  alter publication supabase_realtime add table public.connections;
exception when duplicate_object then null;
end $$;
do $$
begin
  alter publication supabase_realtime add table public.milestones;
exception when duplicate_object then null;
end $$;
do $$
begin
  alter publication supabase_realtime add table public.team_tasks;
exception when duplicate_object then null;
end $$;
do $$
begin
  alter publication supabase_realtime add table public.message_reactions;
exception when duplicate_object then null;
end $$;

revoke all on all tables in schema public from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;
revoke all on all routines in schema public from anon, authenticated;
alter default privileges in schema public revoke all on tables from anon, authenticated;
alter default privileges in schema public revoke all on sequences from anon, authenticated;
alter default privileges in schema public revoke all on routines from anon, authenticated;
grant usage on schema public to anon, authenticated, service_role;
grant select on all tables in schema public to authenticated;
grant select on public.profiles, public.projects, public.open_roles, public.marketplace_services, public.community_events, public.badge_definitions, public.user_badges, public.certificates, public.reviews, public.endorsements, public.universities, public.milestones to anon;
grant insert, update, delete on public.projects to authenticated;
grant insert, update, delete on public.open_roles to authenticated;
grant insert, update on public.applications to authenticated;
grant insert, update on public.connections to authenticated;
grant insert, update on public.messages to authenticated;
grant insert, delete on public.message_reactions to authenticated;
grant insert on public.message_edits to authenticated;
grant insert, update, delete on public.team_rooms, public.team_members to authenticated;
grant insert, update, delete on public.team_tasks to authenticated;
grant insert, update, delete on public.meetings, public.meeting_attendees to authenticated;
grant insert, update, delete on public.milestones to authenticated;
grant insert, delete on public.bookmarks to authenticated;
grant update on public.notifications to authenticated;
grant insert on public.reviews, public.endorsements, public.user_badges, public.certificates to authenticated;
grant insert, update on public.cofounder_profiles, public.match_actions to authenticated;
grant insert on public.investor_inquiries to anon, authenticated;
grant insert, update, delete on public.marketplace_services, public.service_inquiries to authenticated;
grant insert, update on public.service_purchases to authenticated;
grant insert, update, delete on public.community_events, public.event_attendees to authenticated;
grant insert, update on public.university_members to authenticated;
grant insert on public.reports, public.user_blocks, public.analytics_events to authenticated;
revoke update on public.profiles from anon, authenticated;
grant update (name, username, avatar_url, bio, skills, interests, portfolio_urls, availability, engagement_preferences, company, goals, is_cofounder, investor_visible, investor_pitch, email_opt_in, updated_at) on public.profiles to authenticated;
grant usage, select on all sequences in schema public to authenticated;
grant all on all tables in schema public to service_role;
grant all on all sequences in schema public to service_role;
grant all on all routines in schema public to service_role;
alter default privileges in schema public grant all on tables to service_role;
alter default privileges in schema public grant all on sequences to service_role;
alter default privileges in schema public grant all on routines to service_role;

create or replace function public.schema_contract()
returns jsonb language sql security definer set search_path = ''
as $$
  select jsonb_build_object(
    'version', '2026-09-24',
    'tables', (
      select jsonb_agg(x.table_name order by x.table_name)
      from (values
        ('profiles'), ('projects'), ('open_roles'), ('applications'), ('connections'),
        ('messages'), ('message_reactions'), ('message_edits'), ('team_rooms'), ('team_members'),
        ('team_tasks'), ('meetings'), ('meeting_attendees'), ('milestones'), ('bookmarks'),
        ('notifications'), ('reviews'), ('endorsements'), ('badge_definitions'), ('user_badges'),
        ('certificates'), ('cofounder_profiles'), ('match_actions'), ('investor_inquiries'),
        ('marketplace_services'), ('service_inquiries'), ('service_purchases'), ('community_events'),
        ('event_attendees'), ('universities'), ('university_members'), ('reports'), ('user_blocks'),
        ('analytics_events'), ('admin_audit_log')
      ) as x(table_name)
      where to_regclass('public.' || x.table_name) is not null
    ),
    'columns', (
      select jsonb_object_agg(x.table_name || '.' || x.column_name, true)
      from (values
        ('profiles', 'last_seen_at'), ('projects', 'attachments'),
        ('messages', 'channel'), ('messages', 'parent_id'), ('messages', 'attachments'),
        ('messages', 'pinned'), ('messages', 'read_at'), ('messages', 'edited_at'),
        ('messages', 'deleted_at'), ('messages', 'updated_at'),
        ('message_edits', 'editor_id'), ('message_edits', 'previous_content'),
        ('team_rooms', 'channels'), ('meetings', 'location'),
        ('milestones', 'due_date'), ('milestones', 'assigned_to'), ('milestones', 'sort_order'),
        ('bookmarks', 'profile_id'), ('notifications', 'message'),
        ('notifications', 'delivered_email_at'), ('endorsements', 'project_id')
      ) as x(table_name, column_name)
      where exists (
        select 1 from information_schema.columns c
        where c.table_schema = 'public' and c.table_name = x.table_name and c.column_name = x.column_name
      )
    ),
    'functions', (
      select jsonb_agg(x.function_name order by x.function_name)
      from (values
        ('current_profile_id'), ('touch_current_profile'), ('finalize_onboarding'),
        ('set_onboarding_role'), ('edit_message'), ('can_access_team_room'),
        ('delete_own_account'), ('schema_contract')
      ) as x(function_name)
      where exists (
        select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
        where n.nspname = 'public' and p.proname = x.function_name
      )
    )
  );
$$;
revoke all on function public.schema_contract() from public, anon, authenticated;
grant execute on function public.schema_contract() to service_role;

notify pgrst, 'reload schema';
commit;
