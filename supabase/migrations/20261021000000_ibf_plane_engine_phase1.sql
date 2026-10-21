-- ============================================================================
-- IBF PLANE ENGINE: PHASE 1 PRODUCTION DATABASE MIGRATION SCRIPT
-- ============================================================================

-- 1. LABELS & ISSUE LABELS
CREATE TABLE IF NOT EXISTS public.labels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#00f5d4', -- Hex color code (e.g. #ef4444 for bug, #00f5d4 for feature)
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.issue_labels (
  issue_id UUID NOT NULL REFERENCES public.issues(id) ON DELETE CASCADE,
  label_id UUID NOT NULL REFERENCES public.labels(id) ON DELETE CASCADE,
  PRIMARY KEY (issue_id, label_id)
);

CREATE INDEX IF NOT EXISTS idx_labels_project_id ON public.labels(project_id);
CREATE INDEX IF NOT EXISTS idx_issue_labels_issue_id ON public.issue_labels(issue_id);
CREATE INDEX IF NOT EXISTS idx_issue_labels_label_id ON public.issue_labels(label_id);


-- 2. MODULES (EPICS & ROADMAP MILESTONES)
CREATE TABLE IF NOT EXISTS public.modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'planned' CHECK (status IN ('planned', 'in_progress', 'completed', 'paused', 'canceled')),
  start_date DATE,
  target_date DATE,
  lead_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_modules_project_id ON public.modules(project_id);
CREATE INDEX IF NOT EXISTS idx_modules_status ON public.modules(status);

-- Add missing columns to issues table for Plane feature parity
ALTER TABLE public.issues ADD COLUMN IF NOT EXISTS module_id UUID REFERENCES public.modules(id) ON DELETE SET NULL;
ALTER TABLE public.issues ADD COLUMN IF NOT EXISTS parent_issue_id UUID REFERENCES public.issues(id) ON DELETE SET NULL;
ALTER TABLE public.issues ADD COLUMN IF NOT EXISTS estimate_points INT DEFAULT NULL;

CREATE INDEX IF NOT EXISTS idx_issues_module_id ON public.issues(module_id);
CREATE INDEX IF NOT EXISTS idx_issues_parent_issue_id ON public.issues(parent_issue_id);

-- Ensure projects table has name column matching title for backward and forward compatibility
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS name TEXT;
UPDATE public.projects SET name = title WHERE name IS NULL AND title IS NOT NULL;


-- 3. ISSUE COMMENTS (TEAM DISCUSSIONS)
CREATE TABLE IF NOT EXISTS public.issue_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_id UUID NOT NULL REFERENCES public.issues(id) ON DELETE CASCADE,
  actor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  comment_html TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_issue_comments_issue_id ON public.issue_comments(issue_id);
CREATE INDEX IF NOT EXISTS idx_issue_comments_created_at ON public.issue_comments(created_at DESC);


-- 4. ISSUE ACTIVITIES (AUDIT TRAIL / TIMELINE)
CREATE TABLE IF NOT EXISTS public.issue_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_id UUID NOT NULL REFERENCES public.issues(id) ON DELETE CASCADE,
  actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  field TEXT NOT NULL, -- 'state', 'priority', 'assignee', 'cycle', 'module', 'title'
  old_value TEXT,
  new_value TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_issue_activities_issue_id ON public.issue_activities(issue_id);
CREATE INDEX IF NOT EXISTS idx_issue_activities_created_at ON public.issue_activities(created_at DESC);


-- 5. IBF PAGES (NOTION-GRADE COLLABORATIVE DOCS & PRDS)
CREATE TABLE IF NOT EXISTS public.pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'Untitled Document',
  content_markdown TEXT NOT NULL DEFAULT '',
  content_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_favorite BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pages_project_id ON public.pages(project_id);
CREATE INDEX IF NOT EXISTS idx_pages_updated_at ON public.pages(updated_at DESC);


-- 6. AUTOMATED AUDIT TRIGGER FOR ISSUE MUTATIONS
CREATE OR REPLACE FUNCTION public.log_issue_activity_trigger()
RETURNS TRIGGER AS $$
BEGIN
  -- Log state transition
  IF (OLD.state IS DISTINCT FROM NEW.state) THEN
    INSERT INTO public.issue_activities (issue_id, actor_id, field, old_value, new_value)
    VALUES (NEW.id, auth.uid(), 'state', OLD.state, NEW.state);
  END IF;

  -- Log priority update
  IF (OLD.priority IS DISTINCT FROM NEW.priority) THEN
    INSERT INTO public.issue_activities (issue_id, actor_id, field, old_value, new_value)
    VALUES (NEW.id, auth.uid(), 'priority', OLD.priority, NEW.priority);
  END IF;

  -- Log assignee change
  IF (OLD.assignee_id IS DISTINCT FROM NEW.assignee_id) THEN
    INSERT INTO public.issue_activities (issue_id, actor_id, field, old_value, new_value)
    VALUES (NEW.id, auth.uid(), 'assignee', OLD.assignee_id::text, NEW.assignee_id::text);
  END IF;

  -- Log cycle change
  IF (OLD.cycle_id IS DISTINCT FROM NEW.cycle_id) THEN
    INSERT INTO public.issue_activities (issue_id, actor_id, field, old_value, new_value)
    VALUES (NEW.id, auth.uid(), 'cycle', OLD.cycle_id::text, NEW.cycle_id::text);
  END IF;

  -- Log module change
  IF (OLD.module_id IS DISTINCT FROM NEW.module_id) THEN
    INSERT INTO public.issue_activities (issue_id, actor_id, field, old_value, new_value)
    VALUES (NEW.id, auth.uid(), 'module', OLD.module_id::text, NEW.module_id::text);
  END IF;

  -- Auto-update updated_at timestamp
  NEW.updated_at = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_issue_audit_log ON public.issues;
CREATE TRIGGER trg_issue_audit_log
BEFORE UPDATE ON public.issues
FOR EACH ROW EXECUTE FUNCTION public.log_issue_activity_trigger();


-- 7. ENABLE ROW LEVEL SECURITY (RLS) & POLICIES
ALTER TABLE public.labels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.issue_labels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.issue_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.issue_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pages ENABLE ROW LEVEL SECURITY;

-- Labels RLS
DROP POLICY IF EXISTS "Authenticated users can select labels" ON public.labels;
CREATE POLICY "Authenticated users can select labels" ON public.labels
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Authenticated users can manage labels" ON public.labels;
CREATE POLICY "Authenticated users can manage labels" ON public.labels
  FOR ALL TO authenticated USING (true);

-- Issue Labels RLS
DROP POLICY IF EXISTS "Authenticated users can access issue_labels" ON public.issue_labels;
CREATE POLICY "Authenticated users can access issue_labels" ON public.issue_labels
  FOR ALL TO authenticated USING (true);

-- Modules RLS
DROP POLICY IF EXISTS "Authenticated users can access modules" ON public.modules;
CREATE POLICY "Authenticated users can access modules" ON public.modules
  FOR ALL TO authenticated USING (true);

-- Issue Comments RLS
DROP POLICY IF EXISTS "Authenticated users can access issue_comments" ON public.issue_comments;
CREATE POLICY "Authenticated users can access issue_comments" ON public.issue_comments
  FOR ALL TO authenticated USING (true);

-- Issue Activities RLS
DROP POLICY IF EXISTS "Authenticated users can access issue_activities" ON public.issue_activities;
CREATE POLICY "Authenticated users can access issue_activities" ON public.issue_activities
  FOR ALL TO authenticated USING (true);

-- Pages RLS
DROP POLICY IF EXISTS "Authenticated users can access pages" ON public.pages;
CREATE POLICY "Authenticated users can access pages" ON public.pages
  FOR ALL TO authenticated USING (true);

-- Grants
GRANT ALL ON public.labels TO authenticated, service_role;
GRANT ALL ON public.issue_labels TO authenticated, service_role;
GRANT ALL ON public.modules TO authenticated, service_role;
GRANT ALL ON public.issue_comments TO authenticated, service_role;
GRANT ALL ON public.issue_activities TO authenticated, service_role;
GRANT ALL ON public.pages TO authenticated, service_role;


-- 8. CONFIGURE SUPABASE REALTIME REPLICATION
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'issues'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.issues;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'issue_comments'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.issue_comments;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'issue_activities'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.issue_activities;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'cycles'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.cycles;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'modules'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.modules;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'pages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.pages;
  END IF;
END $$;
