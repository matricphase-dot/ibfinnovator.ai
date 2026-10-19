-- ==============================================================================
-- PHASE 4: REAL-TIME TEAM CHAT (MATTERMOST CODEBASE EXTRACTION & REFACTOR)
-- 1. Helper Function: can_access_channel
-- 2. Upgrade Function: can_read_message
-- 3. Comprehensive RLS for messages, channels, channel_members
-- 4. Supabase Realtime Publication additions
-- ==============================================================================

-- 1. FUNCTION: can_access_channel
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
        c.is_private = false
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

-- 2. UPGRADE FUNCTION: can_read_message
CREATE OR REPLACE FUNCTION public.can_read_message(target_message uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO ''
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.messages m
    WHERE m.id = target_message
      AND (
        m.room_type = 'GENERAL'
        OR auth.uid() IN (m.sender_id, m.recipient_id)
        OR (m.room_type = 'TEAM' AND public.can_access_team_room(m.room_id))
        OR (m.channel_id IS NOT NULL AND public.can_access_channel(m.channel_id))
      )
  );
$function$;

-- 3. POLICIES: messages
DROP POLICY IF EXISTS "messages read access" ON public.messages;
CREATE POLICY "messages read access" ON public.messages FOR SELECT TO authenticated
USING (
  (room_type = 'GENERAL')
  OR (auth.uid() IN (sender_id, recipient_id))
  OR (room_type = 'TEAM' AND public.can_access_team_room(room_id))
  OR (channel_id IS NOT NULL AND public.can_access_channel(channel_id))
);

DROP POLICY IF EXISTS "messages send access" ON public.messages;
CREATE POLICY "messages send access" ON public.messages FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = sender_id
  AND (
    (room_type = 'GENERAL')
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
  OR (channel_id IS NOT NULL AND sender_id = auth.uid())
);

-- 4. POLICIES: channels
ALTER TABLE public.channels ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Channel visibility policy" ON public.channels;
CREATE POLICY "Channel visibility policy" ON public.channels FOR SELECT TO authenticated
USING (
  (is_private = false)
  OR created_by = auth.uid()
  OR EXISTS (SELECT 1 FROM public.channel_members WHERE channel_id = channels.id AND user_id = auth.uid())
  OR EXISTS (SELECT 1 FROM public.workspaces WHERE id = channels.workspace_id AND owner_id = auth.uid())
);

DROP POLICY IF EXISTS "Channel create policy" ON public.channels;
CREATE POLICY "Channel create policy" ON public.channels FOR INSERT TO authenticated
WITH CHECK (
  created_by = auth.uid()
  AND (
    EXISTS (SELECT 1 FROM public.workspaces WHERE id = workspace_id AND owner_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.workspace_members WHERE workspace_id = channels.workspace_id AND user_id = auth.uid())
  )
);

DROP POLICY IF EXISTS "Channel update policy" ON public.channels;
CREATE POLICY "Channel update policy" ON public.channels FOR UPDATE TO authenticated
USING (
  created_by = auth.uid()
  OR EXISTS (SELECT 1 FROM public.workspaces WHERE id = channels.workspace_id AND owner_id = auth.uid())
);

DROP POLICY IF EXISTS "Channel delete policy" ON public.channels;
CREATE POLICY "Channel delete policy" ON public.channels FOR DELETE TO authenticated
USING (
  created_by = auth.uid()
  OR EXISTS (SELECT 1 FROM public.workspaces WHERE id = channels.workspace_id AND owner_id = auth.uid())
);

-- 5. POLICIES: channel_members
ALTER TABLE public.channel_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Channel members view policy" ON public.channel_members;
CREATE POLICY "Channel members view policy" ON public.channel_members FOR SELECT TO authenticated
USING (
  user_id = auth.uid()
  OR public.can_access_channel(channel_id)
);

DROP POLICY IF EXISTS "Channel members join policy" ON public.channel_members;
CREATE POLICY "Channel members join policy" ON public.channel_members FOR INSERT TO authenticated
WITH CHECK (
  user_id = auth.uid()
  OR EXISTS (SELECT 1 FROM public.channels WHERE id = channel_id AND created_by = auth.uid())
);

DROP POLICY IF EXISTS "Channel members leave policy" ON public.channel_members;
CREATE POLICY "Channel members leave policy" ON public.channel_members FOR DELETE TO authenticated
USING (
  user_id = auth.uid()
  OR EXISTS (SELECT 1 FROM public.channels WHERE id = channel_id AND created_by = auth.uid())
);

-- 6. REALTIME PUBLICATION: channels & channel_members
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'channels'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.channels;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'channel_members'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.channel_members;
  END IF;
END $$;
