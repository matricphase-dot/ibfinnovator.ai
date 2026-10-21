# Phase 3: Project Management Engine (1:1 Plane.so Clone Rebranded as IBF)

> **Platform Target**: `app.innovators-global.com`  
> **Source Baseline**: [makeplane/plane](https://github.com/makeplane/plane) (`apps/web` & `packages/ui`)  
> **Brand Name**: **IBF** (Innovator Bridge Foundry)  
> **Architecture**: Next.js 15 App Router + Supabase PostgreSQL + Realtime WebSockets  
> **Full Phase Documentation**: See [`docs/ibf-plane-engine/`](../ibf-plane-engine/README.md) for individual phase specifications.

---

## 1. Executive Summary & Architecture

The IBF Project Management Engine delivers an authentic, 1:1 feature-complete clone of Plane.so, completely stripped of Django/Python backend bloat and re-engineered natively on Next.js 15 App Router and Supabase PostgreSQL.

All legacy cyber neon and beige paper backgrounds have been eliminated. The entire workspace operates on a dark precision canvas (`#080c14`, `#0d121f`, `#111a2e`) with `#00f5d4` cyan accents.

---

## 2. Complete 6-Phase Specification Directory

The implementation is broken down into 6 comprehensive, file-by-file blueprints:

| Phase | Blueprint Specification | Scope & Deliverables |
| :--- | :--- | :--- |
| **Phase 1** | [Phase 1: Database Schema & Migrations](../ibf-plane-engine/phase-1-database-schema.md) | PostgreSQL schema for `labels`, `modules`, `issue_comments`, `issue_activities`, `pages`, sub-issues (`parent_issue_id`), audit triggers, and Realtime publications. |
| **Phase 2** | [Phase 2: Authentic Workspace Shell](../ibf-plane-engine/phase-2-workspace-shell.md) | Authentic Plane Workspace Sidebar, collapsible Project Tree, dynamic Topbar breadcrumbs, view switchers, and user profile footer. |
| **Phase 3** | [Phase 3: The Complete Issue Experience](../ibf-plane-engine/phase-3-issue-experience.md) | 5-lane Kanban Board, Linear-grade high-density List View, and 720px Side-Peek Issue Drawer with Markdown description, checklist subtasks, and comments. |
| **Phase 4** | [Phase 4: Sprints & Epics Engine](../ibf-plane-engine/phase-4-cycles-modules.md) | Sprints (Cycles) countdown clock & burndown velocity, interactive Backlog transfer tray, and Feature Modules (Epics) roadmaps. |
| **Phase 5** | [Phase 5: Collaborative Pages & Cmd+K](../ibf-plane-engine/phase-5-pages-docs.md) | Notion-grade collaborative documentation editor (PRDs & Notes) with auto-save to Supabase, and global `Cmd+K` Command Palette. |
| **Phase 6** | [Phase 6: Multi-User Realtime & Deploy](../ibf-plane-engine/phase-6-realtime-deploy.md) | Supabase Realtime WebSockets (<150ms sync), Nginx 128k proxy buffers to prevent 502 Bad Gateway, and EC2 PM2 cluster rollout. |

---

## 3. Plane to IBF Component Extraction & Mapping

| Plane Component Path (`makeplane/plane`) | Refactored IBF Workspace Path | Feature / Component | Rebranding & Refactor |
| :--- | :--- | :--- | :--- |
| `packages/ui/src/sidebar/` | `components/ibf/layout/ibf-sidebar.tsx` | Workspace Sidebar | Rebrand: Plane Logo → **IBF Logo**; Project switcher |
| `packages/ui/src/board/` | `components/ibf/board/kanban-board.tsx` | Kanban Board Engine | 5-lane board, smooth drag physics, inline card creation |
| `packages/ui/src/list/` | `components/ibf/list/list-view.tsx` | Linear-grade List View | High-density table, keyboard navigation, inline cell edits |
| `apps/web/core/components/issues/issue-detail/` | `components/ibf/issues/issue-drawer.tsx` | Side-Peek Issue Detail | Markdown editor, subtasks, activities, comments |
| `apps/web/core/components/issues/issue-modal/` | `components/ibf/issues/issue-modal.tsx` | Quick Issue Creator | Keyboard shortcut `C`, auto-focus, smart defaults |
| `apps/web/core/components/cycles/` | `components/ibf/cycles/cycles-view.tsx` | Sprint & Cycles Engine | Countdown timer, burndown chart, backlog transfer |
| `apps/web/core/components/modules/` | `components/ibf/modules/modules-view.tsx` | Feature Modules / Epics | Lead time, progress bar, issue grouping |
| `apps/web/core/components/pages/` | `components/ibf/pages/pages-view.tsx` | IBF Pages (Docs/PRDs) | Collaborative documentation editor |
| `apps/web/core/components/command-palette/` | `components/ibf/command-palette.tsx` | Global `Cmd+K` Palette | Search issues, jump to project, create cycle |

---

## 4. UI Color Tokens (Plane 1:1 Dark Precision)

```css
:root {
  --ibf-canvas: #080c14;            /* Main content area */
  --ibf-sidebar: #0d121f;           /* Sidebar navigation */
  --ibf-topbar: #0d1422;            /* Top navigation bar */
  --ibf-surface: #111a2e;           /* Cards, dropdowns, panels */
  --ibf-surface-hover: #16223b;     /* Interactive hover state */
  --ibf-border-subtle: rgba(255, 255, 255, 0.06);
  --ibf-brand: #00f5d4;             /* IBF Cyan Accent */
  --ibf-text-primary: #f8fafc;
  --ibf-text-secondary: #94a3b8;
  --ibf-text-muted: #64748b;
}
```

---

## 5. End-to-End Verification Gate

1. **Workspace Shell**: Navigating to `https://app.innovators-global.com/dashboard` loads the dark precision IBF workspace without infinite spinners.
2. **Kanban & List**: Issues can be dragged across 5 lanes or triaged in high-density list view with instant optimistic UI.
3. **Side-Peek Drawer**: Clicking an issue smoothly opens the 720px drawer with Markdown description, checklist subtasks, activity log, and comments.
4. **Sprints & Epics**: Active sprints display live countdown clocks and burndown velocity; modules track delivery progress.
5. **Pages & Cmd+K**: Notion-style docs auto-save to PostgreSQL; `Cmd+K` palette searches across all workspace entities.
6. **Live Multi-User Sync**: Card movements and comments synchronize in real-time across multiple browsers over WebSockets.
