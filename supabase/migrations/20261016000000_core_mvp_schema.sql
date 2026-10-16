-- ==============================================================================
-- PHASE 1: COMPREHENSIVE PRODUCTION SCHEMA UPGRADE & MIGRATION
-- Adapts existing Supabase PostgreSQL schema to:
-- 1. Profiles & Roles (Founder, Student, Employee) + Portfolio Fields
-- 2. Workspaces & Workspace Members (Linear / Slack model)
-- 3. Projects: add workspace_id, identifier (Plane pattern)
-- 4. Cycles / Sprints (Plane pattern)
-- 5. Issues / Tasks with Auto-Sequence ID (INN-1, INN-2)
-- 6. Channels & Channel Members (Mattermost pattern)
-- 7. Messages: update to support channel_id (Mattermost pattern)
-- 8. Message Reactions
-- 9. Row Level Security & Realtime Publications
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. PROFILES MIGRATION (Alter existing profiles table smoothly)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS full_name TEXT;
UPDATE public.profiles SET full_name = name WHERE full_name IS NULL AND name IS NOT NULL;
ALTER TABLE public.profiles ALTER COLUMN full_name SET DEFAULT '';

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS headline TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS links JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS startup_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS startup_stage TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS education TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT false;

-- 3. WORKSPACES (Linear/Slack Style Container)
CREATE TABLE IF NOT EXISTS public.workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. WORKSPACE MEMBERS (RBAC: owner, admin, member)
CREATE TABLE IF NOT EXISTS public.workspace_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (workspace_id, user_id)
);

-- 5. UPGRADE PROJECTS (Support Plane Workspace & Identifier Pattern)
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS identifier TEXT;

-- 6. CYCLES / SPRINTS (Plane Pattern)
CREATE TABLE IF NOT EXISTS public.cycles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  start_date DATE,
  end_date DATE,
  status TEXT NOT NULL DEFAULT 'planned' CHECK (status IN ('planned', 'active', 'completed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. ISSUES / TASKS (Plane Pattern)
CREATE TABLE IF NOT EXISTS public.issues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  cycle_id UUID REFERENCES public.cycles(id) ON DELETE SET NULL,
  sequence_id INT NOT NULL, -- Auto-incrementing per project (INN-1, INN-2)
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT NOT NULL DEFAULT 'none' CHECK (priority IN ('urgent', 'high', 'medium', 'low', 'none')),
  state TEXT NOT NULL DEFAULT 'backlog' CHECK (state IN ('backlog', 'todo', 'in_progress', 'done', 'canceled')),
  assignee_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_by UUID NOT NULL REFERENCES public.profiles(id),
  due_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (project_id, sequence_id)
);

-- 8. CHANNELS (Mattermost/Slack Pattern)
CREATE TABLE IF NOT EXISTS public.channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  is_private BOOLEAN NOT NULL DEFAULT false,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (workspace_id, name)
);

-- 9. CHANNEL MEMBERS (Membership & Unread Tracking)
CREATE TABLE IF NOT EXISTS public.channel_members (
  channel_id UUID NOT NULL REFERENCES public.channels(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  last_read_at TIMESTAMPTZ DEFAULT NOW(),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (channel_id, user_id)
);

-- 10. UPGRADE MESSAGES TABLE (Add channel_id if missing)
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS channel_id UUID REFERENCES public.channels(id) ON DELETE CASCADE;

-- 11. MESSAGE REACTIONS TABLE (Ensure clean structure)
CREATE TABLE IF NOT EXISTS public.message_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  emoji TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (message_id, user_id, emoji)
);

-- ==============================================================================
-- INDEXES FOR MAXIMUM SPEED
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_published ON public.profiles(is_published);
CREATE INDEX IF NOT EXISTS idx_workspace_members_user ON public.workspace_members(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_workspace ON public.projects(workspace_id);
CREATE INDEX IF NOT EXISTS idx_issues_project_state ON public.issues(project_id, state);
CREATE INDEX IF NOT EXISTS idx_issues_cycle ON public.issues(cycle_id);
CREATE INDEX IF NOT EXISTS idx_issues_assignee ON public.issues(assignee_id);
CREATE INDEX IF NOT EXISTS idx_channels_workspace ON public.channels(workspace_id);
CREATE INDEX IF NOT EXISTS idx_channel_members_user ON public.channel_members(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_channel_created ON public.messages(channel_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_parent ON public.messages(parent_id);

-- ==============================================================================
-- AUTOMATIC SEQUENCE ID GENERATOR (INN-1, INN-2...)
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.set_issue_sequence_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.sequence_id IS NULL OR NEW.sequence_id = 0 THEN
    SELECT COALESCE(MAX(sequence_id), 0) + 1
    INTO NEW.sequence_id
    FROM public.issues
    WHERE project_id = NEW.project_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_issue_sequence_id ON public.issues;
CREATE TRIGGER trigger_set_issue_sequence_id
  BEFORE INSERT ON public.issues
  FOR EACH ROW
  EXECUTE FUNCTION public.set_issue_sequence_id();

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cycles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.channel_members ENABLE ROW LEVEL SECURITY;

-- WORKSPACES RLS
DROP POLICY IF EXISTS "Workspace members can view workspace" ON public.workspaces;
CREATE POLICY "Workspace members can view workspace" ON public.workspaces
  FOR SELECT USING (
    owner_id = auth.uid() OR
    EXISTS (SELECT 1 FROM public.workspace_members WHERE workspace_id = workspaces.id AND user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Users can create workspaces" ON public.workspaces;
CREATE POLICY "Users can create workspaces" ON public.workspaces
  FOR INSERT WITH CHECK (owner_id = auth.uid());

DROP POLICY IF EXISTS "Owners can update workspace" ON public.workspaces;
CREATE POLICY "Owners can update workspace" ON public.workspaces
  FOR UPDATE USING (owner_id = auth.uid());

-- WORKSPACE MEMBERS RLS
DROP POLICY IF EXISTS "Members can view workspace members" ON public.workspace_members;
CREATE POLICY "Members can view workspace members" ON public.workspace_members
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.workspace_members wm WHERE wm.workspace_id = workspace_members.workspace_id AND wm.user_id = auth.uid())
  );

-- CYCLES RLS
DROP POLICY IF EXISTS "Members can view cycles" ON public.cycles;
CREATE POLICY "Members can view cycles" ON public.cycles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = cycles.project_id
        AND (
          p.founder_id = auth.uid() OR
          EXISTS (SELECT 1 FROM public.workspace_members wm WHERE wm.workspace_id = p.workspace_id AND wm.user_id = auth.uid()) OR
          EXISTS (SELECT 1 FROM public.connections c WHERE c.project_id = p.id AND (c.requester_id = auth.uid() OR c.recipient_id = auth.uid()) AND c.status = 'ACCEPTED')
        )
    )
  );

DROP POLICY IF EXISTS "Members can manage cycles" ON public.cycles;
CREATE POLICY "Members can manage cycles" ON public.cycles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = cycles.project_id
        AND (
          p.founder_id = auth.uid() OR
          EXISTS (SELECT 1 FROM public.workspace_members wm WHERE wm.workspace_id = p.workspace_id AND wm.user_id = auth.uid())
        )
    )
  );

-- ISSUES RLS
DROP POLICY IF EXISTS "Workspace members can view issues" ON public.issues;
CREATE POLICY "Workspace members can view issues" ON public.issues
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = issues.project_id
        AND (
          p.founder_id = auth.uid() OR
          issues.created_by = auth.uid() OR
          issues.assignee_id = auth.uid() OR
          EXISTS (SELECT 1 FROM public.workspace_members wm WHERE wm.workspace_id = p.workspace_id AND wm.user_id = auth.uid()) OR
          EXISTS (SELECT 1 FROM public.connections c WHERE c.project_id = p.id AND (c.requester_id = auth.uid() OR c.recipient_id = auth.uid()) AND c.status = 'ACCEPTED')
        )
    )
  );

DROP POLICY IF EXISTS "Workspace members can create and update issues" ON public.issues;
CREATE POLICY "Workspace members can create and update issues" ON public.issues
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = issues.project_id
        AND (
          p.founder_id = auth.uid() OR
          issues.created_by = auth.uid() OR
          EXISTS (SELECT 1 FROM public.workspace_members wm WHERE wm.workspace_id = p.workspace_id AND wm.user_id = auth.uid()) OR
          EXISTS (SELECT 1 FROM public.connections c WHERE c.project_id = p.id AND (c.requester_id = auth.uid() OR c.recipient_id = auth.uid()) AND c.status = 'ACCEPTED')
        )
    )
  );

-- CHANNELS RLS
DROP POLICY IF EXISTS "Channel visibility policy" ON public.channels;
CREATE POLICY "Channel visibility policy" ON public.channels
  FOR SELECT USING (
    (is_private = false AND EXISTS (SELECT 1 FROM public.workspace_members WHERE workspace_id = channels.workspace_id AND user_id = auth.uid()))
    OR EXISTS (SELECT 1 FROM public.channel_members WHERE channel_id = channels.id AND user_id = auth.uid())
  );

-- REALTIME REPLICATION SETUP
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'issues'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.issues;
  END IF;
END $$;
