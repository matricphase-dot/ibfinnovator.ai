# Phase 4: Real-time Team Chat (Mattermost Codebase Extraction & Refactor)
> **Status:** Planning · Ponytail Strict: Extract battle-tested UI/UX from Mattermost, wire directly to Supabase Realtime  
> **Source:** [https://github.com/mattermost/mattermost](https://github.com/mattermost/mattermost) (`webapp/channels/src/components/`)  
> **Strategy:** Take Mattermost's production-grade Slack-like UI components (Channel Sidebar, Message List, Post Header/Body, Hover Action Toolbar, Thread RHS/Drawer, Emoji Reactions) and adapt them to run inside our Next.js + Supabase Realtime stack without Golang backend bloat or Redux complexity.

---

## 1. What We Extract from `mattermost/mattermost`

Mattermost has over 8 years of enterprise-tested Slack-like interface engineering. We port and refactor specific components into `src/components/chat/`:

| Mattermost Component Path (`webapp/channels/`) | Refactored Innovators.ai Path | What it Provides | Adaptation / Refactor Needed |
|---|---|---|---|
| `components/sidebar/` | `src/components/chat/sidebar/` | Channels sidebar, unread badge counters, direct message list, user status indicators | Replace Redux selectors with Supabase channel memberships |
| `components/post_view/post/` | `src/components/chat/post/` | Individual message item, author avatar, timestamp, markdown body, edit status | Connect to `public.messages` schema |
| `components/post_view/post_actions/` | `src/components/chat/post-actions.tsx` | Hover toolbar: Quick reaction, reply in thread, copy link, edit/delete options | Pure Tailwind / Radix popover |
| `components/rhs_thread/` | `src/components/chat/thread-drawer.tsx` | Collapsed Reply Thread (Right-Hand Sidebar) for deep threaded discussions | Connect to `parent_id` message queries |
| `components/create_post/` | `src/components/chat/chat-input.tsx` | Rich keyboard-first message composer, Shift+Enter for newlines, attachment dropzone | Wire to Supabase Storage + `POST /api/chat/messages` |
| `components/reaction/` | `src/components/chat/reactions.tsx` | Message reaction pills with counter badges and user reaction toggles | Optimistic toggle via Supabase Realtime |

---

## 2. Refactoring Process & Architecture (Golang/Redux -> Supabase Realtime)

Mattermost runs on a heavy Golang backend with complex WebSockets and large Redux stores (`mattermost-redux`). We eliminate that entire backend footprint:

```
[ Mattermost Original Stack ]
Mattermost Webapp React ---> Redux / Redux Saga ---> Golang Backend Engine ---> PostgreSQL / MySQL
                                               (Go WebSocket Server)

[ Innovators.ai Refactored Stack ]
Mattermost UI Components ---> Lightweight React Hooks ---> Supabase Client (WS) ---> Supabase PostgreSQL
                                                     (Native Realtime)
```

### Key Refactor Steps:
1. **Strip Redux / Redux Saga:** Replace hundreds of Redux action files with simple React Server Actions and Supabase's native `supabase.channel()` listener.
2. **Preserve Mattermost Layout & Feel:**
   - Left sidebar with `# channels` and direct messages.
   - Central message timeline with smooth infinite scrolling and date separators.
   - Right-Hand Sidebar (RHS) for Thread replies that slides in cleanly on desktop and stacks on mobile.
3. **Connect to Supabase Schema:**
   - Map `Post.id` directly to `messages.id`.
   - Map `Post.root_id` to `messages.parent_id` for threads.
   - Map `Post.message` to `messages.content`.
   - Real-time broadcasts via PostgreSQL replication (`postgres_changes` on `messages`).

---

## 3. Detailed Component Plan

### 3.1 Main Workspace Chat Layout (`src/app/chat/[channelId]/page.tsx`)
- Three-pane responsive layout:
  1. **Workspace Navigation:** Quick toggle between Project Management (Plane) and Team Chat (Mattermost).
  2. **Channel Sidebar:** Public `#` channels, private lock channels, Direct Messages with online presence dot.
  3. **Message Feed & Composer:** Mattermost `PostList` + `CreatePost` with real-time updates in <50ms.
  4. **Thread Drawer (Collapsible):** Opens alongside message list without displacing the channel view.

### 3.2 Optimistic Realtime Messaging Flow
1. User hits Enter in `ChatInput`.
2. Temporary message added to local UI state immediately (`status: 'sending'`).
3. Payload sent via `supabase.from('messages').insert(...)`.
4. Supabase broadcast confirms insert and replaces temporary ID with confirmed UUID (`status: 'sent'`).
5. All other active channel members receive WebSocket payload and append message instantly.

---

## 4. Verification & Gate Checks
- Test real-time message delivery across two browser sessions.
- Verify thread replies update reply counters on the parent message in real-time.
- Confirm zero lingering dependencies on Golang/Mattermost Redux libraries.
- Pass `npm run typecheck` and `npm run build` with clean bundle sizes.
