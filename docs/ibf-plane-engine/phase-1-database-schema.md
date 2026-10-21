# Phase 1: Database Schema & Supabase Migrations (IBF Plane Engine)

> **Platform Target**: `app.innovators-global.com`  
> **Source Baseline**: [makeplane/plane](https://github.com/makeplane/plane) database models  
> **Execution Tooling**: Supabase PostgreSQL Connection Pooler (`aws-0-ap-south-1.pooler.supabase.com:6543/postgres`)  
> **Status**: ✅ **COMPLETED & VERIFIED IN PRODUCTION** (Migration `20261021000000_ibf_plane_engine_phase1.sql` applied & tested)  

---

## 1. Overview & Objective

Transform Supabase PostgreSQL into a complete backend for the IBF Project Management Engine. Add all missing Plane.so data primitives:
- **Labels & Tags** with custom hex colors
- **Modules (Epics & Feature Milestones)** with progress metrics
- **Sub-issues hierarchy** via `parent_issue_id` and story points (`estimate_points`)
- **Issue Comments** for real-time team discussions
- **Issue Activities** for audit event history (who changed what and when)
- **IBF Pages** for collaborative PRDs and technical specs
- **Automated Database Triggers** to log activity changes
- **Supabase Realtime Publications** for sub-150ms WebSocket updates

---

## 2. Complete Production SQL Migration Script

Run the following SQL migration script in Supabase:

```sql
-- ============================================================================
-- IBF PLANE ENGINE: PHASE 1 DATABASE MIGRATION SCRIPT
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
  field TEXT NOT NULL, -- 'state', 'priority', 'assignee_id', 'cycle_id', 'module_id', 'title'
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


-- 7. ENABLE ROW LEVEL SECURITY (RLS)
ALTER TABLE public.labels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.issue_labels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.issue_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.issue_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can select labels" ON public.labels FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can manage labels" ON public.labels FOR ALL TO authenticated USING (true);

CREATE POLICY "Authenticated users can access issue_labels" ON public.issue_labels FOR ALL TO authenticated USING (true);
CREATE POLICY "Authenticated users can access modules" ON public.modules FOR ALL TO authenticated USING (true);
CREATE POLICY "Authenticated users can access issue_comments" ON public.issue_comments FOR ALL TO authenticated USING (true);
CREATE POLICY "Authenticated users can access issue_activities" ON public.issue_activities FOR ALL TO authenticated USING (true);
CREATE POLICY "Authenticated users can access pages" ON public.pages FOR ALL TO authenticated USING (true);

GRANT ALL ON public.labels TO authenticated, service_role;
GRANT ALL ON public.issue_labels TO authenticated, service_role;
GRANT ALL ON public.modules TO authenticated, service_role;
GRANT ALL ON public.issue_comments TO authenticated, service_role;
GRANT ALL ON public.issue_activities TO authenticated, service_role;
GRANT ALL ON public.pages TO authenticated, service_role;


-- 8. CONFIGURE SUPABASE REALTIME REPLICATION
ALTER PUBLICATION supabase_realtime ADD TABLE public.issues;
ALTER PUBLICATION supabase_realtime ADD TABLE public.issue_comments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.issue_activities;
ALTER PUBLICATION supabase_realtime ADD TABLE public.cycles;
ALTER PUBLICATION supabase_realtime ADD TABLE public.modules;
```

---

## 3. TypeScript Interface Synchronization

Update `types/database.types.ts` with these new definitions:

```typescript
export interface Label {
  id: string;
  project_id: string;
  name: string;
  color: string;
  description?: string | null;
  created_at: string;
}

export interface Module {
  id: string;
  project_id: string;
  name: string;
  description?: string | null;
  status: 'planned' | 'in_progress' | 'completed' | 'paused' | 'canceled';
  start_date?: string | null;
  target_date?: string | null;
  lead_id?: string | null;
  created_at: string;
  updated_at: string;
}

export interface IssueComment {
  id: string;
  issue_id: string;
  actor_id: string;
  comment_html: string;
  created_at: string;
  updated_at: string;
  actor?: {
    full_name: string;
    avatar_url: string;
  };
}

export interface IssueActivity {
  id: string;
  issue_id: string;
  actor_id?: string | null;
  field: string;
  old_value?: string | null;
  new_value?: string | null;
  created_at: string;
  actor?: {
    full_name: string;
    avatar_url: string;
  };
}

export interface IBFPage {
  id: string;
  project_id: string;
  created_by: string;
  title: string;
  content_markdown: string;
  content_json: Record<string, any>;
  is_favorite: boolean;
  created_at: string;
  updated_at: string;
}
```

---

## 4. Verification & Validation Steps

1. **Schema Integrity Check**:
   ```sql
   SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' 
   AND table_name IN ('labels', 'issue_labels', 'modules', 'issue_comments', 'issue_activities', 'pages');
   ```
2. **Realtime Replication Check**:
   ```sql
   SELECT tablename FROM pg_publication_tables WHERE pubname = 'supabase_realtime';
   ```
3. **Trigger Verification**:
   Update any test issue's state and verify a corresponding row is created in `public.issue_activities`.
