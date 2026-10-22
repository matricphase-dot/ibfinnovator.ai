-- Migration: 20261022030000_phase_3_3_founder_analytics_rls.sql
-- Description: Phase 3.3 Root Fix: Securely permit founders to read analytics events for their owned projects

DROP POLICY IF EXISTS "own analytics read" ON public.analytics_events;

CREATE POLICY "own analytics read" ON public.analytics_events
FOR SELECT TO authenticated
USING (
  user_id = auth.uid()
  OR public.is_super_admin()
  OR (
    project_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = analytics_events.project_id
        AND p.founder_id = auth.uid()
    )
  )
  OR (
    (metadata->>'project_id') IS NOT NULL
    AND (metadata->>'project_id') ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$'
    AND EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = (metadata->>'project_id')::uuid
        AND p.founder_id = auth.uid()
    )
  )
);
