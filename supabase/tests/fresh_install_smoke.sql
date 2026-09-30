begin;
create extension if not exists pgtap with schema extensions;
select plan(17);

select ok(
  (select count(*) from (values
    ('profiles'), ('projects'), ('open_roles'), ('applications'), ('connections'),
    ('messages'), ('message_reactions'), ('message_edits'), ('team_rooms'), ('team_members'),
    ('team_tasks'), ('meetings'), ('meeting_attendees'), ('milestones'), ('bookmarks'),
    ('notifications'), ('reviews'), ('endorsements'), ('badge_definitions'), ('user_badges'),
    ('certificates'), ('cofounder_profiles'), ('match_actions'), ('investor_inquiries'),
    ('marketplace_services'), ('service_inquiries'), ('service_purchases'), ('community_events'),
    ('event_attendees'), ('universities'), ('university_members'), ('reports'), ('user_blocks'),
    ('analytics_events'), ('admin_audit_log')
  ) as required(table_name) where to_regclass('public.' || required.table_name) is not null) = 35,
  'all application tables exist'
);
select ok(
  (select count(*) from (values
    ('profiles', 'last_seen_at'), ('projects', 'attachments'),
    ('messages', 'channel'), ('messages', 'parent_id'), ('messages', 'attachments'),
    ('messages', 'pinned'), ('messages', 'read_at'), ('messages', 'edited_at'),
    ('messages', 'deleted_at'), ('messages', 'updated_at'),
    ('message_edits', 'editor_id'), ('message_edits', 'previous_content'),
    ('team_rooms', 'channels'), ('meetings', 'location'),
    ('milestones', 'due_date'), ('milestones', 'assigned_to'), ('milestones', 'sort_order'),
    ('bookmarks', 'profile_id'), ('notifications', 'message'),
    ('notifications', 'delivered_email_at'), ('endorsements', 'project_id')
  ) as required(table_name, column_name)
  where exists (select 1 from information_schema.columns c where c.table_schema = 'public' and c.table_name = required.table_name and c.column_name = required.column_name)) = 21,
  'all reconciled application columns exist'
);
select ok(
  (select count(*) from (values
    ('current_profile_id'), ('current_user_profile'), ('touch_current_profile'), ('finalize_onboarding'),
    ('set_onboarding_role'), ('edit_message'), ('can_access_team_room'),
    ('delete_own_account'), ('join_university'), ('get_public_stats'), ('schema_contract')
  ) as required(name)
  where exists (select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'public' and p.proname = required.name)) = 11,
  'all public RPCs exist'
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
  'authenticated RPC grants survived the global revoke'
);
select ok(
  (select count(*) from pg_policies where schemaname = 'public' and policyname in ('messages update access', 'own bookmarks manage', 'meetings read access')) = 3,
  'critical RLS policies exist'
);
select ok(
  (select count(*) from pg_indexes where schemaname = 'public' and indexname in ('bookmarks_profile_unique_idx', 'team_rooms_project_unique_idx', 'connections_status_idx')) = 3
  and exists (select 1 from pg_trigger where tgname = 'ibf_guard_connection_pair'),
  'reconciliation indexes and connection guard exist'
);
select ok(
  exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'message_reactions'),
  'message reactions are realtime published'
);
select ok(
  exists (select 1 from storage.buckets where id = 'team-files' and file_size_limit = 10485760),
  'team files bucket is size limited'
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
  'API roles have no unsafe table write privileges'
);
select ok(
  not exists (
    select 1 from pg_default_acl d join pg_namespace n on n.oid = d.defaclnamespace
    where n.nspname = 'public' and d.defaclacl is not null
      and pg_has_role(current_user, d.defaclrole, 'USAGE')
      and (d.defaclacl::text like '%anon%' or d.defaclacl::text like '%authenticated%')
  ),
  'project-controllable default privileges do not expose API roles'
);
select ok(
  exists (
    select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'generate_certificate_code'
      and has_function_privilege('authenticated', p.oid, 'execute')
  ),
  'certificate verification-code default is executable by authenticated'
);
select ok(
  not exists (select 1 from information_schema.column_privileges where table_schema = 'public' and grantee in ('anon', 'authenticated') and table_name = 'profiles' and column_name = 'email')
  and not exists (select 1 from information_schema.column_privileges where table_schema = 'public' and grantee in ('anon', 'authenticated') and table_name = 'universities' and column_name = 'api_key')
  and not exists (select 1 from information_schema.column_privileges where table_schema = 'public' and grantee = 'authenticated' and table_name = 'profiles' and column_name = 'role' and privilege_type = 'UPDATE'),
  'sensitive columns and role elevation are not exposed to API roles'
);
select ok(
  (select count(*) from pg_constraint where conname in ('team_tasks_created_by_fkey', 'user_badges_awarded_by_fkey', 'certificates_issued_by_fkey', 'service_purchases_buyer_id_fkey', 'service_purchases_provider_id_fkey', 'community_events_host_id_fkey', 'reports_reporter_id_fkey', 'reports_reported_user_id_fkey', 'reports_project_id_fkey', 'reports_message_id_fkey') and confdeltype = 'n') = 10
  and exists (select 1 from pg_constraint where conname = 'service_purchases_service_id_fkey' and confdeltype = 'c'),
  'account deletion foreign keys use SET NULL or CASCADE'
);
select ok(
  exists (select 1 from pg_constraint where conname = 'messages_room_type_check' and conrelid = 'public.messages'::regclass),
  'message room type constraint exists'
);
select ok(
  exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'message_edits' and column_name = 'content' and is_nullable = 'YES'),
  'message_edits.content is nullable for redacted edits'
);
select ok(
  not exists (
    select 1 from information_schema.column_privileges
    where table_schema = 'public' and grantee in ('anon', 'authenticated')
      and (
        (table_name = 'profiles' and column_name in ('suspended', 'profile_embedding', 'response_score'))
        or (table_name = 'universities' and column_name = 'api_key')
      )
  ),
  'moderation and integration columns are not selectable by API roles'
);
select ok(
  exists (
    select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'get_public_stats'
      and p.prosecdef
      and p.proconfig is not null
      and p.proconfig::text like '%search_path%'
      and p.prosrc like '%not terms_private%'
  ),
  'public stats exclude private projects'
);

select * from finish();
rollback;
