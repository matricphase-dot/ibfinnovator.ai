-- IBF real-data schema. Run in Supabase SQL Editor once.
create extension if not exists pgcrypto;
create type public.user_role as enum ('FOUNDER','STUDENT','SUPER_ADMIN');
create type public.project_status as enum ('OPEN','CLOSED','COMPLETED');
create type public.connection_status as enum ('PENDING','ACCEPTED','REJECTED');
create type public.milestone_status as enum ('PENDING','IN_PROGRESS','COMPLETED');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null, name text not null default '', role user_role not null default 'STUDENT',
  avatar_url text, bio text, skills text[] not null default '{}', interests text[] not null default '{}',
  portfolio_urls text[] not null default '{}', availability text, engagement_preferences text[] not null default '{}',
  company text, goals text, past_ventures text, is_cofounder boolean not null default false,
  average_rating numeric(3,2), endorsement_count int not null default 0, suspended boolean not null default false,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.projects (
  id uuid primary key default gen_random_uuid(), founder_id uuid not null references public.profiles(id) on delete cascade,
  title text not null, description text not null, required_skills text[] not null default '{}', domain text, stage text,
  problem_statement text, solution_overview text, current_team text, equity text, stipend text,
  engagement_type text, commitment_hours int, duration_weeks int, status project_status not null default 'OPEN',
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.applications (
  id uuid primary key default gen_random_uuid(), student_id uuid not null references public.profiles(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade, cover_letter text, resume_url text,
  status connection_status not null default 'PENDING', created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique(student_id, project_id)
);
create table public.connections (
 id uuid primary key default gen_random_uuid(), requester_id uuid not null references public.profiles(id) on delete cascade,
 recipient_id uuid not null references public.profiles(id) on delete cascade, project_id uuid references public.projects(id) on delete cascade,
 type text not null default 'PROJECT', status connection_status not null default 'PENDING',
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 check(requester_id <> recipient_id), unique(requester_id, recipient_id, project_id)
);
create table public.messages (
 id uuid primary key default gen_random_uuid(), sender_id uuid not null references public.profiles(id) on delete cascade,
 recipient_id uuid references public.profiles(id) on delete cascade, project_id uuid references public.projects(id) on delete cascade,
 room_type text not null default 'GENERAL', room_id uuid, content text not null check(char_length(content) between 1 and 5000),
 parent_id uuid references public.messages(id) on delete set null, attachments text[] not null default '{}', pinned boolean not null default false,
 read_at timestamptz, created_at timestamptz not null default now()
);
create table public.milestones (
 id uuid primary key default gen_random_uuid(), project_id uuid not null references public.projects(id) on delete cascade,
 title text not null, description text, due_date timestamptz, status milestone_status not null default 'PENDING',
 assigned_to uuid references public.profiles(id) on delete set null, sort_order int not null default 0,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.bookmarks (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles(id) on delete cascade,
 project_id uuid references public.projects(id) on delete cascade, profile_id uuid references public.profiles(id) on delete cascade,
 created_at timestamptz not null default now(), check((project_id is not null) <> (profile_id is not null))
);
create unique index bookmarks_project_unique on public.bookmarks(user_id,project_id) where project_id is not null;
create unique index bookmarks_profile_unique on public.bookmarks(user_id,profile_id) where profile_id is not null;
create table public.notifications (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles(id) on delete cascade,
 type text not null, message text not null, link text, is_read boolean not null default false, created_at timestamptz not null default now()
);
create table public.reviews (
 id uuid primary key default gen_random_uuid(), reviewer_id uuid not null references public.profiles(id) on delete cascade,
 reviewee_id uuid not null references public.profiles(id) on delete cascade, project_id uuid not null references public.projects(id) on delete cascade,
 rating int not null check(rating between 1 and 5), comment text, created_at timestamptz not null default now(),
 unique(reviewer_id,reviewee_id,project_id), check(reviewer_id <> reviewee_id)
);
create table public.endorsements (
 id uuid primary key default gen_random_uuid(), giver_id uuid not null references public.profiles(id) on delete cascade,
 receiver_id uuid not null references public.profiles(id) on delete cascade, skill text not null, project_id uuid references public.projects(id),
 created_at timestamptz not null default now(), unique(giver_id,receiver_id,skill), check(giver_id <> receiver_id)
);
create table public.team_rooms (
 id uuid primary key default gen_random_uuid(), project_id uuid not null references public.projects(id) on delete cascade,
 name text not null default 'General', channels text[] not null default array['General','Dev','Design','Marketing'], created_at timestamptz default now()
);
create table public.team_members (
 room_id uuid references public.team_rooms(id) on delete cascade, user_id uuid references public.profiles(id) on delete cascade,
 role text not null default 'MEMBER', joined_at timestamptz default now(), primary key(room_id,user_id)
);
create table public.meetings (
 id uuid primary key default gen_random_uuid(), project_id uuid not null references public.projects(id) on delete cascade,
 organizer_id uuid not null references public.profiles(id) on delete cascade, title text not null, description text,
 starts_at timestamptz not null, ends_at timestamptz not null, location text, status text not null default 'SCHEDULED', created_at timestamptz default now()
);
create table public.meeting_attendees (
 meeting_id uuid references public.meetings(id) on delete cascade, user_id uuid references public.profiles(id) on delete cascade,
 status text not null default 'PENDING', primary key(meeting_id,user_id)
);
create table public.analytics_events (
 id bigint generated always as identity primary key, user_id uuid references public.profiles(id) on delete set null,
 event_type text not null, metadata jsonb not null default '{}', created_at timestamptz default now()
);

create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path=public as $$
declare selected_role user_role := coalesce((new.raw_user_meta_data->>'role')::user_role,'STUDENT');
begin
  insert into public.profiles(id,email,name,role,skills,interests,availability,company,goals)
  values(
    new.id,new.email,coalesce(new.raw_user_meta_data->>'name',''),selected_role,
    case when selected_role='STUDENT' then string_to_array(coalesce(new.raw_user_meta_data->>'skills',''),',') else '{}' end,
    case when selected_role='STUDENT' then string_to_array(coalesce(new.raw_user_meta_data->>'interests',''),',') else array[coalesce(new.raw_user_meta_data->>'startup_domain','')] end,
    new.raw_user_meta_data->>'availability',new.raw_user_meta_data->>'company',
    coalesce(new.raw_user_meta_data->>'goals',new.raw_user_meta_data->>'startup_description')
  );
  if selected_role='FOUNDER' and coalesce(new.raw_user_meta_data->>'startup_title','')<>'' then
    insert into public.projects(founder_id,title,description,required_skills,domain,stage,commitment_hours)
    values(new.id,new.raw_user_meta_data->>'startup_title',coalesce(new.raw_user_meta_data->>'startup_description','Startup project'),string_to_array(coalesce(new.raw_user_meta_data->>'needed_skills',''),','),new.raw_user_meta_data->>'startup_domain',new.raw_user_meta_data->>'startup_stage',coalesce((new.raw_user_meta_data->>'commitment_hours')::int,10));
  end if;
  return new;
end; $$;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();

alter table public.profiles enable row level security; alter table public.projects enable row level security;
alter table public.applications enable row level security; alter table public.connections enable row level security;
alter table public.messages enable row level security; alter table public.milestones enable row level security;
alter table public.bookmarks enable row level security; alter table public.notifications enable row level security;
alter table public.reviews enable row level security; alter table public.endorsements enable row level security;
alter table public.team_rooms enable row level security; alter table public.team_members enable row level security;
alter table public.meetings enable row level security; alter table public.meeting_attendees enable row level security;
alter table public.analytics_events enable row level security;

create policy "profiles public read" on public.profiles for select using(not suspended);
create policy "profiles self update" on public.profiles for update using(auth.uid()=id) with check(auth.uid()=id);
create policy "projects public read" on public.projects for select using(true);
create policy "founders create projects" on public.projects for insert with check(auth.uid()=founder_id and exists(select 1 from profiles where id=auth.uid() and role in ('FOUNDER','SUPER_ADMIN')));
create policy "founders manage own projects" on public.projects for update using(auth.uid()=founder_id); create policy "founders delete own projects" on public.projects for delete using(auth.uid()=founder_id);
create policy "application parties read" on public.applications for select using(auth.uid()=student_id or exists(select 1 from projects p where p.id=project_id and p.founder_id=auth.uid()));
create policy "students apply" on public.applications for insert with check(auth.uid()=student_id); create policy "application parties update" on public.applications for update using(auth.uid()=student_id or exists(select 1 from projects p where p.id=project_id and p.founder_id=auth.uid()));
create policy "connection parties read" on public.connections for select using(auth.uid() in (requester_id,recipient_id)); create policy "request connection" on public.connections for insert with check(auth.uid()=requester_id); create policy "recipient responds" on public.connections for update using(auth.uid()=recipient_id);
create policy "general and party messages read" on public.messages for select using(room_type='GENERAL' or auth.uid() in(sender_id,recipient_id) or exists(select 1 from team_members where room_id=messages.room_id and user_id=auth.uid()));
create policy "authenticated messages create" on public.messages for insert with check(auth.uid()=sender_id);
create policy "milestones project read" on public.milestones for select using(true); create policy "founder milestones manage" on public.milestones for all using(exists(select 1 from projects p where p.id=project_id and p.founder_id=auth.uid()));
create policy "own bookmarks" on public.bookmarks for all using(auth.uid()=user_id) with check(auth.uid()=user_id);
create policy "own notifications" on public.notifications for select using(auth.uid()=user_id); create policy "own notification updates" on public.notifications for update using(auth.uid()=user_id);
create policy "reviews public read" on public.reviews for select using(true); create policy "authenticated reviews" on public.reviews for insert with check(auth.uid()=reviewer_id);
create policy "endorsements public read" on public.endorsements for select using(true); create policy "authenticated endorsements" on public.endorsements for insert with check(auth.uid()=giver_id);
create policy "rooms member read" on public.team_rooms for select using(exists(select 1 from team_members where room_id=team_rooms.id and user_id=auth.uid()));
create policy "members read" on public.team_members for select using(exists(select 1 from team_members tm where tm.room_id=team_members.room_id and tm.user_id=auth.uid()));
create policy "meetings attendee read" on public.meetings for select using(auth.uid()=organizer_id or exists(select 1 from meeting_attendees where meeting_id=meetings.id and user_id=auth.uid()));
create policy "organizer meetings create" on public.meetings for insert with check(auth.uid()=organizer_id);
create policy "attendees self read" on public.meeting_attendees for select using(auth.uid()=user_id); create policy "attendees self update" on public.meeting_attendees for update using(auth.uid()=user_id);
create policy "own analytics" on public.analytics_events for insert with check(auth.uid()=user_id or user_id is null); create policy "own analytics read" on public.analytics_events for select using(auth.uid()=user_id);

create index projects_status_domain on public.projects(status,domain); create index applications_project on public.applications(project_id,status);
create index messages_room_created on public.messages(room_type,room_id,created_at); create index notifications_user_unread on public.notifications(user_id,is_read,created_at desc);
alter publication supabase_realtime add table public.messages, public.notifications, public.connections, public.milestones;
