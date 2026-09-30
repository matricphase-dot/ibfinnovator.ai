-- IBF Innovators.ai — default privilege audit and repair
-- Idempotent, transactional, and safe to run on a populated production project.
--
-- What this is for:
--   Supabase creates default privileges in schema public that are owned by the
--   platform role `supabase_admin`, and it grants `anon` and `authenticated` on
--   them. A project cannot run ALTER DEFAULT PRIVILEGES FOR ROLE on a role it is
--   not a member of, so those entries cannot be edited from a project connection
--   or the SQL Editor (both run as `postgres`). This script proves that, repairs
--   everything the project role does control, and reports the platform entries as
--   informational.
--
-- Why the platform entries are acceptable:
--   Default privileges only apply to objects created afterwards by their owner.
--   Supabase does not create application tables in public, and every IBF migration
--   ends with explicit revokes for its own objects. schema_contract audits the
--   actual state of every table, routine, and column, so any object that is ever
--   exposed is detected by `node scripts/verify-supabase.mjs` and blocks a
--   release. This is the compensating control.
--
-- Expected results on a stock Supabase project:
--   project_default_privileges = 0
--   platform_default_privileges = 3   (informational; owned by supabase_admin)
--   unsafe_default_privileges    = 0
--
-- How to run it:
--   Supabase Dashboard -> SQL Editor -> New query -> paste this file -> Run.

--------------------------------------------------------------------------------
-- Step 1: who owns the default privileges, and can this session change them?
--------------------------------------------------------------------------------
select current_user,
       r.rolsuper as session_is_superuser,
       (select rolname from pg_roles where rolname = 'supabase_admin') as platform_role
from pg_roles r where r.rolname = current_user;

select pg_get_userbyid(d.defaclrole) as owner,
       coalesce(n.nspname, '<GLOBAL>') as schema,
       d.defaclobjtype as object_type,
       d.defaclacl::text as acl,
       pg_has_role(current_user, d.defaclrole, 'USAGE') as project_can_alter
from pg_default_acl d
left join pg_namespace n on n.oid = d.defaclnamespace
where d.defaclacl is not null
  and n.nspname = 'public'
order by owner, object_type;

--------------------------------------------------------------------------------
-- Step 2: repair everything this session controls
--------------------------------------------------------------------------------
begin;

-- 2a: defaults owned by the current role.
do $$
begin
  execute 'alter default privileges in schema public revoke all on tables from anon, authenticated';
  execute 'alter default privileges in schema public revoke all on sequences from anon, authenticated';
  execute 'alter default privileges in schema public revoke all on functions from anon, authenticated';
exception when others then
  raise warning 'current-role default privileges untouched: %', sqlerrm;
end $$;

-- 2b: defaults owned by any other role this session is a member of.
do $$
declare
  acl_owner oid;
begin
  for acl_owner in
    select distinct d.defaclrole
    from pg_default_acl d
    join pg_namespace n on n.oid = d.defaclnamespace
    where n.nspname = 'public'
      and d.defaclacl is not null
      and pg_has_role(current_user, d.defaclrole, 'USAGE')
      and (d.defaclacl::text like '%anon%' or d.defaclacl::text like '%authenticated%')
  loop
    begin
      execute format('alter default privileges for role %I in schema public revoke all on tables from anon, authenticated', acl_owner::regrole::text);
      execute format('alter default privileges for role %I in schema public revoke all on sequences from anon, authenticated', acl_owner::regrole::text);
      execute format('alter default privileges for role %I in schema public revoke all on functions from anon, authenticated', acl_owner::regrole::text);
      raise notice 'stripped default privileges for role %', acl_owner::regrole;
    exception when others then
      raise warning 'failed for role %: %', acl_owner::regrole, sqlerrm;
    end;
  end loop;
end $$;

-- 2c: prove whether the platform role is reachable from a project session.
do $$
begin
  execute 'set local role supabase_admin';
  raise notice 'session can assume supabase_admin; re-run after escalating to apply platform defaults';
exception when others then
  raise notice 'session cannot assume supabase_admin (%); platform defaults are read-only from a project connection', sqlerrm;
end $$;

commit;

notify pgrst, 'reload schema';

--------------------------------------------------------------------------------
-- Step 3: verdict
--------------------------------------------------------------------------------
select public.schema_contract() -> 'unsafe_default_privileges' as unsafe_default_privileges,
       public.schema_contract() -> 'platform_default_privileges' as platform_default_privileges;

select r.rolname as owner,
       count(*) filter (where pg_has_role(current_user, d.defaclrole, 'USAGE')) as project_controlled,
       count(*) filter (where not pg_has_role(current_user, d.defaclrole, 'USAGE')) as platform_owned
from pg_default_acl d
left join pg_roles r on r.oid = d.defaclrole
left join pg_namespace n on n.oid = d.defaclnamespace
where d.defaclacl is not null
  and n.nspname = 'public'
  and (d.defaclacl::text like '%anon%' or d.defaclacl::text like '%authenticated%')
group by r.rolname;
