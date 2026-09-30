begin;
create extension if not exists pgtap with schema extensions;
select plan(12);

select ok(
  (select count(*) from (values
    ('profiles', 'last_seen_at'), ('projects', 'attachments'),
    ('messages', 'parent_id'), ('messages', 'edited_at'), ('messages', 'deleted_at'),
    ('message_edits', 'editor_id'), ('message_edits', 'previous_content'),
    ('team_rooms', 'channels'), ('meetings', 'location'),
    ('milestones', 'due_date'), ('milestones', 'assigned_to'), ('milestones', 'sort_order'),
    ('bookmarks', 'profile_id'), ('notifications', 'message'),
    ('notifications', 'delivered_email_at'), ('endorsements', 'project_id')
  ) as required(table_name, column_name)
  where exists (select 1 from information_schema.columns c where c.table_schema = 'public' and c.table_name = required.table_name and c.column_name = required.column_name)) = 16,
  'upgrade added every application column'
);
select ok(
  exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'bookmarks' and column_name = 'target_user_id')
  and exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'milestones' and column_name = 'target_date')
  and exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'meetings' and column_name = 'meeting_url'),
  'upgrade preserved legacy columns'
);
select ok(
  exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'message_edits' and column_name = 'content' and is_nullable = 'YES'),
  'legacy message edit content is nullable'
);
select ok(
  (select count(*) from (values
    ('current_profile_id'), ('current_user_profile'), ('touch_current_profile'),
    ('finalize_onboarding'), ('set_onboarding_role'), ('edit_message'),
    ('join_university'), ('delete_own_account'), ('can_access_team_room'),
    ('get_public_stats')
  ) as x(function_name)
  where exists (
    select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = x.function_name
      and has_function_privilege('authenticated', p.oid, 'execute')
  )) = 10,
  'upgrade installed all repair RPCs and their grants'
);
select ok(
  (select count(*) from pg_constraint where conname in ('team_tasks_created_by_fkey', 'user_badges_awarded_by_fkey', 'certificates_issued_by_fkey', 'service_purchases_buyer_id_fkey', 'service_purchases_provider_id_fkey', 'community_events_host_id_fkey', 'reports_reporter_id_fkey', 'reports_reported_user_id_fkey', 'reports_project_id_fkey', 'reports_message_id_fkey') and confdeltype = 'n') = 10
  and exists (select 1 from pg_constraint where conname = 'service_purchases_service_id_fkey' and confdeltype = 'c'),
  'upgrade reconciled account deletion foreign keys'
);
select ok(
  (select count(*) from pg_indexes where schemaname = 'public' and indexname in ('team_rooms_project_unique_idx', 'bookmarks_profile_unique_idx')) = 2
  and exists (select 1 from pg_trigger where tgname = 'ibf_guard_connection_pair'),
  'upgrade installed uniqueness indexes and connection guard'
);
select ok(
  exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'messages' and policyname = 'messages update access')
  and exists (select 1 from pg_trigger where tgname = 'ibf_protect_message_update'),
  'upgrade replaced message policies and trigger'
);
select ok(
  not exists (
    select 1 from information_schema.role_table_grants
    where table_schema = 'public'
      and (
        (grantee = 'anon' and table_name <> 'investor_inquiries' and privilege_type <> 'SELECT')
        or (grantee = 'authenticated' and table_name in ('profiles', 'message_edits', 'admin_audit_log') and privilege_type <> 'SELECT')
        or (grantee in ('anon', 'authenticated') and table_name = 'universities' and privilege_type <> 'SELECT')
      )
  ),
  'upgrade removed unsafe API-role writes'
);
select ok(
  not exists (
    select 1 from pg_default_acl d join pg_namespace n on n.oid = d.defaclnamespace
    where n.nspname = 'public' and d.defaclacl is not null
      and pg_has_role(current_user, d.defaclrole, 'USAGE')
      and (d.defaclacl::text like '%anon%' or d.defaclacl::text like '%authenticated%')
  ),
  'upgrade removed project-controllable default privilege exposure'
);
select ok(
  exists (
    select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'generate_certificate_code'
      and has_function_privilege('authenticated', p.oid, 'execute')
  ),
  'upgrade preserved certificate default privileges'
);
select ok(
  not exists (select 1 from information_schema.column_privileges where table_schema = 'public' and grantee in ('anon', 'authenticated') and table_name = 'profiles' and column_name = 'email')
  and not exists (select 1 from information_schema.column_privileges where table_schema = 'public' and grantee in ('anon', 'authenticated') and table_name = 'universities' and column_name = 'api_key')
  and not exists (select 1 from information_schema.column_privileges where table_schema = 'public' and grantee = 'authenticated' and table_name = 'profiles' and column_name = 'role' and privilege_type = 'UPDATE'),
  'upgrade removed sensitive column exposure and role elevation'
);
select ok(
  exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'message_reactions'),
  'upgrade preserved realtime coverage'
);

select * from finish();
rollback;
