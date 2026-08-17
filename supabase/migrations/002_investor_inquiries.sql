-- Investor brief and meeting requests
create table if not exists public.investor_inquiries (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  organization text not null,
  role_title text,
  investor_type text not null,
  request_types text[] not null default '{}',
  check_size text,
  stage_interest text[] not null default '{}',
  sector_interest text[] not null default '{}',
  geography text,
  investment_thesis text,
  specific_ask text not null,
  status text not null default 'NEW' check (status in ('NEW','CONTACTED','QUALIFIED','CLOSED')),
  source text not null default 'INVESTOR_PAGE',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.investor_inquiries enable row level security;

create policy "public can submit investor inquiries"
on public.investor_inquiries for insert
to anon, authenticated
with check (status = 'NEW');

create policy "super admins can read investor inquiries"
on public.investor_inquiries for select
to authenticated
using (
  exists (
    select 1 from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'SUPER_ADMIN'
  )
);

create policy "super admins can update investor inquiries"
on public.investor_inquiries for update
to authenticated
using (
  exists (
    select 1 from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'SUPER_ADMIN'
  )
);

create index if not exists investor_inquiries_created_at_idx
on public.investor_inquiries(created_at desc);
