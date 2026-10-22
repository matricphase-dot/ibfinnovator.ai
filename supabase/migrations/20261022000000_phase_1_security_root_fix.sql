-- ==============================================================================
-- PHASE 1: DATABASE SECURITY, COLUMN PRIVILEGES & TENANT RLS ISOLATION
-- Root fix for production multi-tenant security:
-- 1. Grant SELECT on full_name and portfolio fields on public.profiles
-- 2. Add 'CHANNEL' room_type check constraint to public.messages
-- 3. Non-recursive is_workspace_member() helper function
-- 4. Complete RLS policies for workspace_members (SELECT, INSERT, DELETE)
-- 5. Scope can_access_channel() and channels policy to workspace members
-- 6. Harden messages RLS so channel messages require can_access_channel()
-- 7. Secure pages RLS: select, insert, update, delete scoped to workspace/founder
-- 8. Secure modules, labels, issue_labels, issue_comments, issue_activities RLS
-- 9. Fix arbitrary issue creation bypass (strict INSERT check)
-- 10. Concurrency-safe issue sequence ID generation via pg_advisory_xact_lock
-- ==============================================================================

-- 1. COLUMN PRIVILEGES FOR PROFILES
GRANT SELECT (
  id, name, full_name, username, avatar_url, role, bio, college, education_year,
  linkedin_url, github_url, timezone, location, skills, proficiency, interests,
  portfolio_urls, resume_url, availability, engagement_preferences, role_preferences,
  preferred_role, company, goals, past_ventures, industry, is_cofounder, working_style,
  values_profile, average_rating, endorsement_count, verification_status, investor_visible,
  investor_pitch, headline, links, startup_name, startup_stage, education, is_published,
  email_opt_in, onboarding_completed, last_seen_at, created_at, updated_at
) ON public.profiles TO authenticated;

GRANT SELECT (
  id, name, full_name, username, avatar_url, bio, skills, interests, portfolio_urls,
  availability, company, goals, industry, is_cofounder, average_rating, endorsement_count,
  investor_visible, investor_pitch, role, headline, links, startup_name, startup_stage,
  education, is_published, created_at
) ON public.profiles TO anon;

-- 2. MESSAGES ROOM_TYPE CONSTRAINT UPGRADE
ALTER TABLE public.messages DROP CONSTRAINT IF EXISTS messages_room_type_check;
ALTER TABLE public.messages ADD CONSTRAINT messages_room_type_check 
  CHECK (room_type IN ('GENERAL', 'DIRECT', 'TEAM', 'CHANNEL'));

-- 3. HELPER FUNCTION: is_workspace_member (Security Definer to prevent RLS recursion)
CREATE OR REPLACE FUNCTION public.is_workspace_member(ws_id uuid, check_user uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.workspace_members
    WHERE workspace_id = ws_id AND user_id = check_user
    UNION
    SELECT 1 FROM public.workspaces
    WHERE id = ws_id AND owner_id = check_user
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_workspace_member(uuid, uuid) TO authenticated, anon;

-- 4. WORKSPACE MEMBERS RLS
ALTER TABLE public.workspace_members ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Members can view workspace members" ON public.workspace_members;
DROP POLICY IF EXISTS "workspace_members_select_policy" ON public.workspace_members;
DROP POLICY IF EXISTS "workspace_members_insert_policy" ON public.workspace_members;
DROP POLICY IF EXISTS "workspace_members_delete_policy" ON public.workspace_members;

CREATE POLICY "workspace_members_select_policy" ON public.workspace_members
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.workspaces w
      WHERE w.id = workspace_members.workspace_id AND w.owner_id = auth.uid()
    )
    OR public.is_workspace_member(workspace_members.workspace_id, auth.uid())
  );

CREATE POLICY "workspace_members_insert_policy" ON public.workspace_members
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.workspaces w
      WHERE w.id = workspace_members.workspace_id AND w.owner_id = auth.uid()
    )
  );

CREATE POLICY "workspace_members_delete_policy" ON public.workspace_members
  FOR DELETE TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.workspaces w
      WHERE w.id = workspace_members.workspace_id AND w.owner_id = auth.uid()
    )
  );

-- 5. FUNCTION: can_access_channel (Scoped to workspace membership)
CREATE OR REPLACE FUNCTION public.can_access_channel(target_channel uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO ''
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.channels c
    WHERE c.id = target_channel
      AND (
        (
          c.is_private = false
          AND (
            EXISTS (SELECT 1 FROM public.workspaces w WHERE w.id = c.workspace_id AND w.owner_id = auth.uid())
            OR public.is_workspace_member(c.workspace_id, auth.uid())
          )
        )
        OR c.created_by = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.channel_members cm
          WHERE cm.channel_id = c.id AND cm.user_id = auth.uid()
        )
        OR EXISTS (
          SELECT 1 FROM public.workspaces w
          WHERE w.id = c.workspace_id AND w.owner_id = auth.uid()
        )
      )
  );
$function$;

GRANT EXECUTE ON FUNCTION public.can_access_channel(uuid) TO authenticated;

-- CHANNELS POLICIES
DROP POLICY IF EXISTS "Channel visibility policy" ON public.channels;
CREATE POLICY "Channel visibility policy" ON public.channels FOR SELECT TO authenticated
USING (
  public.can_access_channel(id)
);

DROP POLICY IF EXISTS "Channel create policy" ON public.channels;
CREATE POLICY "Channel create policy" ON public.channels FOR INSERT TO authenticated
WITH CHECK (
  created_by = auth.uid()
  AND (
    EXISTS (SELECT 1 FROM public.workspaces WHERE id = workspace_id AND owner_id = auth.uid())
    OR public.is_workspace_member(workspace_id, auth.uid())
  )
);

-- 6. MESSAGES POLICIES (Channel messages cannot bypass via GENERAL)
DROP POLICY IF EXISTS "messages read access" ON public.messages;
CREATE POLICY "messages read access" ON public.messages FOR SELECT TO authenticated
USING (
  (room_type = 'GENERAL' AND channel_id IS NULL)
  OR (auth.uid() IN (sender_id, recipient_id))
  OR (room_type = 'TEAM' AND public.can_access_team_room(room_id))
  OR (channel_id IS NOT NULL AND public.can_access_channel(channel_id))
);

DROP POLICY IF EXISTS "messages send access" ON public.messages;
CREATE POLICY "messages send access" ON public.messages FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = sender_id
  AND (
    (room_type = 'GENERAL' AND channel_id IS NULL)
    OR (room_type = 'TEAM' AND public.can_access_team_room(room_id))
    OR (room_type = 'DIRECT' AND public.can_message_direct(project_id, recipient_id))
    OR (channel_id IS NOT NULL AND public.can_access_channel(channel_id))
  )
);

DROP POLICY IF EXISTS "messages update access" ON public.messages;
CREATE POLICY "messages update access" ON public.messages FOR UPDATE TO authenticated
USING (
  (sender_id = auth.uid())
  OR (room_type = 'TEAM' AND public.can_manage_team_room(room_id))
  OR (room_type = 'DIRECT' AND recipient_id = auth.uid())
  OR (channel_id IS NOT NULL AND public.can_access_channel(channel_id) AND sender_id = auth.uid())
);

-- 7. PAGES RLS (Eliminate USING (true) vulnerability)
ALTER TABLE public.pages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated users can access pages" ON public.pages;
DROP POLICY IF EXISTS "pages_select_policy" ON public.pages;
DROP POLICY IF EXISTS "pages_insert_policy" ON public.pages;
DROP POLICY IF EXISTS "pages_update_policy" ON public.pages;
DROP POLICY IF EXISTS "pages_delete_policy" ON public.pages;

CREATE POLICY "pages_select_policy" ON public.pages
  FOR SELECT TO authenticated
  USING (
    created_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = pages.project_id
        AND (
          p.founder_id = auth.uid()
          OR public.is_workspace_member(p.workspace_id, auth.uid())
        )
    )
  );

CREATE POLICY "pages_insert_policy" ON public.pages
  FOR INSERT TO authenticated
  WITH CHECK (
    created_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = pages.project_id
        AND (
          p.founder_id = auth.uid()
          OR public.is_workspace_member(p.workspace_id, auth.uid())
        )
    )
  );

CREATE POLICY "pages_update_policy" ON public.pages
  FOR UPDATE TO authenticated
  USING (
    created_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = pages.project_id
        AND (
          p.founder_id = auth.uid()
          OR (
            public.is_workspace_member(p.workspace_id, auth.uid())
            AND EXISTS (
              SELECT 1 FROM public.workspace_members wm 
              WHERE wm.workspace_id = p.workspace_id AND wm.user_id = auth.uid() AND wm.role IN ('owner', 'admin')
            )
          )
        )
    )
  );

CREATE POLICY "pages_delete_policy" ON public.pages
  FOR DELETE TO authenticated
  USING (
    created_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = pages.project_id
        AND (
          p.founder_id = auth.uid()
          OR (
            public.is_workspace_member(p.workspace_id, auth.uid())
            AND EXISTS (
              SELECT 1 FROM public.workspace_members wm 
              WHERE wm.workspace_id = p.workspace_id AND wm.user_id = auth.uid() AND wm.role IN ('owner', 'admin')
            )
          )
        )
    )
  );

-- 8. MODULES, LABELS, ISSUE LABELS, ISSUE COMMENTS, ISSUE ACTIVITIES RLS
ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated users can access modules" ON public.modules;
DROP POLICY IF EXISTS "modules_select_policy" ON public.modules;
DROP POLICY IF EXISTS "modules_manage_policy" ON public.modules;

CREATE POLICY "modules_select_policy" ON public.modules
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = modules.project_id
        AND (
          p.founder_id = auth.uid()
          OR public.is_workspace_member(p.workspace_id, auth.uid())
        )
    )
  );

CREATE POLICY "modules_manage_policy" ON public.modules
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = modules.project_id
        AND (
          p.founder_id = auth.uid()
          OR public.is_workspace_member(p.workspace_id, auth.uid())
        )
    )
  );

ALTER TABLE public.labels ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated users can select labels" ON public.labels;
DROP POLICY IF EXISTS "Authenticated users can manage labels" ON public.labels;
DROP POLICY IF EXISTS "labels_access_policy" ON public.labels;

CREATE POLICY "labels_access_policy" ON public.labels
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = labels.project_id
        AND (
          p.founder_id = auth.uid()
          OR public.is_workspace_member(p.workspace_id, auth.uid())
        )
    )
  );

ALTER TABLE public.issue_labels ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated users can access issue_labels" ON public.issue_labels;
DROP POLICY IF EXISTS "issue_labels_access_policy" ON public.issue_labels;

CREATE POLICY "issue_labels_access_policy" ON public.issue_labels
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.issues i
      JOIN public.projects p ON p.id = i.project_id
      WHERE i.id = issue_labels.issue_id
        AND (
          p.founder_id = auth.uid()
          OR public.is_workspace_member(p.workspace_id, auth.uid())
        )
    )
  );

ALTER TABLE public.issue_comments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated users can access issue_comments" ON public.issue_comments;
DROP POLICY IF EXISTS "issue_comments_select_policy" ON public.issue_comments;
DROP POLICY IF EXISTS "issue_comments_insert_policy" ON public.issue_comments;
DROP POLICY IF EXISTS "issue_comments_update_delete_policy" ON public.issue_comments;

CREATE POLICY "issue_comments_select_policy" ON public.issue_comments
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.issues i
      JOIN public.projects p ON p.id = i.project_id
      WHERE i.id = issue_comments.issue_id
        AND (
          p.founder_id = auth.uid()
          OR public.is_workspace_member(p.workspace_id, auth.uid())
        )
    )
  );

CREATE POLICY "issue_comments_insert_policy" ON public.issue_comments
  FOR INSERT TO authenticated
  WITH CHECK (
    actor_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.issues i
      JOIN public.projects p ON p.id = i.project_id
      WHERE i.id = issue_comments.issue_id
        AND (
          p.founder_id = auth.uid()
          OR public.is_workspace_member(p.workspace_id, auth.uid())
        )
    )
  );

CREATE POLICY "issue_comments_update_delete_policy" ON public.issue_comments
  FOR ALL TO authenticated
  USING (
    actor_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.issues i
      JOIN public.projects p ON p.id = i.project_id
      WHERE i.id = issue_comments.issue_id
        AND p.founder_id = auth.uid()
    )
  );

ALTER TABLE public.issue_activities ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated users can access issue_activities" ON public.issue_activities;
DROP POLICY IF EXISTS "issue_activities_select_policy" ON public.issue_activities;
DROP POLICY IF EXISTS "issue_activities_insert_policy" ON public.issue_activities;

CREATE POLICY "issue_activities_select_policy" ON public.issue_activities
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.issues i
      JOIN public.projects p ON p.id = i.project_id
      WHERE i.id = issue_activities.issue_id
        AND (
          p.founder_id = auth.uid()
          OR public.is_workspace_member(p.workspace_id, auth.uid())
        )
    )
  );

CREATE POLICY "issue_activities_insert_policy" ON public.issue_activities
  FOR INSERT TO authenticated
  WITH CHECK (
    actor_id = auth.uid() OR actor_id IS NULL
  );

-- 9. ISSUES RLS (Fix arbitrary creation bypass)
DROP POLICY IF EXISTS "Workspace members can create and update issues" ON public.issues;
DROP POLICY IF EXISTS "issues_insert_policy" ON public.issues;
DROP POLICY IF EXISTS "issues_update_policy" ON public.issues;
DROP POLICY IF EXISTS "issues_delete_policy" ON public.issues;

CREATE POLICY "issues_insert_policy" ON public.issues
  FOR INSERT TO authenticated
  WITH CHECK (
    created_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = issues.project_id
        AND (
          p.founder_id = auth.uid()
          OR public.is_workspace_member(p.workspace_id, auth.uid())
          OR EXISTS (
            SELECT 1 FROM public.connections c 
            WHERE c.project_id = p.id AND (c.requester_id = auth.uid() OR c.recipient_id = auth.uid()) AND c.status = 'ACCEPTED'
          )
        )
    )
  );

CREATE POLICY "issues_update_policy" ON public.issues
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = issues.project_id
        AND (
          p.founder_id = auth.uid()
          OR issues.assignee_id = auth.uid()
          OR issues.created_by = auth.uid()
          OR public.is_workspace_member(p.workspace_id, auth.uid())
          OR EXISTS (
            SELECT 1 FROM public.connections c 
            WHERE c.project_id = p.id AND (c.requester_id = auth.uid() OR c.recipient_id = auth.uid()) AND c.status = 'ACCEPTED'
          )
        )
    )
  );

CREATE POLICY "issues_delete_policy" ON public.issues
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = issues.project_id
        AND (
          p.founder_id = auth.uid()
          OR issues.created_by = auth.uid()
          OR (
            public.is_workspace_member(p.workspace_id, auth.uid()) 
            AND EXISTS (
              SELECT 1 FROM public.workspace_members wm 
              WHERE wm.workspace_id = p.workspace_id AND wm.user_id = auth.uid() AND wm.role IN ('owner', 'admin')
            )
          )
        )
    )
  );

-- 10. CONCURRENCY-SAFE SEQUENCE ID GENERATOR (INN-1, INN-2...)
CREATE OR REPLACE FUNCTION public.set_issue_sequence_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.sequence_id IS NULL OR NEW.sequence_id = 0 THEN
    -- Serialize sequence allocation per project using transaction advisory lock
    PERFORM pg_advisory_xact_lock(hashtext(NEW.project_id::text));

    SELECT COALESCE(MAX(sequence_id), 0) + 1
    INTO NEW.sequence_id
    FROM public.issues
    WHERE project_id = NEW.project_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
