-- Super-admin moderation and safety policies
create or replace function public.is_super_admin()
returns boolean language sql security definer stable set search_path=public as $$
 select exists(select 1 from public.profiles where id=auth.uid() and role='SUPER_ADMIN');
$$;
drop policy if exists "admins update profiles" on public.profiles;
create policy "admins update profiles" on public.profiles for update to authenticated using(public.is_super_admin());
drop policy if exists "admins delete profiles" on public.profiles;
create policy "admins delete profiles" on public.profiles for delete to authenticated using(public.is_super_admin());
drop policy if exists "admins manage projects" on public.projects;
create policy "admins manage projects" on public.projects for all to authenticated using(public.is_super_admin());
drop policy if exists "admins read reports" on public.reports;
create policy "admins read reports" on public.reports for select to authenticated using(public.is_super_admin());
drop policy if exists "admins update reports" on public.reports;
create policy "admins update reports" on public.reports for update to authenticated using(public.is_super_admin());
drop policy if exists "admins read inquiries" on public.investor_inquiries;
create policy "admins read inquiries" on public.investor_inquiries for select to authenticated using(public.is_super_admin());
