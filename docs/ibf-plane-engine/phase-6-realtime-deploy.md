# Phase 6: Multi-User Realtime Sync & AWS Production Rollout

> **Platform Target**: `app.innovators-global.com`  
> **Source Baseline**: Supabase Realtime WebSockets + Next.js 15 App Router + AWS EC2 PM2 Cluster  
> **Status**: Ready for Production Execution  

---

## 1. Overview & Objective

Wire multi-user live collaboration across all IBF Plane views via Supabase Realtime WebSockets, configure optimistic UI updates to eliminate perceived latency, secure multi-domain authentication with wildcard cookies, prevent 502 Bad Gateway errors with Nginx 128k header buffers, and execute zero-downtime deployment on AWS EC2.

---

## 2. Realtime WebSocket Architecture

```
User A (Session 1)                           Supabase Realtime Engine                         User B (Session 2)
      │                                                │                                               │
      │── Drag issue INN-4 to "Done" ─────────────────>│                                               │
      │   (Optimistic UI updates immediately)          │                                               │
      │                                                │── Broadcast postgres_changes (UPDATE) ───────>│
      │                                                │                                               │── Board updates card
      │                                                │                                               │   position (<150ms)!
      │                                                │                                               │
      │── Post comment: "@Alex reviewing PR" ─────────>│                                               │
      │                                                │── Broadcast postgres_changes (INSERT) ───────>│
      │                                                │                                               │── New comment appears in
      │                                                │                                               │   drawer timeline!
```

### 2.1 Channel Subscriptions in React

Implemented in `lib/realtime/use-project-realtime.ts`:

```typescript
'use client';

import { useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

export function useProjectRealtime(projectId: string, onIssueChange: () => void) {
  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel(`project-pm-${projectId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'issues',
          filter: `project_id=eq.${projectId}`
        },
        (payload) => {
          onIssueChange();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'issue_comments'
        },
        (payload) => {
          onIssueChange();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [projectId, onIssueChange]);
}
```

---

## 3. Multi-Domain Authentication & Infrastructure Architecture

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ CLOUDFLARE DNS & SSL (Strict Full)                                                     │
├───────────────────────────────────────────────────┬────────────────────────────────────┤
│ innovators-global.com (Apex Domain)               │ app.innovators-global.com (App)    │
│ • Public Marketing & Landing Page                 │ • Private IBF Workspace            │
│ • Sign In / Sign Up Modal                         │ • Kanban Board, Sprints, Epics     │
├───────────────────────────────────────────────────┴────────────────────────────────────┤
│ SHARED WILDCARD COOKIES                                                                │
│ Domain=.innovators-global.com; Path=/; SameSite=Lax; Secure                           │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ AWS EC2 (Ubuntu 24.04 · 52.62.130.217)                                                 │
│ • Nginx Reverse Proxy with 128k proxy buffers (Eliminates 502 Bad Gateway)            │
│ • Node.js 22 + Next.js 15 Standalone PM2 Cluster (instances: 2)                        │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

### 3.1 Nginx Buffer Configuration (`/etc/nginx/sites-available/innovators`)

Next.js Server Actions, Supabase SSR auth cookies, and CSP headers exceed Nginx's default 4KB buffer, resulting in `502 Bad Gateway: upstream sent too big header`. The following directives permanently resolve this:

```nginx
# Prevent 502 Bad Gateway on large Next.js auth headers and cookies
proxy_buffer_size 128k;
proxy_buffers 4 256k;
proxy_busy_buffers_size 256k;
large_client_header_buffers 4 64k;
```

---

## 4. Production Deployment Automation (`scripts/deploy-ec2.sh`)

Automated zero-downtime deployment script running on EC2:

```bash
#!/usr/bin/env bash
set -e

APP_DIR="/var/www/innovators"
echo "=== Deploying IBF Plane Engine to Production EC2 ==="

cd $APP_DIR

# 1. Fetch latest changes
git pull origin main

# 2. Install production dependencies
npm install --prefer-offline --no-audit

# 3. Build optimized production bundle
npm run build

# 4. Zero-downtime PM2 reload
pm2 reload ecosystem.config.cjs --update-env

# 5. Reload Nginx
sudo nginx -t && sudo systemctl reload nginx

echo "=== Deployment Successfully Completed ==="
pm2 list
```

---

## 5. End-to-End Real-World User Verification Gates

### Gate 1: Workspace Authentication & Shell
- [ ] Navigating to `https://innovators-global.com` allows signing in via Google OAuth or Email.
- [ ] Successful authentication automatically redirects the user to `https://app.innovators-global.com/dashboard`.
- [ ] The workspace loads without infinite spinners, rendering in dark precision canvas (`#080c14`).
- [ ] The IBF Sidebar displays the user's projects with expandable child views.

### Gate 2: Kanban & List Views
- [ ] Dragging an issue card between Backlog, To Do, In Progress, and Done updates immediately in the UI.
- [ ] The database persists the new lane state in Supabase PostgreSQL.
- [ ] Toggling to List View displays issues in high-density table grouped by State.
- [ ] Pressing keyboard key `C` opens the quick issue creator modal with focus on the title input.

### Gate 3: Side-Peek Issue Drawer
- [ ] Clicking any card or list row smoothly opens the 720px Side-Peek drawer.
- [ ] Description supports full Markdown editing and auto-saves to Supabase.
- [ ] Adding and checking subtasks updates the subtask progress bar in real time.
- [ ] Posting a comment appends it to the discussion timeline.

### Gate 4: Sprints (Cycles) & Epics (Modules)
- [ ] Active sprint displays a live countdown timer and completion burndown bar.
- [ ] Backlog drawer allows transferring issues into the active cycle in 1 click.
- [ ] Modules calculate completion percentages based on linked issues.

### Gate 5: Multi-User Live Collaboration
- [ ] Open two browser windows side-by-side with different user accounts.
- [ ] Moving an issue in Window 1 updates Window 2 within 150ms over Supabase Realtime WebSockets.
- [ ] Zero 500 or 502 errors in `/var/log/nginx/error.log` and PM2 logs.
