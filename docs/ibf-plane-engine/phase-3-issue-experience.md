# Phase 3: The Complete Issue Experience (Board, List & Side-Peek Drawer)

> **Platform Target**: `app.innovators-global.com`  
> **Source Baseline**: `makeplane/plane` (`packages/ui/src/board`, `packages/ui/src/list`, `apps/web/core/components/issues`)  
> **Status**: Ready for Production Execution  

---

## 1. Overview & Objective

Implement Plane's flagship core: a high-density, keyboard-driven issue management engine supporting both a visual Kanban Board and a Linear-grade List View, backed by a rich **720px Side-Peek Issue Detail Drawer** with live Markdown editing, checklist subtasks, activity history, and comments.

---

## 2. Component Architecture & File Tree

All issue management components reside under `components/ibf/`:

```
components/ibf/
├── board/
│   ├── kanban-board.tsx            # 5-lane drag-and-drop board container
│   ├── kanban-column.tsx           # Column header, scroll container, inline card creator
│   └── issue-card.tsx              # Card surface, sequence ID, priority badge, subtask pill
├── list/
│   ├── list-view.tsx               # Linear-style spreadsheet view with grouping
│   ├── list-group.tsx              # Collapsible group section header (by State, Priority, etc.)
│   └── list-row.tsx                # High-density row with inline cell dropdowns
└── issues/
    ├── issue-drawer.tsx            # 720px split sliding Side-Peek drawer
    ├── issue-modal.tsx             # Quick issue creator modal (Hotkey: C)
    ├── issue-subtasks.tsx          # Sub-issues checklist with real-time completion bar
    ├── issue-activities.tsx        # Chronological audit timeline
    └── issue-comments.tsx          # Real-time discussion thread with user mentions
```

---

## 3. Detailed Component Specifications

### 3.1 Kanban Board Engine (`components/ibf/board/kanban-board.tsx`)

#### Workflow Lanes:
1. **Backlog** (`#64748b` - Slate gray): Icebox and unprioritized ideas.
2. **To Do** (`#38bdf8` - Sky blue): Scheduled for implementation.
3. **In Progress** (`#f59e0b` - Amber): Active engineering.
4. **Done** (`#10b981` - Emerald green): Shipped and verified.
5. **Canceled** (`#f43f5e` - Rose red): Abandoned or superseded.

#### Interactive Behaviors:
- **Smooth Drag-and-Drop**: Users can drag cards across lanes. Optimistic UI updates the card position immediately, while a background `PATCH /api/issues/[id]` synchronizes to Supabase.
- **Inline Card Creation**: Each column header features a `+` button, and the column footer includes an inline input for rapid-fire issue creation without opening a modal.
- **Column Filtering & Sorting**: Sort by priority (Urgent first), due date, or creation date.

---

### 3.2 High-Density List View (`components/ibf/list/list-view.tsx`)

A keyboard-first table optimized for triaging hundreds of issues in seconds:
- **Group By Support**: Group issues dynamically by `State`, `Priority`, `Assignee`, `Cycle`, or `Module`.
- **Inline Cell Editing**:
  - Click on the state icon to immediately switch state via a dropdown without opening the issue.
  - Click on the priority icon to cycle or select priority.
  - Click assignee avatar to reassign.
- **Keyboard Navigation**:
  - `j` or `↓`: Move focus to next row.
  - `k` or `↑`: Move focus to previous row.
  - `Enter` or `Space`: Open Side-Peek issue drawer.
  - `s`: Open state selector dropdown for focused row.
  - `p`: Open priority selector for focused row.
  - `a`: Open assignee picker for focused row.

---

### 3.3 The Side-Peek Issue Drawer (`components/ibf/issues/issue-drawer.tsx`)

Opens as a 720px sliding drawer from the right side of the screen upon clicking any issue card or table row.

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ [INN-42]   [ Full Screen ⛶ ]   [ Copy Link 🔗 ]   [ Close ✕ ]                          │
├─────────────────────────────────────────────────┬──────────────────────────────────────┤
│ LEFT PANEL: CONTENT & DISCUSSIONS (60% width)   │ RIGHT PANEL: METADATA (40% width)    │
│                                                 │                                      │
│ [Title Input]                                   │ State:        [ In Progress ▼ ]      │
│ Integrate Supabase Realtime WebSockets          │ Priority:     [ ⚡ Urgent ▼ ]         │
│                                                 │ Assignee:     [ (JP) Jatin P. ▼ ]    │
│ [Rich Markdown Description Editor]              │ Cycle:        [ Sprint 2 (Active) ▼ ]│
│ - Configure channel subscriptions               │ Module:       [ Realtime Engine ▼ ]  │
│ - Ensure sub-150ms optimistic updates           │ Due Date:     [ Oct 24, 2026 📅 ]    │
│                                                 │ Labels:       [ + Backend ] [ + WS ] │
│ Subtasks (3 of 5 completed · 60%) [██████░░░░]  │ Estimate:     [ 5 Points ▼ ]         │
│ ☑ Provision postgres_changes on publication     │                                      │
│ ☑ Wire channel listeners in React provider      ├──────────────────────────────────────┤
│ ☑ Optimistic board drag update                  │ CREATED BY                           │
│ ☐ Side-drawer comment streaming                 │ Alex R. · 2 days ago                 │
│ ☐ Disconnect resilience test                    │                                      │
│                                                 │ LAST MODIFIED                        │
│ Activity History                                │ Jatin P. · 12 minutes ago            │
│ • Jatin P. changed status to In Progress (12m)  │                                      │
│ • Alex R. assigned to Jatin P. (2d)             │                                      │
│                                                 │                                      │
│ Comments & Discussion                           │                                      │
│ [Write a comment... Markdown and @mentions]     │                                      │
└─────────────────────────────────────────────────┴──────────────────────────────────────┘
```

#### Detailed Drawer Sections:
1. **Title & Description**:
   - Auto-saving input for title.
   - Rich Markdown editor supporting headers, bullet points, numbered lists, blockquotes, syntax-highlighted code blocks, and interactive `- [ ]` checkboxes.
2. **Subtasks Checklist**:
   - Add sub-issues directly linked via `parent_issue_id`.
   - Checking a subtask updates the progress bar (`3 of 5 completed · 60%`).
3. **Activity Timeline**:
   - Live stream from `public.issue_activities` showing who changed fields and when.
4. **Discussion Thread**:
   - Real-time comment stream from `public.issue_comments`.
   - Supports markdown formatting and avatar display.
5. **Metadata Inspector**:
   - Direct dropdowns to update State, Priority, Assignee, Cycle, Module, Due Date, Labels, and Estimate Points.

---

### 3.4 Quick Issue Creation Modal (`components/ibf/issues/issue-modal.tsx`)

- Bound to universal keyboard shortcut **`C`**.
- Auto-focuses on the issue title field immediately upon opening.
- Pre-selects active project, active cycle, and default state (`Backlog` or `To Do`).
- Pressing `Cmd+Enter` (or `Ctrl+Enter`) creates the issue and closes the modal; `Shift+Cmd+Enter` creates and opens a blank new modal for continuous task entry.

---

## 4. API Endpoints Specification

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/projects/[id]/issues` | Fetch project issues with filter by state, priority, cycle |
| `POST` | `/api/projects/[id]/issues` | Create new issue with auto-incremented sequence identifier |
| `GET` | `/api/issues/[id]` | Fetch complete issue detail including subtasks |
| `PATCH` | `/api/issues/[id]` | Update issue fields; triggers audit activity log |
| `DELETE`| `/api/issues/[id]` | Delete issue and cascade sub-issues |
| `GET` | `/api/issues/[id]/comments` | Fetch discussion comments thread |
| `POST` | `/api/issues/[id]/comments` | Post new comment to discussion |
| `GET` | `/api/issues/[id]/activities` | Fetch chronological audit history |

---

## 5. Verification Checklist

- [ ] Dragging an issue card between Kanban columns immediately updates local state and saves to Supabase.
- [ ] Switching to List View displays issues in high-density table grouped by state.
- [ ] Clicking any issue opens the 720px Side-Peek drawer smoothly.
- [ ] Updating description in the drawer persists changes to PostgreSQL.
- [ ] Adding a subtask renders in the checklist and recalculates completion ratio.
- [ ] Pressing `C` opens the quick issue creator modal with auto-focused title.
