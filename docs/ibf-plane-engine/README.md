# IBF Plane Engine: 1:1 Workspace Architecture & Master Execution Plan

> **Product**: **IBF** (Innovator Bridge Foundry)  
> **Platform Target**: `app.innovators-global.com`  
> **Open-Source Baseline**: [makeplane/plane](https://github.com/makeplane/plane) (`apps/web` & `packages/ui`)  
> **Backend Architecture**: Next.js 15 App Router + Supabase PostgreSQL + Supabase Realtime WebSockets  
> **Execution Strategy**: Full 1:1 Plane feature parity, rebranded to IBF, zero Django backend bloat, dark precision aesthetic.

---

## Executive Summary

The **IBF Plane Engine** is a comprehensive, production-grade project management workspace engineered to replace fragmented legacy interfaces with a 1:1 clone of Plane.so. It delivers keyboard-first task management, sprint planning, feature epics, Notion-grade collaborative documentation, and multi-user live synchronization.

Every element has been planned across 7 dedicated phase specifications:

| Phase | Specification Document | Core Deliverables | Status |
| :--- | :--- | :--- | :--- |
| **Phase 1** | [`phase-1-database-schema.md`](./phase-1-database-schema.md) | PostgreSQL schema, tables, foreign keys, RLS, indexes, and Realtime publications. | ✅ Completed & Verified |
| **Phase 2** | [`phase-2-workspace-shell.md`](./phase-2-workspace-shell.md) | Workspace Sidebar, dynamic Project Tree, Topbar breadcrumbs, and View switchers. | ✅ Completed & Verified |
| **Phase 3** | [`phase-3-issue-experience.md`](./phase-3-issue-experience.md) | 5-lane Kanban Board, Linear-grade List View, and 720px Side-Peek Issue Drawer. | ✅ Completed & Verified |
| **Phase 4** | [`phase-4-cycles-modules.md`](./phase-4-cycles-modules.md) | Sprints (Cycles) countdown & burndown, and Feature Modules (Epics) roadmaps. | ✅ Completed & Verified |
| **Phase 5** | [`phase-5-pages-docs.md`](./phase-5-pages-docs.md) | Notion-grade collaborative Docs engine (PRDs/Notes) and universal `Cmd+K` palette. | ✅ Completed & Verified |
| **Phase 6** | [`phase-6-realtime-deploy.md`](./phase-6-realtime-deploy.md) | WebSockets multi-user sync, Nginx 128k buffer setup, EC2 PM2 cluster deployment. | ✅ Completed & Verified |
| **Phase 7** | [`phase-7-plane-ui-ux.md`](./phase-7-plane-ui-ux.md) | Plane 1:1 UI/UX Precision Design System, keyboard reflex engine, & tactile polish. | ✅ Completed & Verified |

---

## 1. Architectural Transformation: Plane Django to IBF Supabase

Plane relies on a complex Python/Django REST API with MobX client-side state stores. IBF eliminates all Python server dependencies while keeping 100% of Plane's visual polish, keyboard shortcuts, and UX:

```
[ Plane Original Architecture ]
makeplane/plane UI ──> MobX Client Stores ──> Django Python REST API ──> PostgreSQL
                                            (Complex microservices & Celery)

[ IBF Production Architecture ]
IBF Clean UI React ──> Lightweight Zustand/SWR ──> Next.js App Router ──> Supabase PostgreSQL
                                                (Server Actions & API)      │
                                                           ▲                │
                                                           └── Realtime WS ─┘
```

### Key Refactoring Rules:
1. **Name strictly IBF**: All branding, logos, headers, sequence tags (`IBF-1`), and documentation use **IBF**.
2. **Zero Placeholders**: Every button, dropdown, search bar, and drawer binds to real Supabase tables and live state.
3. **Dark Precision Canvas**: Universal theme palette (`#080c14`, `#0d121f`, `#111a2e`) with `#00f5d4` accent. No beige/cream paper styling.

---

## 2. Global Information Architecture & Route Map

```
https://app.innovators-global.com/
│
├── /dashboard                          # Workspace root; auto-redirects to active project
│
├── /projects/[id]                      # Active Project Space
│   ├── /issues                         # Default view (remembers user's tab: Board or List)
│   ├── /board                          # 5-lane Kanban Board with drag-and-drop
│   ├── /list                           # High-density Linear-style table with grouping
│   ├── /cycles                         # Sprints roadmap & active countdown clock
│   ├── /cycles/[cycleId]               # Sprint detail & backlog assignment tray
│   ├── /modules                        # Feature Epics with delivery progress bars
│   ├── /pages                          # PRD & Documentation hub
│   ├── /pages/[pageId]                 # Collaborative Markdown document editor
│   ├── /analytics                      # Velocity charts & state distribution
│   └── /settings                       # Project labels, workflows, and team members
│
├── /your-issues                        # Cross-project triage for issues assigned to logged-in user
└── /settings                           # User profile, notifications, and active sessions
```

---

## 3. Directory Structure for IBF Components

All extracted and refactored components reside cleanly under `components/ibf/`:

```
components/ibf/
├── layout/
│   ├── ibf-sidebar.tsx                 # Authentic Plane sidebar & project tree
│   ├── ibf-topbar.tsx                  # Breadcrumbs, view switcher, search trigger
│   └── ibf-workspace-shell.tsx         # Unified layout wrapper
├── board/
│   ├── kanban-board.tsx                # 5-column drag-and-drop board
│   ├── kanban-column.tsx               # State column header, card list, inline creator
│   └── issue-card.tsx                  # Sequence badge, priority, assignee, subtasks
├── list/
│   ├── list-view.tsx                   # High-density spreadsheet table
│   ├── list-group.tsx                  # Collapsible groups (State, Priority, Assignee)
│   └── list-row.tsx                    # Interactive table row with keyboard focus
├── issues/
│   ├── issue-drawer.tsx                # 720px sliding Side-Peek detail view
│   ├── issue-modal.tsx                 # Quick issue creator (Hotkey: C)
│   ├── issue-subtasks.tsx              # Sub-issues checklist with completion ratio
│   ├── issue-activities.tsx            # Chronological audit timeline
│   └── issue-comments.tsx              # Real-time discussion thread
├── cycles/
│   ├── cycles-view.tsx                 # Sprint dashboard, countdown, and burndown
│   ├── cycle-modal.tsx                 # Sprint creator (dates, name, scope)
│   └── cycle-backlog-tray.tsx          # Backlog issue transfer drawer
├── modules/
│   ├── modules-view.tsx                # Feature Epics roadmap & progress tracker
│   └── module-modal.tsx                # Epic creator
├── pages/
│   ├── pages-view.tsx                  # Document catalog (recent, favorites)
│   └── page-editor.tsx                 # Notion-grade markdown document editor
├── dropdowns/
│   ├── state-dropdown.tsx              # Backlog, To Do, In Progress, Done, Canceled
│   ├── priority-dropdown.tsx           # Urgent, High, Medium, Low, None
│   ├── assignee-dropdown.tsx           # Project team members with search
│   └── label-dropdown.tsx              # Multi-select colored label badges
└── command-palette.tsx                 # Universal Cmd+K keyboard navigator
```

---

## 4. Phase Navigation Links

Review the detailed implementation guides for each phase:
- 📖 [Phase 1: Database Schema & Supabase Migrations](./phase-1-database-schema.md)
- 📖 [Phase 2: Authentic IBF Workspace Shell & Navigation](./phase-2-workspace-shell.md)
- 📖 [Phase 3: The Complete Issue Experience (Board, List & Drawer)](./phase-3-issue-experience.md)
- 📖 [Phase 4: Sprints (Cycles) & Epics (Modules) Engine](./phase-4-cycles-modules.md)
- 📖 [Phase 5: Collaborative Pages & Universal Command Palette](./phase-5-pages-docs.md)
- 📖 [Phase 6: Multi-User Realtime Sync & AWS Rollout](./phase-6-realtime-deploy.md)
- 📖 [Phase 7: Plane 1:1 UI/UX Precision Design System & Experience Polish](./phase-7-plane-ui-ux.md)
