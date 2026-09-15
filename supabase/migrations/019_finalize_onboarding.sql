-- 019_finalize_onboarding.sql
-- Batch 4: single transactional entry point for the 5-step onboarding wizard.
--
-- Design notes
--  * SECURITY DEFINER + public.current_profile_id(): the caller never supplies a
--    user id, so a client cannot finalize onboarding for somebody else.
--  * Idempotent: safe to re-run. The function returns early if the profile is
--    already onboarded, and every column add below is IF NOT EXISTS.
--  * Five columns the wizard captures (username, industry, proficiency,
--    preferred_role, resume_url) did not exist on public.profiles before this
--    migration — the original spec for this batch wrote to them. They are added
--    here so the function below can persist what it is given.
--  * The open_roles insert coalesces required_skills to '{}' because that column
--    is NOT NULL; array_agg over an empty skill list returns NULL.

-- ---------------------------------------------------------------------------
-- 1. Columns the wizard captures that were missing from public.profiles.
-- ---------------------------------------------------------------------------
alter table public.profiles add column if not exists username text;
alter table public.profiles add column if not exists industry text;
alter table public.profiles add column if not exists proficiency jsonb not null default '{}'::jsonb;
alter table public.profiles add column if not exists preferred_role text;
alter table public.profiles add column if not exists resume_url text;

-- Usernames are public identifiers, so one person per handle (case-insensitive).
-- Existing rows are NULL and therefore excluded from the index.
create unique index if not exists profiles_username_key
  on public.profiles (lower(username))
  where username is not null;

-- ---------------------------------------------------------------------------
-- 2. finalize_onboarding — one atomic write for the whole wizard.
-- ---------------------------------------------------------------------------
create or replace function public.finalize_onboarding(
  p_role text,
  p_name text,
  p_company text default null,
  p_linkedin_url text default null,
  p_github_url text default null,
  p_availability text default null,
  p_timezone text default null,
  p_past_ventures text default null,
  p_industry text default null,
  p_startup_name text default null,
  p_tagline text default null,
  p_domain text default null,
  p_stage text default null,
  p_problem text default null,
  p_solution text default null,
  p_roles jsonb default null,
  p_college text default null,
  p_education_year text default null,
  p_proficiency jsonb default null,
  p_interests text[] default null,
  p_preferred_role text default null,
  p_goals text default null,
  p_portfolio_urls text[] default null,
  p_resume_url text default null,
  p_username text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_user_id uuid;
  v_project_id uuid;
  v_role_record jsonb;
  v_skills text[];
  v_project_skills text[];
begin
  v_user_id := public.current_profile_id();
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  if exists (
    select 1 from public.profiles
    where id = v_user_id and onboarding_completed = true
  ) then
    return jsonb_build_object('ok', true, 'already_completed', true);
  end if;

  -- The wizard collects skills as [{name, proficiency}]. lib/matching.ts scores
  -- against profiles.skills, so the names are derived here — that is what makes
  -- a student's preview matches meaningful instead of always empty.
  if p_proficiency is not null and jsonb_typeof(p_proficiency) = 'array' then
    select array_agg(distinct lower(trim(e->>'name')))
      into v_skills
      from jsonb_array_elements(p_proficiency) e
     where coalesce(trim(e->>'name'), '') <> '';
  end if;

  update public.profiles
  set
    name = coalesce(p_name, name),
    company = coalesce(p_company, company),
    linkedin_url = coalesce(p_linkedin_url, linkedin_url),
    github_url = coalesce(p_github_url, github_url),
    availability = coalesce(p_availability, availability),
    timezone = coalesce(p_timezone, timezone),
    past_ventures = coalesce(p_past_ventures, past_ventures),
    industry = coalesce(p_industry, industry),
    college = coalesce(p_college, college),
    education_year = coalesce(p_education_year, education_year),
    skills = coalesce(v_skills, skills),
    proficiency = coalesce(p_proficiency, proficiency),
    interests = coalesce(p_interests, interests),
    preferred_role = coalesce(p_preferred_role, preferred_role),
    goals = coalesce(p_goals, goals),
    portfolio_urls = coalesce(p_portfolio_urls, portfolio_urls),
    resume_url = coalesce(p_resume_url, resume_url),
    username = coalesce(nullif(trim(p_username), ''), username),
    onboarding_completed = true,
    updated_at = now()
  where id = v_user_id;

  if p_role = 'FOUNDER' and p_startup_name is not null then
    -- Union of the open roles' skills, so projects created here carry the
    -- required_skills that student-side matching reads.
    if p_roles is not null and jsonb_typeof(p_roles) = 'array' then
      select array_agg(distinct lower(trim(s)))
        into v_project_skills
        from jsonb_array_elements(p_roles) r,
             jsonb_array_elements_text(coalesce(r->'skills', '[]'::jsonb)) s
       where coalesce(trim(s), '') <> '';
    end if;

    insert into public.projects (
      founder_id, title, description, tagline, domain, stage,
      problem_statement, solution_overview, required_skills, status
    ) values (
      v_user_id, p_startup_name, coalesce(p_problem, ''), p_tagline, p_domain, p_stage,
      p_problem, p_solution, coalesce(v_project_skills, '{}'), 'OPEN'
    )
    returning id into v_project_id;

    for v_role_record in
      select * from jsonb_array_elements(coalesce(p_roles, '[]'::jsonb))
    loop
      insert into public.open_roles (
        project_id, title, description, required_skills,
        engagement_type, commitment_hours, duration_weeks
      ) values (
        v_project_id,
        coalesce(nullif(trim(v_role_record->>'title'), ''), 'Open role'),
        coalesce(nullif(trim(v_role_record->>'description'), ''), ''),
        coalesce(
          (
            select array_agg(distinct lower(trim(x)))
            from jsonb_array_elements_text(
              coalesce(v_role_record->'skills', '[]'::jsonb)
            ) x
            where coalesce(trim(x), '') <> ''
          ),
          '{}'
        ),
        nullif(trim(v_role_record->>'engagement'), ''),
        nullif(trim(v_role_record->>'hours'), '')::int,
        nullif(trim(v_role_record->>'duration'), '')::int
      );
    end loop;
  end if;

  return jsonb_build_object('ok', true, 'project_id', v_project_id);
end;
$$;

-- Only signed-in members may finalize. Anonymous visitors must never reach it:
-- revoking from PUBLIC drops the default EXECUTE grant that anon also inherits.
revoke all on function public.finalize_onboarding(text,text,text,text,text,text,text,text,text,text,text,text,text,text,text,jsonb,text,text,jsonb,text[],text,text,text[],text,text) from public;
revoke all on function public.finalize_onboarding(text,text,text,text,text,text,text,text,text,text,text,text,text,text,text,jsonb,text,text,jsonb,text[],text,text,text[],text,text) from anon;
grant execute on function public.finalize_onboarding(text,text,text,text,text,text,text,text,text,text,text,text,text,text,text,jsonb,text,text,jsonb,text[],text,text,text[],text,text) to authenticated;

-- ---------------------------------------------------------------------------
-- 3. Verification — run this and expect one row of `t` per column.
-- ---------------------------------------------------------------------------
select
  (select count(*) from information_schema.columns
    where table_schema = 'public' and table_name = 'profiles'
      and column_name in ('username','industry','proficiency','preferred_role','resume_url')) as wizard_columns_5,
  (select count(*) from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'finalize_onboarding') as function_defined_1,
  (select has_function_privilege('authenticated',
     'public.finalize_onboarding(text,text,text,text,text,text,text,text,text,text,text,text,text,text,text,jsonb,text,text,jsonb,text[],text,text,text[],text,text)',
     'execute')) as authenticated_may_execute,
  (select has_function_privilege('anon',
     'public.finalize_onboarding(text,text,text,text,text,text,text,text,text,text,text,text,text,text,text,jsonb,text,text,jsonb,text[],text,text,text[],text,text)',
     'execute')) as anon_must_be_false;
