-- Additive PRD modules. Preserves all existing users, projects, messages and policies.
create extension if not exists vector;

alter table public.profiles add column if not exists college text;
alter table public.profiles add column if not exists education_year text;
alter table public.profiles add column if not exists linkedin_url text;
alter table public.profiles add column if not exists github_url text;
alter table public.profiles add column if not exists timezone text;
alter table public.profiles add column if not exists location text;
alter table public.profiles add column if not exists role_preferences text[] not null default '{}';
alter table public.profiles add column if not exists working_style jsonb not null default '{}';
alter table public.profiles add column if not exists values_profile jsonb not null default '{}';
alter table public.profiles add column if not exists verification_status text not null default 'UNVERIFIED';
alter table public.profiles add column if not exists response_score numeric(5,2);
alter table public.profiles add column if not exists profile_embedding vector(384);
alter table public.projects add column if not exists tagline text;
alter table public.projects add column if not exists logo_url text;
alter table public.projects add column if not exists timezone text;
alter table public.projects add column if not exists terms_private boolean not null default false;
alter table public.projects add column if not exists application_policy text not null default 'OPEN';
alter table public.projects add column if not exists description_embedding vector(384);

create table if not exists public.open_roles (
 id uuid primary key default gen_random_uuid(), project_id uuid not null references public.projects(id) on delete cascade,
 title text not null, description text not null, required_skills text[] not null default '{}', engagement_type text,
 equity_range text, stipend_range text, commitment_hours int, duration_weeks int, status text not null default 'OPEN',
 created_at timestamptz default now(), updated_at timestamptz default now()
);
create table if not exists public.cofounder_profiles (
 user_id uuid primary key references public.profiles(id) on delete cascade, vision text, commitment_level text,
 equity_expectation text, decision_style text, working_style jsonb not null default '{}', values text[] not null default '{}',
 looking_for text[] not null default '{}', enabled boolean not null default false, updated_at timestamptz default now()
);
create table if not exists public.match_actions (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles(id) on delete cascade,
 target_project_id uuid references public.projects(id) on delete cascade, target_user_id uuid references public.profiles(id) on delete cascade,
 action text not null check(action in ('SAVE','PASS','CONNECT','INVITE','VIEW')), score numeric(5,2), created_at timestamptz default now(),
 check((target_project_id is not null) <> (target_user_id is not null))
);
create table if not exists public.team_tasks (
 id uuid primary key default gen_random_uuid(), room_id uuid not null references public.team_rooms(id) on delete cascade,
 channel text not null default 'General', title text not null, description text, status text not null default 'TODO',
 assignee_id uuid references public.profiles(id) on delete set null, due_at timestamptz, sort_order int default 0,
 created_by uuid not null references public.profiles(id), created_at timestamptz default now(), updated_at timestamptz default now()
);
create table if not exists public.message_reactions (
 message_id uuid references public.messages(id) on delete cascade, user_id uuid references public.profiles(id) on delete cascade,
 emoji text not null, created_at timestamptz default now(), primary key(message_id,user_id,emoji)
);
create table if not exists public.badge_definitions (
 id uuid primary key default gen_random_uuid(), slug text unique not null, name text not null, description text not null,
 icon text, color text, active boolean default true, created_at timestamptz default now()
);
create table if not exists public.user_badges (
 id uuid primary key default gen_random_uuid(), badge_id uuid not null references public.badge_definitions(id),
 receiver_id uuid not null references public.profiles(id) on delete cascade, awarded_by uuid not null references public.profiles(id),
 project_id uuid not null references public.projects(id) on delete cascade, evidence text, created_at timestamptz default now(),
 unique(badge_id,receiver_id,project_id)
);
create table if not exists public.certificates (
 id uuid primary key default gen_random_uuid(), receiver_id uuid not null references public.profiles(id) on delete cascade,
 project_id uuid not null references public.projects(id) on delete cascade, issued_by uuid not null references public.profiles(id),
 role_title text not null, started_at date, completed_at date, verification_code text unique not null default encode(gen_random_bytes(12),'hex'),
 created_at timestamptz default now(), unique(receiver_id,project_id)
);
create table if not exists public.user_blocks (
 blocker_id uuid references public.profiles(id) on delete cascade, blocked_id uuid references public.profiles(id) on delete cascade,
 created_at timestamptz default now(), primary key(blocker_id,blocked_id), check(blocker_id<>blocked_id)
);
create table if not exists public.reports (
 id uuid primary key default gen_random_uuid(), reporter_id uuid not null references public.profiles(id),
 reported_user_id uuid references public.profiles(id), project_id uuid references public.projects(id), message_id uuid references public.messages(id),
 reason text not null, details text, status text not null default 'OPEN', created_at timestamptz default now(), updated_at timestamptz default now()
);
create table if not exists public.marketplace_services (
 id uuid primary key default gen_random_uuid(), provider_id uuid not null references public.profiles(id) on delete cascade,
 title text not null, description text not null, skills text[] not null default '{}', pricing_note text, availability text,
 status text not null default 'ACTIVE', created_at timestamptz default now(), updated_at timestamptz default now()
);
create table if not exists public.community_events (
 id uuid primary key default gen_random_uuid(), host_id uuid not null references public.profiles(id), title text not null,
 description text, event_type text not null default 'EVENT', starts_at timestamptz not null, ends_at timestamptz,
 location text, capacity int, status text not null default 'PUBLISHED', created_at timestamptz default now()
);
create table if not exists public.event_attendees (
 event_id uuid references public.community_events(id) on delete cascade, user_id uuid references public.profiles(id) on delete cascade,
 status text default 'GOING', created_at timestamptz default now(), primary key(event_id,user_id)
);
create table if not exists public.universities (
 id uuid primary key default gen_random_uuid(), name text unique not null, domain text unique not null, logo_url text,
 active boolean default true, created_at timestamptz default now()
);
create table if not exists public.university_members (
 university_id uuid references public.universities(id) on delete cascade, user_id uuid references public.profiles(id) on delete cascade,
 member_role text not null default 'STUDENT', verified boolean default false, created_at timestamptz default now(), primary key(university_id,user_id)
);

insert into public.badge_definitions(slug,name,description,icon,color) values
 ('mvp-builder','MVP Builder','Shipped a meaningful MVP milestone','rocket','#00f5d4'),
 ('design-lead','Design Lead','Led product or visual design delivery','palette','#a78bfa'),
 ('growth-contributor','Growth Contributor','Delivered measurable growth work','trending-up','#ffbe0b'),
 ('code-reviewer','Code Reviewer','Improved engineering quality through review','code','#60a5fa')
on conflict(slug) do nothing;

alter table public.open_roles enable row level security; alter table public.cofounder_profiles enable row level security;
alter table public.match_actions enable row level security; alter table public.team_tasks enable row level security;
alter table public.message_reactions enable row level security; alter table public.badge_definitions enable row level security;
alter table public.user_badges enable row level security; alter table public.certificates enable row level security;
alter table public.user_blocks enable row level security; alter table public.reports enable row level security;
alter table public.marketplace_services enable row level security; alter table public.community_events enable row level security;
alter table public.event_attendees enable row level security; alter table public.universities enable row level security;
alter table public.university_members enable row level security;

create policy "roles public read" on public.open_roles for select using(true);
create policy "founders manage roles" on public.open_roles for all using(exists(select 1 from projects p where p.id=project_id and p.founder_id=auth.uid()));
create policy "cofounder public enabled read" on public.cofounder_profiles for select using(enabled or user_id=auth.uid());
create policy "cofounder self manage" on public.cofounder_profiles for all using(user_id=auth.uid()) with check(user_id=auth.uid());
create policy "own match actions" on public.match_actions for all using(user_id=auth.uid()) with check(user_id=auth.uid());
create policy "team members read tasks" on public.team_tasks for select using(exists(select 1 from team_members tm where tm.room_id=team_tasks.room_id and tm.user_id=auth.uid()));
create policy "team members create tasks" on public.team_tasks for insert with check(created_by=auth.uid() and exists(select 1 from team_members tm where tm.room_id=team_tasks.room_id and tm.user_id=auth.uid()));
create policy "reactions public read" on public.message_reactions for select using(true); create policy "own reactions" on public.message_reactions for all using(user_id=auth.uid()) with check(user_id=auth.uid());
create policy "badge definitions read" on public.badge_definitions for select using(active);
create policy "badges public read" on public.user_badges for select using(true); create policy "founders award badges" on public.user_badges for insert with check(awarded_by=auth.uid() and exists(select 1 from projects p where p.id=project_id and p.founder_id=auth.uid()));
create policy "certificates public read" on public.certificates for select using(true); create policy "founders issue certificates" on public.certificates for insert with check(issued_by=auth.uid() and exists(select 1 from projects p where p.id=project_id and p.founder_id=auth.uid()));
create policy "own blocks" on public.user_blocks for all using(blocker_id=auth.uid()) with check(blocker_id=auth.uid());
create policy "submit reports" on public.reports for insert with check(reporter_id=auth.uid()); create policy "own reports read" on public.reports for select using(reporter_id=auth.uid());
create policy "marketplace public read" on public.marketplace_services for select using(status='ACTIVE'); create policy "provider manages services" on public.marketplace_services for all using(provider_id=auth.uid()) with check(provider_id=auth.uid());
create policy "events public read" on public.community_events for select using(status='PUBLISHED'); create policy "host manages events" on public.community_events for all using(host_id=auth.uid()) with check(host_id=auth.uid());
create policy "attendees public read" on public.event_attendees for select using(true); create policy "own attendance" on public.event_attendees for all using(user_id=auth.uid()) with check(user_id=auth.uid());
create policy "universities public read" on public.universities for select using(active); create policy "members own read" on public.university_members for select using(user_id=auth.uid());

create index if not exists open_roles_project_idx on public.open_roles(project_id,status);
create index if not exists match_actions_user_idx on public.match_actions(user_id,created_at desc);
create index if not exists tasks_room_idx on public.team_tasks(room_id,status,sort_order);
create index if not exists reports_status_idx on public.reports(status,created_at desc);
