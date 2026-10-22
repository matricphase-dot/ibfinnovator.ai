# Innovators.ai — Production Root Fix Master Plan (20-Issue Elimination)
> **Standard:** Senior Staff Engineer / Strict Production-Grade Execution  
> **Status:** Phase-by-Phase Comprehensive Fix Blueprint  
> **Target Environment:** Multi-Tenant Real-World Production (`innovators-global.com` & `app.innovators-global.com`)  
> **Rule:** Deterministic, minimal necessary diffs, zero speculative bloat, fail-closed security.

---

## 1. Executive Roadmap Matrix

The 20 audit findings are categorized into 5 tightly coupled execution phases and 1 final verification phase. Every phase addresses specific security, data isolation, performance, and UI/UX blockers, with verifiable acceptance gates:

| Phase | Core Focus | Issues Addressed | Primary Targets |
|---|---|---|---|
| **Phase 1** | **Database Security, Column Privileges & RLS Tenant Isolation** | Issues 1, 3, 4, 5, 7, 8, 17 | Supabase SQL migrations, RLS policies, `check-schema-contract.mjs`, trigger concurrency |
| **Phase 2** | **Multi-Domain Routing, Subdomain Auth & SEO Protection** | Issues 2, 6, 10, 18 | `middleware.ts`, `lib/workspace.ts`, `lib/auth/domain.ts`, `nginx/innovators.conf`, `sitemap.ts` |
| **Phase 3** | **Workspace Architecture, Navigation Shell & Dashboard Realignment** | Issues 9, 15, 16 | `app/dashboard/page.tsx`, `app/api/workspace/route.ts`, `app/api/analytics/founder/route.ts` |
| **Phase 4** | **Real-Time Chat Normalization & WebSocket Isolation** | Issues 11, 12, 14 | `components/chat/chat-workspace.tsx`, `lib/realtime/use-project-realtime.ts`, `app/api/chat/channels/*` |
| **Phase 5** | **Editor State Rubberbanding, Markdown Parser & Cluster Concurrency** | Issues 13, 19, 20 | `components/ibf/pages/page-editor.tsx`, `lib/rate-limit.ts`, `ecosystem.config.cjs` |
| **Phase 6** | **Master Verification, Contract Check, Build & Schema Reconciliation** | All 20 Issues | `npm run db:check`, `npm run typecheck`, `npm run build`, `PRODUCTION_SETUP_ROOT.sql` |

---

## Phase 1: Database Security, Column Privileges & RLS Tenant Isolation

### Objective
Eliminate cross-tenant data leaks, repair Postgres column-level security errors (`full_name`), secure RLS policies against unauthorized reads/writes/deletions, and serialize auto-increment sequence generation.

### Issues Solved
- **Issue 1:** Pages, Modules, Comments, and Labels RLS is set to `USING (true)` — Global Data Leak & Deletion.
- **Issue 3:** Missing Column Permissions on `profiles.full_name` Breaks Issue and Project APIs.
- **Issue 4:** All Channel Messages Stored as `room_type = 'GENERAL'`, Leaking Private Chats.
- **Issue 5:** Cross-Tenant Public Channel Access and Reaction Bypass.
- **Issue 7:** Arbitrary Issue Creation Bypass in Any Project.
- **Issue 8:** Missing `workspace_members` INSERT Policy Blocks Workspace Creation.
- **Issue 17:** Check-Then-Act Race Condition on Issue Sequence Generation.

### Step 1.1: Migration for RLS Hardening & Grants
Create a new migration `supabase/migrations/20261022000000_production_root_security_fix.sql`:

1. **Fix Column Grants for `profiles.full_name` (Issue 3):**
   ```sql
   -- Grant SELECT on full_name and public portfolio fields to authenticated and anon
   GRANT SELECT (id, name, full_name, username, avatar_url, role, bio, headline, links, skills, startup_name, startup_stage, education, is_published, company, last_seen_at) 
   ON public.profiles TO authenticated;

   GRANT SELECT (id, name, full_name, username, avatar_url, role, bio, headline, links, skills, startup_name, startup_stage, education, is_published, company) 
   ON public.profiles TO anon;
   ```

2. **Lock Down `public.pages` RLS (Issue 1):**
   ```sql
   DROP POLICY IF EXISTS "Authenticated users can access pages" ON public.pages;

   CREATE POLICY "pages_select_policy" ON public.pages
     FOR SELECT TO authenticated
     USING (
       EXISTS (
         SELECT 1 FROM public.projects p
         JOIN public.workspace_members wm ON wm.workspace_id = p.workspace_id
         WHERE p.id = pages.project_id AND wm.user_id = auth.uid()
       )
       OR EXISTS (
         SELECT 1 FROM public.projects p
         WHERE p.id = pages.project_id AND p.founder_id = auth.uid()
       )
     );

   CREATE POLICY "pages_insert_policy" ON public.pages
     FOR INSERT TO authenticated
     WITH CHECK (
       auth.uid() = created_by
       AND (
         EXISTS (
           SELECT 1 FROM public.projects p
           JOIN public.workspace_members wm ON wm.workspace_id = p.workspace_id
           WHERE p.id = pages.project_id AND wm.user_id = auth.uid()
         )
         OR EXISTS (
           SELECT 1 FROM public.projects p
           WHERE p.id = pages.project_id AND p.founder_id = auth.uid()
         )
       )
     );

   CREATE POLICY "pages_update_delete_policy" ON public.pages
     FOR ALL TO authenticated
     USING (
       auth.uid() = created_by
       OR EXISTS (
         SELECT 1 FROM public.projects p
         JOIN public.workspace_members wm ON wm.workspace_id = p.workspace_id
         WHERE p.id = pages.project_id AND wm.user_id = auth.uid() AND wm.role IN ('owner', 'admin')
       )
       OR EXISTS (
         SELECT 1 FROM public.projects p
         WHERE p.id = pages.project_id AND p.founder_id = auth.uid()
       )
     );
   ```

3. **Lock Down `modules`, `issue_comments`, and `labels` (Issue 1):**
   - Restrict `modules` to project founders and workspace members.
   - Restrict `issue_comments` to authors (for update/delete) and workspace members of the issue's project (for insert/select).
   - Restrict `labels` management to workspace members.

4. **Correct `workspace_members` Policies (Issue 8):**
   ```sql
   DROP POLICY IF EXISTS "Members can view workspace members" ON public.workspace_members;

   CREATE POLICY "workspace_members_select" ON public.workspace_members
     FOR SELECT TO authenticated
     USING (
       user_id = auth.uid()
       OR EXISTS (
         SELECT 1 FROM public.workspaces w
         WHERE w.id = workspace_members.workspace_id AND w.owner_id = auth.uid()
       )
       OR EXISTS (
         SELECT 1 FROM public.workspace_members my_wm
         WHERE my_wm.workspace_id = workspace_members.workspace_id AND my_wm.user_id = auth.uid()
       )
     );

   CREATE POLICY "workspace_members_insert" ON public.workspace_members
     FOR INSERT TO authenticated
     WITH CHECK (
       user_id = auth.uid()
       OR EXISTS (
         SELECT 1 FROM public.workspaces w
         WHERE w.id = workspace_members.workspace_id AND w.owner_id = auth.uid()
       )
     );
   ```

5. **Fix Channel Visibility & Access Function (Issue 5):**
   ```sql
   CREATE OR REPLACE FUNCTION public.can_access_channel(target_channel uuid)
   RETURNS boolean
   LANGUAGE sql
   STABLE SECURITY DEFINER
   SET search_path TO ''
   AS $function$
     SELECT EXISTS (
       SELECT 1 FROM public.channels c
       JOIN public.workspace_members wm ON wm.workspace_id = c.workspace_id
       WHERE c.id = target_channel
         AND wm.user_id = auth.uid()
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

   DROP POLICY IF EXISTS "Channel visibility policy" ON public.channels;
   CREATE POLICY "Channel visibility policy" ON public.channels FOR SELECT TO authenticated
   USING (
     EXISTS (
       SELECT 1 FROM public.workspace_members wm
       WHERE wm.workspace_id = channels.workspace_id AND wm.user_id = auth.uid()
     )
     AND (
       (is_private = false)
       OR created_by = auth.uid()
       OR EXISTS (SELECT 1 FROM public.channel_members cm WHERE cm.channel_id = channels.id AND cm.user_id = auth.uid())
       OR EXISTS (SELECT 1 FROM public.workspaces w WHERE w.id = channels.workspace_id AND w.owner_id = auth.uid())
     )
   );
   ```

6. **Fix Arbitrary Issue Creation RLS (Issue 7):**
   ```sql
   DROP POLICY IF EXISTS "Workspace members can create and update issues" ON public.issues;

   CREATE POLICY "issues_insert_policy" ON public.issues
     FOR INSERT TO authenticated
     WITH CHECK (
       auth.uid() = created_by
       AND EXISTS (
         SELECT 1 FROM public.projects p
         WHERE p.id = issues.project_id
           AND (
             p.founder_id = auth.uid()
             OR EXISTS (
               SELECT 1 FROM public.workspace_members wm 
               WHERE wm.workspace_id = p.workspace_id AND wm.user_id = auth.uid()
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
             OR EXISTS (
               SELECT 1 FROM public.workspace_members wm 
               WHERE wm.workspace_id = p.workspace_id AND wm.user_id = auth.uid()
             )
           )
       )
     );
   ```

7. **Serialize Sequence Generation with Advisory Locks (Issue 17):**
   ```sql
   CREATE OR REPLACE FUNCTION public.set_issue_sequence_id()
   RETURNS TRIGGER AS $$
   BEGIN
     IF NEW.sequence_id IS NULL OR NEW.sequence_id = 0 THEN
       -- Take transaction-scoped advisory lock on project hash to prevent concurrency race
       PERFORM pg_advisory_xact_lock(hashtext(NEW.project_id::text));

       SELECT COALESCE(MAX(sequence_id), 0) + 1
       INTO NEW.sequence_id
       FROM public.issues
       WHERE project_id = NEW.project_id;
     END IF;
     RETURN NEW;
   END;
   $$ LANGUAGE plpgsql;
   ```

### Step 1.2: Fix Application Code Callers
- In [`app/api/chat/channels/[channelId]/messages/route.ts:201`](file:///c:/Users/Admin/Documents/jatin/IBF/innovators.ai/app/api/chat/channels/[channelId]/messages/route.ts#L201), remove `room_type: "GENERAL"`. Channel messages must have `room_type: null` or `room_type: "CHANNEL"` (Issue 4).
- In [`app/api/messages/[id]/react/route.ts:28-29`](file:///c:/Users/Admin/Documents/jatin/IBF/innovators.ai/app/api/messages/[id]/react/route.ts#L28-L29), replace the bare `message.channel_id` check with `public.can_access_channel(message.channel_id)` (Issue 5).

### Phase 1 Verification Gate
- Run `npm run db:check`. Must pass with 0 schema contract errors.
- Confirm TAP smoke tests verify that `workspace_members` insert succeeds without infinite recursion.

---

## Phase 2: Multi-Domain Routing, Subdomain Auth & SEO Protection

### Objective
Prevent infinite redirect loops between `app.` and apex domains, stop unauthenticated users from falling into foreign workspaces, restore Googlebot access to 5,000 public project pages, and ensure Nginx preserves HTTPS protocols.

### Issues Solved
- **Issue 2:** Foreign Workspace Hijack on Signup Fallback.
- **Issue 6:** Infinite Redirect Loop on Unauthenticated App Pages.
- **Issue 10:** Public Project Directory and 5,000 SEO Sitemap URLs Blocked by Middleware.
- **Issue 18:** Nginx Strips HTTPS Protocol Behind Cloudflare.

### Step 2.1: Remove Dangerous Workspace Fallback (Issue 2)
In [`lib/workspace.ts`](file:///c:/Users/Admin/Documents/jatin/IBF/innovators.ai/lib/workspace.ts#L46-L62):
- Delete fallback step 3 that queries `anyWs` (`SELECT * FROM workspaces ORDER BY created_at ASC LIMIT 1`).
- If neither membership nor `ibf-community` is found, automatically create a dedicated workspace named `${user.name || 'Personal'} Workspace` with unique slug and set `user.id` as `owner`.

### Step 2.2: Fix Middleware Domain Scoping & Public Project Routes (Issue 10)
In [`middleware.ts`](file:///c:/Users/Admin/Documents/jatin/IBF/innovators.ai/middleware.ts#L65-L86):
- Remove `"/projects"` from global `PROTECTED_PREFIXES`.
- Distinguish between public project browsing (`/projects`, `/projects/[id]`) and internal protected project actions (`/projects/new`, `/projects/[id]/board`, `/projects/[id]/settings`, `/projects/[id]/cycles`).
- On the marketing apex domain (`innovators-global.com`), allow `/projects` and `/projects/[id]` to be publicly readable by Googlebot and visitors without redirection.

### Step 2.3: Fix Relative Redirects on App Subdomain (Issue 6)
- In [`app/dashboard/page.tsx:55`](file:///c:/Users/Admin/Documents/jatin/IBF/innovators.ai/app/dashboard/page.tsx#L55), [`app/settings/page.tsx:39`](file:///c:/Users/Admin/Documents/jatin/IBF/innovators.ai/app/settings/page.tsx#L39), [`app/team/[projectId]/page.tsx:31`](file:///c:/Users/Admin/Documents/jatin/IBF/innovators.ai/app/team/[projectId]/page.tsx#L31), and [`app/chat/direct/[projectId]/page.tsx:44`](file:///c:/Users/Admin/Documents/jatin/IBF/innovators.ai/app/chat/direct/[projectId]/page.tsx#L44):
  Replace relative `window.location.assign("/auth/signin?next=...")` with `DEFAULT_SIGNIN_URL` from `@/lib/auth/domain` (`https://innovators-global.com/auth/signin?next=...`).
- In [`components/ibf/layout/ibf-user-menu.tsx:74`](file:///c:/Users/Admin/Documents/jatin/IBF/innovators.ai/components/ibf/layout/ibf-user-menu.tsx#L74), copy `MARKETING_ORIGIN + "/auth/signup"` instead of `window.location.origin + "/auth/signup"`.

### Step 2.4: Nginx Protocol Forwarding Behind Cloudflare (Issue 18)
In [`nginx/innovators.conf:80`](file:///c:/Users/Admin/Documents/jatin/IBF/innovators.ai/nginx/innovators.conf#L80):
- Replace `proxy_set_header X-Forwarded-Proto $scheme;` with:
  ```nginx
  proxy_set_header X-Forwarded-Proto $http_x_forwarded_proto;
  ```
- Ensure Next.js correctly receives Cloudflare's `https` scheme so secure cookies and canonical URLs evaluate properly.

### Phase 2 Verification Gate
- Test curl request to `https://innovators-global.com/projects` without cookies: must return HTTP 200 (not 307 redirect).
- Test unauthenticated visit to `https://app.innovators-global.com/dashboard`: must redirect cleanly to `https://innovators-global.com/auth/signin?next=...` with zero loops.

---

## Phase 3: Workspace Architecture, Navigation Shell & Dashboard Realignment

### Objective
Integrate the dashboard with the unified `AppShell` (260px workspace sidebar and dynamic topbar), scope the dashboard strictly to the user's active workspace projects, eliminate unbounded database scans in metrics, and isolate founder analytics.

### Issues Solved
- **Issue 9:** Dashboard Selects Random Stranger's Project and Drops App Shell Navigation.
- **Issue 15:** Unbounded Scan and JavaScript Grouping in Workspace Counts.
- **Issue 16:** Founder Analytics Scans All Global Platform Project Views.

### Step 3.1: Wrap Dashboard in `AppShell` and Bind to Active Workspace (Issue 9)
In [`app/dashboard/page.tsx`](file:///c:/Users/Admin/Documents/jatin/IBF/innovators.ai/app/dashboard/page.tsx):
1. Wrap the return JSX in `<AppShell activeView="board" showTabs={true}>`.
2. Replace `fetch("/api/projects")` with `fetch("/api/workspace")` (or consume `useWorkspace()`).
3. Only render projects belonging to the user's active workspace. If the workspace has zero projects, display the "Create your first project" onboarding modal.

### Step 3.2: Optimize Workspace Counts with SQL Aggregations (Issue 15)
In [`app/api/workspace/route.ts:65-98`](file:///c:/Users/Admin/Documents/jatin/IBF/innovators.ai/app/api/workspace/route.ts#L65-L98):
- Remove the unbounded `select("project_id")` and client-side `forEach` count accumulator.
- In [`app/api/workspace/route.ts:49-51`](file:///c:/Users/Admin/Documents/jatin/IBF/innovators.ai/app/api/workspace/route.ts#L49-L51), remove `workspace_id.is.null` to ensure only projects belonging to `activeWorkspace.id` are returned.
- Batch query counts via a lightweight RPC `get_workspace_project_counts(p_project_ids uuid[])` or execute parallel count queries using `count: "exact", head: true`.

### Step 3.3: Filter Founder Analytics by Owned Projects (Issue 16)
In [`app/api/analytics/founder/route.ts:44-48`](file:///c:/Users/Admin/Documents/jatin/IBF/innovators.ai/app/api/analytics/founder/route.ts#L44-L48):
- Replace the unconstrained `supabase.from("analytics_events").select(...).eq("event_type", "view_project")` with an explicit filter scoping only to the founder's projects:
  ```ts
  ids.length 
    ? supabase.from("analytics_events")
        .select("id,created_at,metadata")
        .eq("event_type", "view_project")
        .in("metadata->>project_id", ids)
        .gte("created_at", since)
    : Promise.resolve({ data: [] })
  ```

### Phase 3 Verification Gate
- Verify visiting `/dashboard` loads the 260px `IbfSidebar`, user profile pill, workspace selector, and active project board.
- Verify founder analytics API returns only project views matching the founder's projects.

---

## Phase 4: Real-Time Chat Normalization & WebSocket Isolation

### Objective
Eliminate duplicate messages in chat feeds, provide real-time profile hydration for live incoming messages, and scope WebSockets so projects do not receive comments/activities from other companies.

### Issues Solved
- **Issue 11:** Chat Optimistic Update Creates Duplicate Messages on Screen.
- **Issue 12:** Live Incoming Chat Messages Lack Profile Data and Display as "Member".
- **Issue 14:** Unfiltered Realtime Subscriptions Broadcast All Comments and Activities Globally.

### Step 4.1: Deduplicate Chat Message Ingestion (Issue 11)
In [`components/chat/chat-workspace.tsx`](file:///c:/Users/Admin/Documents/jatin/IBF/innovators.ai/components/chat/chat-workspace.tsx):
- When `handleSendMessage` sends a message, attach a unique client nonce (`client_nonce: tempId`).
- In the Realtime `INSERT` listener, match against both `m.id === newMsg.id` and `m.id === newMsg.client_nonce`. If matched, replace the optimistic message rather than appending a second row.

### Step 4.2: Hydrate Sender Profiles on Realtime Inserts (Issue 12)
In [`components/chat/chat-workspace.tsx:198-208`](file:///c:/Users/Admin/Documents/jatin/IBF/innovators.ai/components/chat/chat-workspace.tsx#L198-L208):
- Maintain a local `profilesMap` (derived from channel members).
- When a new message arrives via Realtime, lookup `newMsg.sender_id` in `channelMembers`.
- If missing, fetch `/api/users/${newMsg.sender_id}` to hydrate the sender's real name, username, and avatar URL before inserting into the state array.

### Step 4.3: Scope Realtime Subscriptions to Project (Issue 14)
In [`lib/realtime/use-project-realtime.ts:76-98`](file:///c:/Users/Admin/Documents/jatin/IBF/innovators.ai/lib/realtime/use-project-realtime.ts#L76-L98):
- Add `project_id` foreign key column to `issue_comments` and `issue_activities` in SQL migration.
- Add `filter: project_id=eq.${projectId}` to both `issue_comments` and `issue_activities` Realtime listeners.

### Phase 4 Verification Gate
- Open two browser tabs on the same channel: send a message in Tab A and verify Tab B renders the author's real name and avatar immediately with 0 duplicate messages.

---

## Phase 5: Editor State Rubberbanding, Markdown Parser & Cluster Concurrency

### Objective
Prevent auto-save from wiping user typing in the Page Editor, ensure tables and code blocks at the end of documents render correctly, and coordinate rate limiting across PM2 cluster instances.

### Issues Solved
- **Issue 13:** Auto-Save Rubberbanding in Page Editor Overwrites In-Flight User Typing.
- **Issue 19:** In-Memory Rate Limiter Bypassed by PM2 Cluster Mode.
- **Issue 20:** Unclosed Markdown Blocks Vanish From Document Preview.

### Step 5.1: Stabilize Page Editor Auto-Save Synchronization (Issue 13)
In [`components/ibf/pages/page-editor.tsx:100-107`](file:///c:/Users/Admin/Documents/jatin/IBF/innovators.ai/components/ibf/pages/page-editor.tsx#L100-L107):
- Modify the `useEffect` that re-syncs state from props: key it strictly to `[page.id]`.
- Do not re-sync `content` from `page.content_markdown` or `page.updated_at` while the user is actively focused on the editor.

### Step 5.2: Flush Unclosed Markdown Blocks at End of Document (Issue 20)
In [`components/ibf/pages/page-editor.tsx:654`](file:///c:/Users/Admin/Documents/jatin/IBF/innovators.ai/components/ibf/pages/page-editor.tsx#L654):
- After the line loop ends in `renderMarkdownContent`:
  ```tsx
  if (inCodeBlock) {
    renderedElements.push(
      <CodeBlockView key="code-tail" code={codeBlockLines.join("\n")} language={codeBlockLang || "text"} />
    );
  }
  if (inTable && tableHeader.length > 0) {
    renderedElements.push(renderTableElement(tableHeader, tableRows, "table-tail"));
  }
  ```

### Step 5.3: Distributed Rate Limiting Across PM2 Cluster (Issue 19)
- In API routes calling `checkRateLimit`, switch to `checkRateLimitAsync`.
- Ensure `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` are read in production so rate limit counts are synchronized across all PM2 cluster processes.

### Phase 5 Verification Gate
- In the Page Editor, rapidly type continuous text while observing auto-save triggers; verify 0 rubberbanding or cursor jumping occurs.
- Add an unclosed code block (```` ```typescript ````) at the bottom of a page; verify it renders in the split preview.

---

## Phase 6: Master Verification, Contract Check, Build & Schema Reconciliation

### Objective
Reconcile all new tables and columns into `PRODUCTION_SETUP_ROOT.sql`, remove legacy bloat (`components/pm/` re-exports), and verify the complete repository builds cleanly.

### Step 6.1: Consolidate `PRODUCTION_SETUP_ROOT.sql`
- Merge the schemas for `workspaces`, `workspace_members`, `cycles`, `issues`, `channels`, `channel_members`, `modules`, `pages`, `labels`, and `issue_comments` into [`supabase/PRODUCTION_SETUP_ROOT.sql`](file:///c:/Users/Admin/Documents/jatin/IBF/innovators.ai/supabase/PRODUCTION_SETUP_ROOT.sql).
- Ensure a clean execution of `PRODUCTION_SETUP_ROOT.sql` produces an identical schema contract to the incremental migration chain.

### Step 6.2: Delete Redundant Wrapper Files (Lean Cleanup)
- Update imports across the codebase from `@/components/pm/*` to `@/components/ibf/*`.
- Delete the 4-line re-export stubs in `components/pm/issue-card.tsx` and `components/pm/issue-modal.tsx`.

### Step 6.3: Automated Gate Checks
1. Run `npm run db:check`:
   - Must output: `Schema contract check passed: SQL columns, RPCs, privileges, FKs, types, and TAP suites are synchronized.`
2. Run `npm run typecheck`:
   - Must output: `tsc --noEmit` exited with code 0.
3. Run `npm run build`:
   - Next.js production build must compile all routes with 0 errors.

---

## 2. Execution Readiness Checklist

- [ ] **Phase 1 SQL Migration:** Applied and verified against Supabase RLS test suite.
- [ ] **Phase 2 Auth & Middleware:** Tested with multi-domain session cookies on localhost and staging.
- [ ] **Phase 3 Dashboard & Workspace Context:** Validated with empty account and multi-project account.
- [ ] **Phase 4 Realtime Chat:** Verified WebSocket messages with multi-client live chat test.
- [ ] **Phase 5 Editor & Concurrency:** Tested auto-save, markdown edge cases, and Redis rate limit sync.
- [ ] **Phase 6 Production Build:** `npm run db:check`, `npm run typecheck`, and `npm run build` all pass green.
