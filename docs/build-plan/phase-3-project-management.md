# Phase 3: Project Management Engine (Plane Codebase Extraction & Refactor)
> **Status:** Planning · Ponytail Strict: Extract battle-tested UI/UX from Plane, wire directly to Supabase  
> **Source:** [https://github.com/makeplane/plane](https://github.com/makeplane/plane) (`apps/web` & `packages/ui`)  
> **Strategy:** Take Plane's actual UI components (Kanban Board, Issue Cards, State Selectors, Priority Badges, Issue Modals) and adapt them to run natively inside our Next.js + Supabase architecture without Django/Python backend bloat.

---

## 1. What We Extract from `makeplane/plane`

Plane has polished, keyboard-first, Linear-grade project management UI. We port and refactor specific components directly into `src/components/plane/`:

| Plane Component Path (`makeplane/plane`) | Refactored Innovators.ai Path | What it Provides | Adaptation / Refactor Needed |
|---|---|---|---|
| `packages/ui/src/board/` | `src/components/pm/board/` | Kanban Board, Columns, Column Headers, Drag/Drop columns | Replace Plane internal context with Supabase hooks / Zustand store |
| `packages/ui/src/issue-card/` | `src/components/pm/issue-card.tsx` | Issue Card with sequence ID (INN-1), priority icons, assignee avatar, state pill | Connect to our `issues` schema |
| `apps/web/core/components/issues/issue-modal/` | `src/components/pm/issue-modal.tsx` | Full issue creation / edit modal with Title, Description, State, Priority, Due date | Wire to `POST /api/projects/[id]/issues` |
| `packages/ui/src/dropdowns/priority.tsx` | `src/components/pm/priority-select.tsx` | Priority picker with Plane SVG icons (`urgent`, `high`, `medium`, `low`, `none`) | Zero dependency, pure Radix UI / Tailwind |
| `packages/ui/src/dropdowns/state.tsx` | `src/components/pm/state-select.tsx` | State picker (`backlog`, `todo`, `in_progress`, `done`, `canceled`) | Wire to our state enum |
| `apps/web/core/components/cycles/` | `src/components/pm/cycles/` | Sprint/Cycle progress, active sprint countdown, backlog picker | Connect to our `cycles` table |

---

## 2. Refactoring Process & Architecture (Django -> Supabase)

Plane uses a Python/Django REST API with MobX/SWR state management. We eliminate the Django layer entirely:

```
[ Plane Original Stack ]
Plane Frontend React ---> MobX Store ---> Django REST API ---> PostgreSQL
                                     (Python Backend)

[ Innovators.ai Refactored Stack ]
Plane UI Components ---> Lightweight Zustand/React-Query ---> Next.js Server Actions / Supabase Client ---> Supabase PostgreSQL
```

### Key Refactor Steps:
1. **Strip MobX / Custom Store Boilerplate:** Replace Plane's MobX stores with lightweight Zustand or standard React Server Actions + Supabase queries.
2. **Preserve Plane's Visual Excellence & Keyboard Navigation:** Keep Plane's exact CSS/Tailwind design tokens, icon SVGs, smooth drag interactions, and `Cmd+K` palette patterns.
3. **Connect to Supabase Schema:**
   - Map Plane's `issue.sequence_id` to `INN-<id>`.
   - Map Plane's priority values (`urgent`, `high`, `medium`, `low`, `none`) 1:1.
   - Map Plane's state values (`backlog`, `unstarted`, `started`, `completed`, `cancelled`) to our `state` enum (`backlog`, `todo`, `in_progress`, `done`, `canceled`).

---

## 3. Detailed Component Plan

### 3.1 Kanban Board (`src/app/projects/[id]/board/page.tsx`)
- Adapted from Plane's `KanbanView`.
- 5 lanes: Backlog, To Do, In Progress, Done, Canceled.
- Drag-and-drop powered by `@hello-pangea/dnd` or `@dnd-kit` (already standard in Plane).
- Instant optimistic UI update on drop, followed by `PATCH /api/issues/[id]`.

### 3.2 List View (`src/app/projects/[id]/list/page.tsx`)
- Adapted from Plane's `ListView`.
- High-density table with inline state toggling, quick assignee selector, and keyboard navigation.

### 3.3 Sprint / Cycle Management (`src/app/projects/[id]/cycles/page.tsx`)
- Adapted from Plane's `CycleDetailView`.
- Burndown/progress visualization (% issues completed).
- Ability to move issues from Backlog into an active Cycle.

---

## 4. Verification & Gate Checks
- Test issue creation, update, and deletion using Plane's adapted components.
- Verify zero runtime references to Plane's Django endpoints or legacy MobX dependencies.
- Pass `npm run typecheck` and `npm run build` with clean bundle sizes.
