-- Atomic, idempotent onboarding finalization. Internal identity remains UUID.
alter table public.profiles add column if not exists proficiency jsonb not null default '[]'::jsonb;
alter table public.profiles add column if not exists resume_url text;
alter table public.profiles add column if not exists preferred_role text;
alter table public.profiles add column if not exists industry text;
alter table public.profiles add column if not exists onboarding_completed boolean not null default false;

create or replace function public.finalize_onboarding(
 p_role text,p_name text,p_company text,p_linkedin_url text,p_github_url text,
 p_availability text,p_timezone text,p_past_ventures text,p_industry text,
 p_startup_name text,p_tagline text,p_domain text,p_stage text,p_problem text,p_solution text,p_roles jsonb,
 p_college text,p_education_year text,p_skills jsonb,p_interests text[],p_preferred_role text,p_goals text,
 p_portfolio_urls text[],p_resume_url text,p_username text
) returns jsonb language plpgsql security definer set search_path=public as $$
declare v_user_id uuid:=public.current_profile_id();v_project_id uuid;v_role jsonb;v_done boolean;
begin
 if v_user_id is null then raise exception 'Not authenticated'; end if;
 select onboarding_completed into v_done from public.profiles where id=v_user_id for update;
 if not found then raise exception 'Profile not linked'; end if;
 if v_done then return jsonb_build_object('ok',true,'already_completed',true); end if;
 if p_role not in ('FOUNDER','STUDENT') then raise exception 'Invalid role'; end if;
 update public.profiles set role=p_role::public.user_role,name=p_name,company=nullif(p_company,''),linkedin_url=nullif(p_linkedin_url,''),github_url=nullif(p_github_url,''),availability=p_availability,timezone=p_timezone,past_ventures=nullif(p_past_ventures,''),industry=nullif(p_industry,''),college=nullif(p_college,''),education_year=nullif(p_education_year,''),proficiency=coalesce(p_skills,'[]'::jsonb),skills=coalesce((select array_agg(x->>'name') from jsonb_array_elements(coalesce(p_skills,'[]'::jsonb)) x where nullif(x->>'name','') is not null),'{}'),interests=coalesce(p_interests,'{}'),role_preferences=case when nullif(p_preferred_role,'') is null then '{}' else array[p_preferred_role] end,goals=nullif(p_goals,''),portfolio_urls=coalesce(p_portfolio_urls,'{}'),resume_url=nullif(p_resume_url,''),username=lower(nullif(p_username,'')),onboarding_completed=true,updated_at=now() where id=v_user_id;
 if p_role='FOUNDER' then
  if p_startup_name is null or p_problem is null or p_solution is null then raise exception 'Startup details required'; end if;
  insert into public.projects(founder_id,title,description,tagline,domain,stage,problem_statement,solution_overview,status)
  values(v_user_id,p_startup_name,p_problem,nullif(p_tagline,''),p_domain,p_stage,p_problem,p_solution,'OPEN') returning id into v_project_id;
  for v_role in select value from jsonb_array_elements(coalesce(p_roles,'[]'::jsonb)) loop
   insert into public.open_roles(project_id,title,description,required_skills,engagement_type,equity_range,stipend_range,commitment_hours,duration_weeks,status)
   values(v_project_id,v_role->>'title',v_role->>'description',coalesce(array(select jsonb_array_elements_text(coalesce(v_role->'skills','[]'::jsonb))),'{}'),v_role->>'engagement',nullif(v_role->>'equity_range',''),nullif(v_role->>'stipend_range',''),(v_role->>'hours')::int,(v_role->>'duration')::int,'OPEN');
  end loop;
 end if;
 return jsonb_build_object('ok',true,'project_id',v_project_id);
end;$$;
revoke all on function public.finalize_onboarding(text,text,text,text,text,text,text,text,text,text,text,text,text,text,text,jsonb,text,text,jsonb,text[],text,text,text[],text,text) from public;
grant execute on function public.finalize_onboarding(text,text,text,text,text,text,text,text,text,text,text,text,text,text,text,jsonb,text,text,jsonb,text[],text,text,text[],text,text) to authenticated;
