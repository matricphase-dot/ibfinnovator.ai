-- Phase 3.2 Production Root Fix: High-Performance Workspace Project Counts RPC
-- Replaces N*4 HTTP queries and unbounded full-table scans with a single index-only SQL aggregate.

CREATE OR REPLACE FUNCTION public.get_workspace_project_counts(p_project_ids uuid[])
RETURNS TABLE(
  project_id uuid,
  issue_count bigint,
  active_cycle_count bigint,
  module_count bigint,
  page_count bigint
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO ''
AS $$
  SELECT 
    p.id AS project_id,
    COALESCE(i.cnt, 0)::bigint AS issue_count,
    COALESCE(c.cnt, 0)::bigint AS active_cycle_count,
    COALESCE(m.cnt, 0)::bigint AS module_count,
    COALESCE(pg.cnt, 0)::bigint AS page_count
  FROM unnest(p_project_ids) AS p(id)
  LEFT JOIN (
    SELECT project_id, count(*)::bigint AS cnt
    FROM public.issues
    WHERE project_id = ANY(p_project_ids)
    GROUP BY project_id
  ) i ON i.project_id = p.id
  LEFT JOIN (
    SELECT project_id, count(*)::bigint AS cnt
    FROM public.cycles
    WHERE project_id = ANY(p_project_ids) AND status IN ('current', 'in_progress', 'active')
    GROUP BY project_id
  ) c ON c.project_id = p.id
  LEFT JOIN (
    SELECT project_id, count(*)::bigint AS cnt
    FROM public.modules
    WHERE project_id = ANY(p_project_ids)
    GROUP BY project_id
  ) m ON m.project_id = p.id
  LEFT JOIN (
    SELECT project_id, count(*)::bigint AS cnt
    FROM public.pages
    WHERE project_id = ANY(p_project_ids)
    GROUP BY project_id
  ) pg ON pg.project_id = p.id;
$$;

GRANT EXECUTE ON FUNCTION public.get_workspace_project_counts(uuid[]) TO authenticated, anon;
