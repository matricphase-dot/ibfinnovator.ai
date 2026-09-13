-- Phase 3 marketplace, university, investor and events extensions.
alter table public.universities add column if not exists api_key text;
create unique index if not exists universities_api_key_key on public.universities(api_key) where api_key is not null;
alter table public.profiles add column if not exists investor_visible boolean not null default false;
alter table public.profiles add column if not exists investor_pitch text;

create table if not exists public.service_inquiries(
 id uuid primary key default gen_random_uuid(),service_id uuid not null references public.marketplace_services(id) on delete cascade,
 from_user_id uuid not null references public.profiles(id) on delete cascade,message text not null check(char_length(message)<=2000),
 status text not null default 'NEW' check(status in('NEW','READ','REPLIED','CLOSED')),created_at timestamptz not null default now(),updated_at timestamptz not null default now()
);
create table if not exists public.service_purchases(
 id uuid primary key default gen_random_uuid(),service_id uuid not null references public.marketplace_services(id),buyer_id uuid not null references public.profiles(id),provider_id uuid not null references public.profiles(id),status text not null default 'PLACEHOLDER',amount_note text,created_at timestamptz default now()
);
alter table public.service_inquiries enable row level security;alter table public.service_purchases enable row level security;
drop policy if exists "inquiry parties read" on public.service_inquiries;
create policy "inquiry parties read" on public.service_inquiries for select to authenticated using(from_user_id=public.current_profile_id() or exists(select 1 from public.marketplace_services s where s.id=service_id and s.provider_id=public.current_profile_id()));
drop policy if exists "sender creates inquiry" on public.service_inquiries;
create policy "sender creates inquiry" on public.service_inquiries for insert to authenticated with check(from_user_id=public.current_profile_id() and exists(select 1 from public.marketplace_services s where s.id=service_id and s.provider_id<>public.current_profile_id()));
drop policy if exists "provider updates inquiry" on public.service_inquiries;
create policy "provider updates inquiry" on public.service_inquiries for update to authenticated using(exists(select 1 from public.marketplace_services s where s.id=service_id and s.provider_id=public.current_profile_id()));

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('service-portfolios','service-portfolios',true,10485760,array['image/png','image/jpeg','image/webp']) on conflict(id) do update set public=true,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;
drop policy if exists "service portfolio public read" on storage.objects;create policy "service portfolio public read" on storage.objects for select using(bucket_id='service-portfolios');
drop policy if exists "service portfolio owner upload" on storage.objects;create policy "service portfolio owner upload" on storage.objects for insert to authenticated with check(bucket_id='service-portfolios' and (storage.foldername(name))[1]=public.current_profile_id()::text);
drop policy if exists "service portfolio owner manage" on storage.objects;create policy "service portfolio owner manage" on storage.objects for delete to authenticated using(bucket_id='service-portfolios' and (storage.foldername(name))[1]=public.current_profile_id()::text);

create index if not exists service_inquiries_service_idx on public.service_inquiries(service_id,created_at desc);
create index if not exists community_events_starts_idx on public.community_events(starts_at);
create index if not exists event_attendees_user_idx on public.event_attendees(user_id);
create index if not exists universities_domain_idx on public.universities(lower(domain));
