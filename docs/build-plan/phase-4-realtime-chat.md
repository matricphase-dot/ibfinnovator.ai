# Phase 4: Real-time Team Chat (Mattermost Codebase Extraction & IBF Plane Integration)

> **Platform Target**: `app.innovators-global.com`  
> **Source Baseline**: [mattermost/mattermost](https://github.com/mattermost/mattermost) (`webapp/channels/src/components/`)  
> **Integration Target**: IBF Plane Project Management Engine (`components/ibf/`, `app/projects/[id]`, `app/chat/`)  
> **Backend Architecture**: Next.js 15 App Router + Supabase PostgreSQL + Supabase Realtime (WebSockets) + Supabase Storage  
> **Aesthetic Philosophy**: Dark Precision Canvas (`#080c14`, `#0d121f`), Hairline Borders (`rgba(255,255,255,0.06)`), Plane Cyan Accent (`#00f5d4`), Slack/Mattermost High-Density Layout  
> **Status**: Comprehensive Production Root Build Plan (Zero Placeholders · Zero Patchwork)

---

## Executive Summary & Architectural Philosophy

The objective of **Phase 4** is to integrate enterprise-grade, Slack-like real-time team communication directly into the **IBF Plane Engine** project management platform. 

Instead of building a simplistic chat widget or relying on third-party SaaS iframes, we extract the battle-tested UI/UX architecture from **Mattermost** (the premier open-source Slack alternative with over 8 years of production refinement) and refactor it into modern React Server Components and client hooks running natively on **Supabase Realtime WebSockets** and **PostgreSQL**.

### The Core Architectural Transition: Mattermost Redux/Golang to IBF Supabase

Mattermost's original webapp is tightly coupled to a heavyweight Golang server backend, a custom WebSocket RPC protocol, and legacy `mattermost-redux` stores with Redux Saga middleware. We completely eliminate that backend complexity while preserving 100% of Mattermost's ergonomic layout, spatial hierarchy, keyboard interactions, and UI polish:

```
[ Mattermost Original Architecture ]
Mattermost Webapp (React) ──> Redux / Redux Saga ──> Golang Server Engine ──> PostgreSQL / MySQL
                                                    (Custom WS RPC Server)

[ IBF Production Architecture ]
Mattermost Clean UI (React) ──> Lightweight React Hooks ──> Next.js 15 App Router ──> Supabase PostgreSQL
                               (Zustand / SWR)                    │                        │
                                     ▲                            │                        │
                                     └────── Supabase Realtime WS ┴────────────────────────┘
                                            (Postgres Changes + Presence)
```

### Key Integration Principles with IBF Plane Engine:
1. **Unified Workspace Shell**: Team chat lives inside the same layout system as Plane issue boards, sprint cycles, and docs, allowing seamless toggling or side-by-side split view.
2. **Project-to-Channel Synchronization**: Every Plane project automatically provisions a dedicated `#proj-[identifier]` channel (e.g. `#proj-inn`), bridging issue tracking with synchronous team collaboration.
3. **Plane Issue Unfurling**: Mentioning an issue (`#IBF-101` or pasting an issue URL) automatically renders a live interactive Plane issue badge displaying status color, priority flag, and assignee, with 1-click access to open the 720px Side-Peek `IssueDrawer`.
4. **Convert Message to Plane Issue**: The Mattermost hover action toolbar includes a 1-click action to create a Plane issue directly from any message, populating the title, description, attachments, and message permalink.
5. **Zero AI-Slop & Zero Placeholders**: Every button, input, popover, attachment preview, and reaction pill connects to live PostgreSQL schema, authenticated API routes, and real-time WebSocket subscriptions.

---

## 1. Complete File & Directory Architecture

All chat components, API routes, and database migrations follow a structured, modular hierarchy:

```
innovators.ai/
├── supabase/
│   └── migrations/
│       ├── 20261016000000_core_mvp_schema.sql         # Base channels and messages tables
│       ├── 20261019000000_phase_4_chat_channels.sql   # RLS policies & Realtime publication
│       └── 20261023000000_mattermost_chat_engine.sql  # Complete Mattermost feature parity schema
│
├── app/
│   ├── chat/
│   │   ├── page.tsx                                   # Workspace default chat redirect / landing
│   │   ├── [channelId]/
│   │   │   └── page.tsx                               # Active channel feed & thread container
│   │   ├── direct/
│   │   │   └── [peerId]/
│   │   │       └── page.tsx                           # 1:1 Direct message conversation route
│   │   └── layout.tsx                                 # Chat layout with persistent sidebar
│   │
│   └── api/
│       └── chat/
│           ├── channels/
│           │   ├── route.ts                           # GET (list channels), POST (create channel)
│           │   └── [channelId]/
│           │       ├── route.ts                       # GET (details), PATCH (update), DELETE
│           │       ├── messages/
│           │       │   └── route.ts                   # GET (paginated messages), POST (send message)
│           │       ├── members/
│           │       │   └── route.ts                   # GET (members), POST (add), DELETE (leave)
│           │       └── read/
│           │           └── route.ts                   # POST (mark channel as read)
│           │
│           ├── messages/
│           │   └── [messageId]/
│           │       ├── route.ts                       # PATCH (edit message), DELETE (soft delete)
│           │       ├── react/
│           │       │   └── route.ts                   # POST (toggle emoji reaction)
│           │       └── pin/
│           │           └── route.ts                   # POST (toggle message pin)
│           │
│           ├── threads/
│           │   └── [messageId]/
│           │       └── route.ts                       # GET (thread replies), POST (send reply)
│           │
│           ├── direct/
│           │   └── route.ts                           # GET (list DM peers), POST (start DM)
│           │
│           ├── search/
│           │   └── route.ts                           # GET (full-text search across accessible posts)
│           │
│           └── upload/
│               └── route.ts                           # POST (presigned upload URLs for attachments)
│
├── components/
│   └── chat/
│       ├── chat-workspace.tsx                         # Master orchestrator component
│       │
│       ├── sidebar/
│       │   ├── channel-sidebar.tsx                    # Mattermost channel navigator & DM list
│       │   ├── channel-category-group.tsx             # Collapsible "CHANNELS", "DIRECT MESSAGES"
│       │   ├── channel-sidebar-item.tsx               # High-density item with unread badge & status dot
│       │   ├── channel-create-modal.tsx               # Public/Private/Project channel creation dialog
│       │   └── channel-quick-switcher.tsx             # Quick channel jump palette (Cmd+K)
│       │
│       ├── header/
│       │   ├── channel-header.tsx                     # Topbar with title, topic, member count, search
│       │   ├── channel-members-popover.tsx            # Active members roster with role badges
│       │   └── channel-pinned-modal.tsx               # Pinned messages view drawer
│       │
│       ├── feed/
│       │   ├── message-timeline.tsx                   # Virtualized message list with date separators
│       │   ├── date-divider.tsx                       # "Today", "Yesterday", "October 22, 2026" line
│       │   ├── new-messages-divider.tsx               # Red/Cyan "--- NEW MESSAGES ---" unread marker
│       │   └── empty-channel-view.tsx                 # Onboarding state for newly created channels
│       │
│       ├── post/
│       │   ├── message-item.tsx                       # Individual post with avatar, markdown, attachments
│       │   ├── message-compact-item.tsx               # Compact mode (consecutive messages within 5m)
│       │   ├── post-actions.tsx                       # Floating hover toolbar (reactions, thread, pin, etc.)
│       │   ├── reactions.tsx                          # Interactive reaction badge pills & user list tooltip
│       │   ├── plane-issue-embed.tsx                  # Interactive #IBF-123 issue preview card in chat
│       │   └── attachment-preview.tsx                 # Image grid, PDF viewer, and downloadable file badge
│       │
│       ├── composer/
│       │   ├── chat-input.tsx                         # Auto-expanding rich keyboard composer
│       │   ├── formatting-toolbar.tsx                 # Markdown toolbar (B, I, Code, Quote, List, Link)
│       │   ├── mention-autocomplete.tsx               # @member mention trigger popover
│       │   ├── issue-autocomplete.tsx                 # #issue Plane issue tag trigger popover
│       │   ├── emoji-picker-popover.tsx               # Categorized emoji selector with search
│       │   └── attachment-dropzone.tsx                # Drag-and-drop file upload target with progress
│       │
│       └── rhs/
│           ├── thread-drawer.tsx                      # 440px Right-Hand Sidebar (RHS) for thread replies
│           ├── thread-header.tsx                      # Thread title, parent context, close trigger
│           └── pinned-messages-drawer.tsx             # Pinned messages panel
│
└── lib/
    └── chat/
        ├── types.ts                                   # TypeScript interfaces for chat domain
        ├── format-message.ts                          # Markdown parser & issue tag regex matcher
        ├── use-chat-realtime.ts                       # Supabase Realtime channel subscription hook
        ├── use-chat-messages.ts                       # SWR/Zustand message feed manager
        ├── use-chat-typing.ts                         # Broadcast typing indicator hook
        └── use-chat-presence.ts                       # Global user online/away status tracker
```

---

## 2. Phase 4.1: Database Schema, Storage, Indexes & Realtime Publications

The database foundation requires zero gaps. It models workspace channels, project-linked channels, 1:1 direct message rooms, message revisions, reactions, pinned messages, and read receipts.

### 2.1 Complete PostgreSQL DDL (`20261023000000_mattermost_chat_engine.sql`)

```sql
-- ==============================================================================
-- IBF PLANE ENGINE + MATTERMOST REAL-TIME CHAT SUBSYSTEM
-- ==============================================================================

-- 1. CHANNELS TABLE
CREATE TABLE IF NOT EXISTS public.channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  display_name TEXT,
  description TEXT,
  is_private BOOLEAN NOT NULL DEFAULT false,
  is_archived BOOLEAN NOT NULL DEFAULT false,
  channel_type TEXT NOT NULL DEFAULT 'STANDARD' CHECK (channel_type IN ('STANDARD', 'PROJECT', 'ANNOUNCEMENT', 'DIRECT')),
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_post_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  total_msg_count INTEGER NOT NULL DEFAULT 0,
  UNIQUE (workspace_id, name)
);

-- 2. CHANNEL MEMBERS TABLE
CREATE TABLE IF NOT EXISTS public.channel_members (
  channel_id UUID NOT NULL REFERENCES public.channels(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'MEMBER' CHECK (role IN ('ADMIN', 'MODERATOR', 'MEMBER')),
  last_read_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_viewed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  msg_count_at_read INTEGER NOT NULL DEFAULT 0,
  mention_count INTEGER NOT NULL DEFAULT 0,
  notify_props JSONB NOT NULL DEFAULT '{"desktop": "all", "push": "mention", "mark_unread": "all"}'::jsonb,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (channel_id, user_id)
);

-- 3. UPGRADE MESSAGES TABLE (Complete Mattermost Parity)
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID REFERENCES public.channels(id) ON DELETE CASCADE,
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  recipient_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES public.messages(id) ON DELETE CASCADE,
  root_id UUID REFERENCES public.messages(id) ON DELETE CASCADE,
  room_type TEXT NOT NULL DEFAULT 'CHANNEL' CHECK (room_type IN ('CHANNEL', 'DIRECT', 'GENERAL', 'TEAM')),
  room_id UUID,
  content TEXT NOT NULL CHECK (char_length(content) BETWEEN 1 AND 10000),
  attachments JSONB NOT NULL DEFAULT '[]'::jsonb,
  props JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_pinned BOOLEAN NOT NULL DEFAULT false,
  reply_count INTEGER NOT NULL DEFAULT 0,
  last_reply_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  edited_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ
);

-- 4. MESSAGE REACTIONS TABLE
CREATE TABLE IF NOT EXISTS public.message_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  emoji TEXT NOT NULL CHECK (char_length(emoji) BETWEEN 1 AND 64),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (message_id, user_id, emoji)
);

-- 5. MESSAGE EDITS AUDIT TABLE
CREATE TABLE IF NOT EXISTS public.message_edits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  editor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  previous_content TEXT NOT NULL,
  edited_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. MESSAGE PINS TABLE
CREATE TABLE IF NOT EXISTS public.message_pins (
  channel_id UUID NOT NULL REFERENCES public.channels(id) ON DELETE CASCADE,
  message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  pinned_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  pinned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (channel_id, message_id)
);

-- ==============================================================================
-- INDEXES FOR SUB-10MS REALTIME QUERY LATENCY
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_channels_workspace ON public.channels(workspace_id, is_archived);
CREATE INDEX IF NOT EXISTS idx_channels_project ON public.channels(project_id) WHERE project_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_channel_members_user ON public.channel_members(user_id, last_read_at);
CREATE INDEX IF NOT EXISTS idx_messages_channel_feed ON public.messages(channel_id, created_at DESC) WHERE parent_id IS NULL AND deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_messages_thread_replies ON public.messages(parent_id, created_at ASC) WHERE parent_id IS NOT NULL AND deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_messages_sender ON public.messages(sender_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reactions_message ON public.message_reactions(message_id);
CREATE INDEX IF NOT EXISTS idx_pins_channel ON public.message_pins(channel_id, pinned_at DESC);

-- GIN Index for Full-Text Search across message content
CREATE INDEX IF NOT EXISTS idx_messages_search ON public.messages USING gin(to_tsvector('english', content));

-- ==============================================================================
-- DATABASE TRIGGERS & PROCEDURES
-- ==============================================================================

-- Trigger: Automatically maintain reply_count and last_reply_at on parent message
CREATE OR REPLACE FUNCTION public.handle_message_thread_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.parent_id IS NOT NULL THEN
    UPDATE public.messages
    SET 
      reply_count = reply_count + 1,
      last_reply_at = NEW.created_at,
      updated_at = NOW()
    WHERE id = NEW.parent_id;

    -- Also update channel last_post_at
    UPDATE public.channels
    SET 
      last_post_at = NEW.created_at,
      total_msg_count = total_msg_count + 1
    WHERE id = NEW.channel_id;

  ELSIF TG_OP = 'INSERT' AND NEW.channel_id IS NOT NULL THEN
    -- Root message: Update channel last_post_at and count
    UPDATE public.channels
    SET 
      last_post_at = NEW.created_at,
      total_msg_count = total_msg_count + 1
    WHERE id = NEW.channel_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_message_thread_stats ON public.messages;
CREATE TRIGGER trigger_message_thread_stats
  AFTER INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_message_thread_stats();

-- Trigger: Automatically sync message_pins with messages.is_pinned boolean
CREATE OR REPLACE FUNCTION public.sync_message_pinned_status()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.messages SET is_pinned = true WHERE id = NEW.message_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.messages SET is_pinned = false WHERE id = OLD.message_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_sync_message_pins ON public.message_pins;
CREATE TRIGGER trigger_sync_message_pins
  AFTER INSERT OR DELETE ON public.message_pins
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_message_pinned_status();

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

-- 1. Helper function: Can user access channel
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

-- Enable RLS
ALTER TABLE public.channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.channel_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_pins ENABLE ROW LEVEL SECURITY;

-- Channels Policies
DROP POLICY IF EXISTS "channels_select" ON public.channels;
CREATE POLICY "channels_select" ON public.channels FOR SELECT TO authenticated
USING (public.can_access_channel(id));

DROP POLICY IF EXISTS "channels_insert" ON public.channels;
CREATE POLICY "channels_insert" ON public.channels FOR INSERT TO authenticated
WITH CHECK (
  created_by = auth.uid()
  AND (
    EXISTS (SELECT 1 FROM public.workspaces WHERE id = workspace_id AND owner_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.workspace_members WHERE workspace_id = channels.workspace_id AND user_id = auth.uid())
  )
);

-- Messages Policies
DROP POLICY IF EXISTS "messages_select" ON public.messages;
CREATE POLICY "messages_select" ON public.messages FOR SELECT TO authenticated
USING (
  (room_type = 'GENERAL')
  OR (auth.uid() IN (sender_id, recipient_id))
  OR (channel_id IS NOT NULL AND public.can_access_channel(channel_id))
);

DROP POLICY IF EXISTS "messages_insert" ON public.messages;
CREATE POLICY "messages_insert" ON public.messages FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = sender_id
  AND (
    (room_type = 'GENERAL')
    OR (room_type = 'DIRECT' AND recipient_id IS NOT NULL)
    OR (channel_id IS NOT NULL AND public.can_access_channel(channel_id))
  )
);

DROP POLICY IF EXISTS "messages_update" ON public.messages;
CREATE POLICY "messages_update" ON public.messages FOR UPDATE TO authenticated
USING (sender_id = auth.uid());

-- Reactions Policies
DROP POLICY IF EXISTS "reactions_select" ON public.message_reactions;
CREATE POLICY "reactions_select" ON public.message_reactions FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.messages m WHERE m.id = message_id AND public.can_access_channel(m.channel_id)));

DROP POLICY IF EXISTS "reactions_insert" ON public.message_reactions;
CREATE POLICY "reactions_insert" ON public.message_reactions FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "reactions_delete" ON public.message_reactions;
CREATE POLICY "reactions_delete" ON public.message_reactions FOR DELETE TO authenticated
USING (auth.uid() = user_id);

-- ==============================================================================
-- SUPABASE REALTIME REPLICATION CONFIGURATION
-- ==============================================================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'channels') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.channels;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'channel_members') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.channel_members;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'messages') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'message_reactions') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.message_reactions;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'message_pins') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.message_pins;
  END IF;
END $$;
```

### 2.2 Supabase Storage Configuration for Attachments

Chat files (images, documents, PDFs, zip archives) are stored in a dedicated Supabase Storage bucket:
- **Bucket Name**: `chat-attachments`
- **Public Visibility**: `false` (authenticated access only via signed URLs or RLS download policy)
- **Size Limit**: 25 MB per file
- **MIME Whitelist**: `image/*`, `application/pdf`, `text/plain`, `application/zip`, `text/markdown`, `application/json`
- **Storage Path Pattern**: `{workspace_id}/{channel_id}/{year}/{month}/{uuid}_{filename}`

---

## 3. Phase 4.2: REST API Contracts & Realtime WebSocket Event Protocol

Every API route is implemented with strict Zod schema validation, session authentication, proper HTTP status codes, and error responses.

### 3.1 REST Endpoints Specification

| Method | Endpoint | Description | Request Body / Query Params | Response JSON |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/chat/channels` | List all accessible channels and DM threads for current workspace | `?workspaceId=<uuid>` | `{ workspace: {...}, channels: Channel[], direct_messages: DirectPeer[] }` |
| `POST` | `/api/chat/channels` | Create a new channel (standard or project-linked) | `{ name: string, description?: string, is_private: boolean, project_id?: string }` | `{ channel: Channel }` (201 Created) |
| `GET` | `/api/chat/channels/[channelId]` | Fetch channel metadata, member count, and topic | None | `{ channel: Channel, members: Member[] }` |
| `PATCH` | `/api/chat/channels/[channelId]` | Update channel name, topic, or archive status | `{ name?: string, description?: string, is_archived?: boolean }` | `{ channel: Channel }` |
| `GET` | `/api/chat/channels/[channelId]/messages` | Cursor-paginated channel message stream | `?cursor=<timestamptz>&limit=50` | `{ messages: MessageData[], next_cursor: string | null }` |
| `POST` | `/api/chat/channels/[channelId]/messages` | Post a new root message to channel | `{ content: string, attachments?: string[], props?: object }` | `{ message: MessageData }` |
| `PATCH` | `/api/chat/messages/[messageId]` | Edit message content (author only) | `{ content: string }` | `{ message: MessageData }` |
| `DELETE` | `/api/chat/messages/[messageId]` | Soft-delete message (`deleted_at = NOW()`) | None | `{ success: true, messageId: string }` |
| `POST` | `/api/chat/messages/[messageId]/react` | Idempotent emoji reaction toggle | `{ emoji: string }` | `{ emoji: string, count: number, active: boolean }` |
| `POST` | `/api/chat/messages/[messageId]/pin` | Toggle pinned state for message | None | `{ is_pinned: boolean }` |
| `GET` | `/api/chat/threads/[messageId]` | Fetch root message and chronological replies | None | `{ root: MessageData, replies: MessageData[] }` |
| `POST` | `/api/chat/threads/[messageId]` | Post reply to an existing thread | `{ content: string, attachments?: string[] }` | `{ reply: MessageData }` |
| `POST` | `/api/chat/channels/[channelId]/read` | Mark channel as read (updates unread count) | None | `{ success: true, last_read_at: string }` |
| `GET` | `/api/chat/direct` | List 1:1 direct conversation partners | None | `{ peers: DirectMessagePeer[] }` |
| `POST` | `/api/chat/direct` | Start or open 1:1 DM channel with a user | `{ peerId: string }` | `{ channelId: string }` |
| `GET` | `/api/chat/search` | Search message content with highlighting | `?q=<term>&channelId=<uuid?>` | `{ results: MessageSearchResult[] }` |

### 3.2 Realtime WebSocket Event Protocol

All clients subscribe to Supabase Realtime channels scoped to active channels and workspaces:

```typescript
// Channel Event Subscription
const channelRoom = supabase.channel(`chat-channel-${channelId}`, {
  config: { broadcast: { self: false }, presence: { key: currentUserId } }
});

channelRoom
  // 1. Root messages & thread replies
  .on("postgres_changes", {
    event: "INSERT",
    schema: "public",
    table: "messages",
    filter: `channel_id=eq.${channelId}`
  }, handleNewMessage)

  // 2. Message edits & soft-deletes
  .on("postgres_changes", {
    event: "UPDATE",
    schema: "public",
    table: "messages",
    filter: `channel_id=eq.${channelId}`
  }, handleMessageUpdate)

  // 3. Emoji reactions
  .on("postgres_changes", {
    event: "*",
    schema: "public",
    table: "message_reactions"
  }, handleReactionChange)

  // 4. Ephemeral typing indicators (sub-50ms latency via broadcast)
  .on("broadcast", { event: "typing" }, handleTypingEvent)

  // 5. User online presence tracking
  .on("presence", { event: "sync" }, handlePresenceSync)
  .subscribe();
```

---

## 4. Phase 4.3: Mattermost UI Architecture & Component Extraction

We map Mattermost's production UI components (`mattermost/mattermost/webapp/channels/src/components`) directly to IBF React components styled with Tailwind CSS and Plane tokens.

### 4.1 Component Mapping Matrix

| Mattermost Original Path | Refactored IBF Path | Feature Set Extracted | Refactoring & Enhancements |
| :--- | :--- | :--- | :--- |
| `components/sidebar/` | `components/chat/sidebar/channel-sidebar.tsx` | Channel list, category headers, unread counts, DM list, presence dots | Replaced Redux selectors with SWR/Supabase Realtime state. Added Plane project channel groups. |
| `components/channel_header/` | `components/chat/header/channel-header.tsx` | Channel name, topic, member count button, search trigger | Added quick jump link to associated Plane Project Space. |
| `components/post_view/post/` | `components/chat/post/message-item.tsx` | Post avatar, author, timestamp, markdown body, edit badge | Integrated `#IBF-123` issue unfurling badge. Added compact grouping for consecutive posts. |
| `components/post_view/post_actions/` | `components/chat/post/post-actions.tsx` | Hover toolbar: reactions, thread reply, copy link, edit/delete | Added "Create Plane Issue from Message" 1-click action. |
| `components/reaction/` | `components/chat/post/reactions.tsx` | Reaction pill badges, user tooltip, emoji toggle | Optimistic toggle with sub-10ms UI update. |
| `components/create_post/` | `components/chat/composer/chat-input.tsx` | Auto-expanding textarea, Markdown shortcuts, drag-drop attachments | Added `@member` and `#issue` autocomplete popovers. |
| `components/rhs_thread/` | `components/chat/rhs/thread-drawer.tsx` | Right-Hand Sidebar (RHS) for threaded conversations | Sliding drawer with backdrop overlay on mobile, side-by-side on desktop. |

### 4.2 Mattermost Spatial Geometry & Visual Design Tokens

```css
/* IBF Plane + Mattermost Unified Canvas Tokens */
--chat-canvas:             #080c14;  /* Deep black root background */
--chat-sidebar:            #0d121f;  /* Channel navigation rail */
--chat-channel-active:     #131f38;  /* Active channel selection background */
--chat-surface-hover:      #111a2e;  /* Message hover illumination */
--chat-border:             rgba(255, 255, 255, 0.06); /* Hairline dividers */
--chat-accent:             #00f5d4;  /* Plane cyan signature accent */
--chat-unread-badge:       #00f5d4;  /* Unread counter pill */
--chat-mention-bg:         rgba(0, 245, 212, 0.12); /* @user highlight background */
--chat-rhs-width:          440px;    /* Thread Right-Hand Sidebar width */
--chat-sidebar-width:      260px;    /* Channel sidebar standard width */
```

### 4.3 Detailed Component Specifications

#### A. Channel Sidebar (`channel-sidebar.tsx`)
- **Header**: Workspace name switcher, quick jump search bar (`Cmd+K`), channel create button (`+`).
- **Category Accordions**:
  - `FAVORITES`: Pinned channels for quick access.
  - `CHANNELS`: Public `#` and private lock channels with unread badges.
  - `PROJECT CHANNELS`: Dedicated `#proj-[identifier]` channels linked to Plane projects.
  - `DIRECT MESSAGES`: 1:1 and group DMs with live online/offline green presence indicator.
- **Micro-Interactions**: Hover illumination, active indicator border on the left edge (`2px solid #00f5d4`), keyboard arrow navigation.

#### B. Message Timeline Feed (`message-timeline.tsx`)
- **Date Separators**: Clean date dividers (`Today`, `Yesterday`, `Tuesday, October 21`) that stick to the top during scrolling.
- **Unread Marker**: High-contrast horizontal rule (`--- NEW MESSAGES ---`) marking the first unread message when opening a channel.
- **Consecutive Message Compaction**: If the same author posts multiple messages within 5 minutes, omit their avatar, author name, and timestamp, rendering a compact message row (saving 40% vertical space).
- **Reverse Infinite Scrolling**: Fetches older messages when the user scrolls within 200px of the top, maintaining exact scroll position without jumps.

#### C. Floating Post Action Toolbar (`post-actions.tsx`)
- Appears on hover over any message item (desktop) or long-press (touch devices).
- Actions:
  1. **Quick Reactions**: 4 one-click emojis (`👍`, `❤️`, `🚀`, `👀`) + emoji picker trigger.
  2. **Reply in Thread**: Opens 440px Right-Hand Sidebar (RHS) focused on this message.
  3. **Create Plane Issue**: Converts message text into a new Plane issue modal.
  4. **Pin Message**: Pins message to channel pinboard.
  5. **Copy Link**: Copies deep link (`/chat/[channelId]?msg=[id]`) to clipboard.
  6. **Edit / Delete**: Available if current user is the author or workspace admin.

#### D. Right-Hand Sidebar Thread Drawer (`thread-drawer.tsx`)
- Standard 440px desktop width, slides in smoothly without pushing or disrupting the main channel feed.
- Sticky parent message header showing original post, author, timestamp, and attachments.
- Chronological reply stream with real-time updates.
- Independent message composer at the bottom of the drawer.
- Dismissable via `Esc` key or close button.

#### E. Rich Keyboard Composer (`chat-input.tsx`)
- Auto-resizing textarea (from 44px up to 180px height).
- Keyboard shortcuts:
  - `Enter`: Send message.
  - `Shift + Enter`: Insert newline.
  - `Up Arrow` (in empty composer): Edit user's last posted message.
  - `@`: Opens member autocomplete popover.
  - `#`: Opens Plane issue search autocomplete popover.
- Formatting toolbar: Bold, Italic, Strikethrough, Code block, Blockquote, Bullet list, Numbered list, File attachment, Emoji picker.
- Drag-and-drop dropzone: Dragging files anywhere over the chat window highlights the drop zone with cyan dashed border.

---

## 5. Phase 4.4: Deep Plane Project Management Integration

The real power of IBF Team Chat is its seamless, bi-directional coupling with Plane project management.

### 5.1 Project-Linked Channels (`#proj-[identifier]`)
- When a user creates a new project in Plane (e.g. Project: "Foundry Core", Identifier: `FC`), the system automatically provisions an associated channel `#proj-fc`.
- Project channels are categorized under a dedicated `PROJECT CHANNELS` sidebar section.
- The channel header displays a direct shortcut button: **"Open Project Board"**, immediately navigating the user to `/projects/[id]/board`.

### 5.2 Interactive `#ISSUE-ID` Unfurling (`plane-issue-embed.tsx`)
When a user types `#INN-42` or pastes `https://app.innovators-global.com/projects/.../issues/...`, the message renderer detects the pattern and unfurls an interactive Plane issue card:

```
┌────────────────────────────────────────────────────────────────────────┐
│ [IBF-42] Refactor PostgreSQL RLS policies for real-time chat           │
│ State: In Progress ⬤   Priority: High ⚑   Assignee: @alex   Due: Oct 28 │
│ [Open Side-Peek Detail] ───────────────────────────────────────────────┤
└────────────────────────────────────────────────────────────────────────┘
```
- Clicking **"Open Side-Peek Detail"** opens the Plane 720px `IssueDrawer` right inside the chat view, allowing team members to update issue state, assignees, or subtasks without losing their chat context.

### 5.3 "Create Plane Issue from Message" Flow
1. User hovers over any message and clicks `···` -> **"Create Plane Issue"**.
2. An interactive `IssueModal` slides open pre-filled with:
   - **Title**: First 60 characters of the message.
   - **Description**: Full message content formatted in Markdown, plus a link back to the original chat message permalink.
   - **Attachments**: Any images or files attached to the chat message are automatically linked to the new issue.
   - **Project Selector**: Allows choosing which Plane project the issue belongs to.
3. Upon creation, a bot notification is automatically posted into the thread: *"Issue #IBF-105 created from this message by @username"*.

### 5.4 Unified Command Palette (`Cmd+K`)
Pressing `Cmd+K` opens the universal IBF command palette with dedicated sections:
- **Plane Issues**: Jump directly to any issue by identifier or title.
- **Plane Projects**: Navigate to any project board, list, or sprint.
- **Chat Channels**: Jump directly to `#general`, `#proj-fc`, or a direct message conversation.

---

## 6. Phase 4.5: State Management, Optimistic Updates & Offline Resilience

To achieve Slack/Mattermost-grade responsiveness (<50ms feedback), the client implements an optimistic state machine with offline recovery.

### 6.1 Optimistic Message Pipeline

```
[User Hits Enter]
       │
       ▼
1. Generate Local UUID (temp-id) & Append to UI (status: "sending")
       │
       ▼
2. Trigger Asynchronous POST /api/chat/channels/[channelId]/messages
       │
   ┌───┴───────────────────────────────────────┐
   ▼                                           ▼
[Success (201 Created)]                [Network Failure / Error]
   │                                           │
3. Replace temp-id with server UUID    3. Set status: "error"
4. Mark status: "sent"                 4. Show "Retry" & "Delete" buttons
                                       5. Keep in local IndexedDB queue
```

### 6.2 Preventing Duplicate Messages on WebSocket Broadcast
When a user sends a message, both the HTTP response and the Supabase Realtime `INSERT` broadcast return the new message. The `useChatMessages` hook deduplicates messages:
```typescript
function mergeMessage(existing: MessageData[], incoming: MessageData) {
  // If incoming message matches an optimistic temporary message
  const tempMatch = existing.findIndex(m => m.id === incoming.id || (m.status === 'sending' && m.content === incoming.content && m.sender_id === incoming.sender_id));
  if (tempMatch !== -1) {
    const copy = [...existing];
    copy[tempMatch] = { ...incoming, status: 'sent' };
    return copy;
  }
  // If already present, skip
  if (existing.some(m => m.id === incoming.id)) return existing;
  // Otherwise append
  return [...existing, incoming];
}
```

### 6.3 Reconnection Catch-Up Strategy
If the user's internet drops or their laptop closes, the WebSocket disconnects. Upon reconnection:
1. Client records `last_seen_message_timestamp`.
2. Sends a catch-up request: `GET /api/chat/channels/[channelId]/messages?since=${last_seen_timestamp}`.
3. Merges any missed messages into the timeline without reloading the page or causing UI flicker.

---

## 7. Phase 4.6: Security, Performance & Nginx WebSocket Cluster Tuning

### 7.1 Security & XSS Prevention
- All user-generated Markdown is parsed through a strict AST sanitizer preventing `<script>`, `<iframe>`, `javascript:`, or malicious HTML payloads.
- Message content is capped at 10,000 characters to prevent database bloat and memory denial-of-service.
- API rate limiting: 5 messages per second burst limit per user, enforced via in-memory token bucket.

### 7.2 Nginx WebSocket Reverse Proxy Configuration (EC2 Cluster)
To ensure reliable WebSocket connections with zero drops or buffer truncation, our EC2 Nginx configuration handles WebSockets with 128k proxy buffers and keepalive timeouts:

```nginx
# WebSocket Upstream Configuration in nginx-innovators.conf
location /_next/webpack-hmr {
    proxy_pass http://nextjs_cluster;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
}

# Supabase Realtime WebSocket Passthrough
location /realtime/v1/ {
    proxy_pass https://your-supabase-id.supabase.co/realtime/v1/;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "Upgrade";
    proxy_set_header Host your-supabase-id.supabase.co;
    proxy_read_timeout 86400s;
    proxy_send_timeout 86400s;
    proxy_buffering off;
}
```

---

## 8. Phase 4.7: Step-by-Step Production Execution Plan

Execution is organized into 5 sequential, deterministic steps:

```
[ Step 1: Database Migration ]
Run 20261023000000_mattermost_chat_engine.sql
Verify RLS policies, trigger functions, and supabase_realtime publication.
       │
       ▼
[ Step 2: REST API Routes Implementation ]
Build /api/chat/channels, messages, threads, reactions, pins, and direct messages.
Verify with unit and integration tests (validations, RLS, status codes).
       │
       ▼
[ Step 3: Mattermost UI Components Refactoring ]
Build ChannelSidebar, MessageTimeline, PostActions, Reactions, ChatInput, ThreadDrawer.
Apply Dark Precision design tokens (#080c14, #00f5d4).
       │
       ▼
[ Step 4: Plane Project Management Deep Integration ]
Wire #proj-[identifier] automatic channel creation.
Implement #ISSUE-ID unfurling and "Create Plane Issue from Message" action.
Add Chat shortcut to IbfProjectTree and IbfSidebar.
       │
       ▼
[ Step 5: Real-time Concurrency Audit & EC2 Production Deploy ]
Test multi-user real-time messaging, typing indicators, and thread drawer.
Execute clean build (npm run build) with 0 lint/type errors.
Deploy to EC2 production cluster (app.innovators-global.com).
```

---

## 9. Verification & Gate Checks

Before marking Phase 4 as complete, every single gate check must pass:

- [ ] **Realtime Delivery**: Messages sent from Browser A appear in Browser B in `<100ms` without page refresh.
- [ ] **Thread Integrity**: Replying in the Thread Drawer updates the parent message reply counter (`"1 reply"`) in real time across all clients.
- [ ] **Optimistic UI**: Messages render immediately upon hitting `Enter` with a subtle `"sending..."` indicator, transitioning to `"sent"` without UI flickering.
- [ ] **Emoji Reactions**: Toggling an emoji reaction updates the reaction pill count instantly and synchronizes via WebSockets.
- [ ] **Plane Issue Unfurling**: Typing `#IBF-101` in a message renders the interactive Plane issue card with live state and priority.
- [ ] **Message to Issue Creation**: Creating a Plane issue from the hover toolbar successfully creates the issue in the chosen project and attaches the message permalink.
- [ ] **Zero Memory Leaks**: Switching channels 20 times properly unbinds previous Supabase WebSocket subscriptions.
- [ ] **Mobile Responsiveness**: On viewports `<768px`, the channel sidebar collapses into a slide-over drawer, and the thread drawer takes full width.
- [ ] **Clean Production Build**: `npm run build` succeeds with zero errors, zero warnings, and clean bundle sizes.
