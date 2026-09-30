select extname, extnamespace::regnamespace as schema
from pg_extension
where extname in ('pgcrypto', 'vector')
order by extname;

select grantee, table_name, privilege_type
from information_schema.role_table_grants
where table_schema = 'public'
  and grantee in ('anon', 'authenticated')
order by grantee, table_name, privilege_type;

select n.nspname, d.defaclacl
from pg_default_acl d
join pg_namespace n on n.oid = d.defaclnamespace
where n.nspname = 'public';

select project_id, count(*) as room_count
from public.team_rooms
group by project_id
having count(*) > 1;

select case when requester_id < recipient_id then requester_id else recipient_id end as pair_low,
       case when requester_id < recipient_id then recipient_id else requester_id end as pair_high,
       coalesce(project_id, '00000000-0000-0000-0000-000000000000'::uuid) as project_key,
       count(*),
       array_agg(status order by created_at)
from public.connections
group by 1, 2, 3
having count(*) > 1;

select count(*) as notifications_requiring_backfill
from public.notifications
where message is null or btrim(message) = '';

select conname, confdeltype
from pg_constraint
where conname in (
  'team_tasks_created_by_fkey', 'user_badges_awarded_by_fkey', 'certificates_issued_by_fkey',
  'service_purchases_buyer_id_fkey', 'service_purchases_provider_id_fkey',
  'community_events_host_id_fkey', 'reports_reporter_id_fkey', 'reports_reported_user_id_fkey',
  'reports_project_id_fkey', 'reports_message_id_fkey', 'service_purchases_service_id_fkey'
)
order by conname;

select id, name, public, file_size_limit, allowed_mime_types
from storage.buckets
where id in ('avatars', 'resumes', 'project-files', 'team-files', 'service-portfolios')
order by id;

select c.relname, c.relkind
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relkind in ('r', 'v', 'm', 'f', 'p')
order by c.relkind, c.relname;
