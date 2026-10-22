# Phase 7: Plane 1:1 UI/UX Precision Design System & Experience Polish

> **Platform Target**: `app.innovators-global.com`  
> **Source Baseline**: [makeplane/plane](https://github.com/makeplane/plane) (`apps/web`, `packages/ui`, `packages/editor`)  
> **Aesthetic Philosophy**: Dark Precision Canvas (`#080c14`), Linear/Plane High-Density Typography, Keyboard-First Ergonomics  
> **Status**: Ready for Production Execution  

---

## 1. Overview & Objective

Deliver an uncompromising, pixel-perfect **1:1 implementation of Plane.so's UI and UX design system** tailored specifically for the **IBF (Innovator Bridge Foundry)** ecosystem. 

This phase focuses on bridging any visual or experiential gap between standard web components and Plane's world-class interface:
1. **Mathematical Spatial Rhythm & Density**: Strict 4px/8px micro-grid, ultra-crisp 1px hairline borders (`rgba(255, 255, 255, 0.08)`), and high-contrast typography designed for zero eye-fatigue during 10+ hour deep work sessions.
2. **Keyboard-First Reflex Architecture**: Universal shortcut engine (`C` for new issue, `P` for project, `L` for list, `B` for board, `Cmd+K` palette, arrow navigation, escape stacks).
3. **Tactile Micro-Interactions**: Drag physics with rotation tilts, sub-50ms hover state illumination, 720px side-peek sliding drawer with cubic-bezier spring physics, and animated progress rings.
4. **Zero AI-Slop & Unified Tokens**: Eradication of mismatched corner radii, random neon gradients, or generic unstyled inputs. Every component strictly inherits Plane design tokens.

---

## 2. Plane 1:1 Design Tokens & Theming Matrix

All design primitives map directly to CSS custom properties defined in `app/globals.css` and Tailwind `@theme`:

```css
:root {
  /* ── Canvas & Surface Geometry ── */
  --plane-canvas:             #080c14;  /* Deep space black root background */
  --plane-sidebar:            #0d121f;  /* Primary navigation container */
  --plane-topbar:             #0d1422;  /* Fixed header bar with frosted glass */
  --plane-surface-1:          #0f172a;  /* Elevated panels, modals, dropdowns */
  --plane-surface-2:          #131f38;  /* Card base, active list row, side drawer */
  --plane-surface-hover:      #182645;  /* Interactive hover illumination */
  --plane-surface-active:     #1e2f54;  /* Pressed / selected item state */

  /* ── Border & Hairline Rules ── */
  --plane-border-subtle:      rgba(255, 255, 255, 0.06); /* Dividers, grid lines */
  --plane-border-medium:      rgba(255, 255, 255, 0.12); /* Card outlines, inputs */
  --plane-border-strong:      rgba(255, 255, 255, 0.20); /* Focus rings, popover frames */

  /* ── Brand & Semantic Accents ── */
  --plane-accent:             #00f5d4;  /* Plane cyan signature accent */
  --plane-accent-dim:         rgba(0, 245, 212, 0.12);
  --plane-accent-glow:        rgba(0, 245, 212, 0.25);
  
  /* ── Issue State Colors (Exact Plane Spectrum) ── */
  --plane-state-backlog:      #64748b;  /* Slate 500 */
  --plane-state-todo:         #94a3b8;  /* Slate 400 */
  --plane-state-in-progress:  #f59e0b;  /* Amber 500 */
  --plane-state-done:         #10b981;  /* Emerald 500 */
  --plane-state-canceled:     #ef4444;  /* Rose 500 */

  /* ── Priority Spectrum ── */
  --plane-priority-urgent:    #ef4444;  /* Saturated red with flag icon */
  --plane-priority-high:      #f97316;  /* Vivid orange with 3 signal bars */
  --plane-priority-medium:    #eab308;  /* Amber with 2 signal bars */
  --plane-priority-low:       #3b82f6;  /* Blue with 1 signal bar */
  --plane-priority-none:      #475569;  /* Muted grey with dash */

  /* ── Typography Stack ── */
  --plane-font-display:       'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  --plane-font-mono:          'IBM Plex Mono', 'Geist Mono', monospace;
  --plane-radius-sm:          4px;      /* Pills, tags, kbd shortcuts */
  --plane-radius-md:          8px;      /* Buttons, cards, inputs */
  --plane-radius-lg:          12px;     /* Modals, side drawers, command palette */
  --plane-radius-xl:          16px;     /* Hero cards, dialog containers */
}
```

---

## 3. Component Architecture & File Tree

The UI/UX refactoring and precision alignment spans across `components/ibf/`:

```
components/ibf/
├── layout/
│   ├── ibf-sidebar.tsx                 # 1:1 Plane collapsible sidebar & multi-project tree
│   ├── ibf-topbar.tsx                  # High-density breadcrumbs, live view switchers, tabs
│   ├── ibf-workspace-shell.tsx         # Responsive layout orchestrator & drawer host
│   └── ibf-mobile-drawer.tsx           # Full touch-optimized mobile navigation drawer
├── board/
│   ├── kanban-board.tsx                # Multi-column drag container with column fold
│   ├── kanban-column.tsx               # State icon header, issue count, inline card trigger
│   └── issue-card.tsx                  # 1:1 Plane card: identifier badge, title, priority, subtasks
├── list/
│   ├── list-view.tsx                   # High-density spreadsheet list with grouping & sorting
│   ├── list-group.tsx                  # Collapsible state/priority/cycle accordion groups
│   └── list-row.tsx                    # Ultra-compact row with inline property selectors
├── issues/
│   ├── issue-drawer.tsx                # 720px sliding Side-Peek detail view with backdrop blur
│   ├── issue-modal.tsx                 # Quick issue creator modal (Hotkey: C)
│   ├── issue-subtasks.tsx              # Interactive sub-issues checklist with live progress bar
│   ├── issue-activities.tsx            # Chronological audit timeline & activity log
│   └── issue-comments.tsx              # Rich-text discussion thread with user mentions
├── cycles/
│   ├── cycles-view.tsx                 # Sprints roadmap, active burndown, & status tabs
│   ├── active-cycle-card.tsx           # Live countdown clock, estimate metrics, completion bar
│   ├── cycle-backlog-tray.tsx          # 1-click issue transfer drawer into sprint
│   └── cycle-modal.tsx                 # Sprint creator with datepicker & estimate config
├── modules/
│   ├── modules-view.tsx                # Feature Epics grid with delivery status pills
│   ├── module-card.tsx                 # Lead avatar, module progress donut/bar, target date
│   ├── module-detail-drawer.tsx        # Epic side-sheet with nested issue breakdown
│   └── module-modal.tsx                # Module creator with lead assigner & date range
├── pages/
│   ├── pages-view.tsx                  # Pinned documents shelf, search filter, table catalog
│   ├── page-row.tsx                    # High-density doc row with star, duplicate, delete
│   ├── page-editor.tsx                 # Notion-grade markdown document editor with split preview
│   ├── page-toolbar.tsx                # Rich formatting toolbar (H1-H3, code, task list, tables)
│   └── page-issue-embed.tsx            # Live embedded issue card & # autocomplete dropdown
├── command-palette.tsx                 # Universal Cmd+K fuzzy keyboard navigator & runner
└── ui/                                 # Plane Design System Core Atoms
    ├── plane-button.tsx                # Primary, secondary, danger, ghost with tactile active state
    ├── plane-input.tsx                 # Hairline border, focus ring, leading/trailing icons
    ├── plane-dropdown.tsx              # Popover dropdown with search filter & checkmark selection
    ├── plane-badge.tsx                 # State pills, priority flags, and sequence tags
    ├── plane-tooltip.tsx               # Instant tooltip with optional hotkey badge (<kbd>)
    ├── plane-avatar.tsx                # Profile photo with fallback initials & status ring
    └── plane-progress.tsx              # High-precision linear and radial progress meters
```

---

## 4. Plane 1:1 Detailed UX Specifications

### 4.1 Global Workspace Shell & Navigation

```
┌────────────────────────────────────────────────────────────────────────────────────────────────┐
│ [≡] IBF Foundry ▾   [🔍 Search or type ⌘K]                 [+ New Issue (C)]  [🔔]  [Avatar]   │
├─────────────────┬──────────────────────────────────────────────────────────────────────────────┤
│ ❖ INN-Core ▾    │ ⊞ Board   ≡ List   ⟳ Cycles (2)   ⊡ Modules (4)   📄 Docs (12)   ⚙ Settings  │
│   ⊞ Board       ├──────────────────────────────────────────────────────────────────────────────┤
│   ≡ List        │ Filter ▾   Group by: State ▾   Sort: Priority ▾   Search issues...   [● Live]│
│   ⟳ Sprints (2) │                                                                              │
│   ⊡ Modules (4) │                                                                              │
│   📄 Docs (12)  │                                                                              │
│                 │                                                                              │
│ ❖ Mobile App ▾  │                                                                              │
│ ❖ AI Engine ▾   │                                                                              │
│                 │                                                                              │
│ ─────────────── │                                                                              │
│ 🚩 Your Issues  │                                                                              │
│ 📄 All Docs     │                                                                              │
│ ⚙ Settings      │                                                                              │
└─────────────────┴──────────────────────────────────────────────────────────────────────────────┘
```

#### UX Behaviors:
- **Collapsible Rail**: The 260px sidebar collapses into a slim 56px icon rail via `[Cmd + B]` or clicking the toggle button. Tooltips reveal section names on hover when collapsed.
- **Project Tree Accordion**: Each project expands to reveal sub-views (`Board`, `List`, `Cycles`, `Modules`, `Pages`). Active view is highlighted with `--plane-accent-dim` and a 2px left border marker.
- **Top Bar Tabs**: Switching views updates the browser URL without full-page remounting (`/projects/[id]/board` -> `/projects/[id]/list`) in under 50ms.

---

### 4.2 5-Lane Kanban Board (`components/ibf/board/`)

```
┌────────────────┬────────────────┬────────────────┬────────────────┬────────────────┐
│ BACKLOG  (3)   │ TO DO  (8)     │ IN PROGRESS (4)│ DONE  (19)     │ CANCELED  (1)  │
│ [＋]           │ [＋]           │ [＋]           │ [＋]           │ [＋]           │
├────────────────┼────────────────┼────────────────┼────────────────┼────────────────┤
│ ┌────────────┐ │ ┌────────────┐ │ ┌────────────┐ │ ┌────────────┐ │ ┌────────────┐ │
│ │ INN-12 ⚑   │ │ │ INN-44 ⚑   │ │ │ INN-42 ⚑   │ │ │ INN-39 ⚑   │ │ │ INN-15 ⚑   │ │
│ │ Database   │ │ │ Setup Nginx│ │ │ Supabase   │ │ │ Proxy buff-│ │ │ Deprecated │ │
│ │ migration  │ │ │ reverse    │ │ │ Realtime WS│ │ │ ers config │ │ │ worker node│ │
│ │            │ │ │ proxy      │ │ │            │ │ │            │ │ │            │ │
│ │ [2/4] [👤] │ │ │ [0/2] [👤] │ │ │ [3/3] [👤] │ │ │ [✓ Done]   │ │ │ [✕ Cancel] │ │
│ └────────────┘ │ └────────────┘ │ └────────────┘ │ └────────────┘ │ └────────────┘ │
│                │                │                │                │                │
│ + Add Issue    │ + Add Issue    │ + Add Issue    │ + Add Issue    │ + Add Issue    │
└────────────────┴────────────────┴────────────────┴────────────────┴────────────────┘
```

#### Visual & Tactile Rules:
- **Card Physics**: Dragging a card applies a subtle `rotate(2deg) scale(1.02)` transform with a soft drop shadow (`shadow-2xl shadow-black/80`).
- **Drop Indicators**: Landing zones illuminate with a 2px dashed border in `--plane-accent` and expand with spring animation.
- **Inline Rapid Creator**: Clicking `+ Add Issue` at the bottom of any column immediately transforms into an inline input without opening a modal. Pressing `Enter` creates the issue and keeps focus for the next one; pressing `Esc` dismisses it.
- **Sequence Tag**: Monospace badge `#INN-42` in `--plane-accent` on hover links directly to clipboard copy.

---

### 4.3 720px Side-Peek Detail Drawer (`components/ibf/issues/issue-drawer.tsx`)

Clicking any card in Kanban or row in List View triggers the **Plane 720px Side-Peek**:

```
┌─────────────────────────────────────────────────────────────┬────────────────────────────────────┐
│ [← Board]   #INN-42: Integrate Supabase Realtime WebSockets │ PROPERTIES                         │
├─────────────────────────────────────────────────────────────┼────────────────────────────────────┤
│ Status:  [ ● In Progress ▾ ]    Priority: [ ⚑ Urgent ▾ ]    │ State        [ ● In Progress ▾ ]   │
│ Assignee:[ 👤 Alex Chen ▾ ]     Cycle:    [ Sprint 2 ▾ ]    │ Assignee     [ 👤 Alex Chen ▾ ]    │
│ Module:  [ ⊡ Realtime Engine ▾ ]DueDate:  [ Oct 28, 2026 ▾ ]│ Priority     [ ⚑ Urgent ▾ ]        │
├─────────────────────────────────────────────────────────────┤ Cycle        [ ⟳ Sprint 2 ▾ ]      │
│ DESCRIPTION (Markdown)                                      │ Module       [ ⊡ Realtime Engine ▾]│
│ Implement WebSocket subscriptions for issues, comments,     │ Due Date     [ 📅 Oct 28, 2026 ▾ ] │
│ and documentation pages to eliminate manual polling.        │ Labels       [ + Add Label ]       │
│                                                             │ Estimate     [ 5 Points ▾ ]        │
│ SUBTASKS (3 of 4 completed · 75%)                           ├────────────────────────────────────┤
│ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░░░░░░░                │ CREATED BY                         │
│ [x] Enable realtime publication in PostgreSQL               │ Jatin Chaurasia                    │
│ [x] Write useProjectRealtime React hook                     │ 2 hours ago                        │
│ [x] Handle optimistic UI reconciliation                     │                                    │
│ [ ] Write stress test for 1,000 concurrent sockets          │ ATTACHMENTS (2)                    │
│ + Add new subtask                                           │ 📄 architecture-v2.png             │
├─────────────────────────────────────────────────────────────┤ 📄 load-test-results.pdf           │
│ ACTIVITY & DISCUSSION (4)                                   │                                    │
│ 👤 Jatin Chaurasia changed state to In Progress · 1h ago    └────────────────────────────────────┘
│ 👤 Alex Chen: "PR #84 submitted with reconnection logic."   │
│ [ Write a comment... (Markdown supported)            ] [Post]│
└─────────────────────────────────────────────────────────────┘
```

#### Micro-Interactions:
- **Slide-in Animation**: Slides from right with `transform: translateX(0)` over `200ms cubic-bezier(0.16, 1, 0.3, 1)`.
- **Background Backdrop**: Canvas dims with `backdrop-blur-sm bg-slate-950/60`. Clicking outside closes the drawer.
- **Auto-Save Description**: Edits to the description debounces for 1,000ms and updates Supabase with a subtle `Saving...` indicator.
- **Subtask Progress Meter**: Toggling subtask checkboxes animates the progress bar smoothly.

---

### 4.4 High-Density Spreadsheet List View (`components/ibf/list/`)

```
┌──┬──────────────────────────────────────────┬─────────────┬──────────┬───────────┬──────────────┐
│  │ Issue Title                              │ Identifier  │ State    │ Priority  │ Assignee     │
├──┼──────────────────────────────────────────┼─────────────┼──────────┼───────────┼──────────────┤
│▼ │ ● IN PROGRESS (4 issues)                 │             │          │           │              │
├──┼──────────────────────────────────────────┼─────────────┼──────────┼───────────┼──────────────┤
│☐ │ Integrate Supabase Realtime WebSockets   │ INN-42      │ In Prog  │ ⚑ Urgent  │ 👤 Alex C.   │
│☐ │ Configure wildcard auth cookies          │ INN-36      │ In Prog  │ ⚑ High    │ 👤 Jatin C.  │
│☐ │ Add 128k proxy buffers to Nginx          │ INN-39      │ In Prog  │ ⚑ Medium  │ 👤 Dev Team  │
│☐ │ Implement Notion-grade Markdown editor   │ INN-40      │ In Prog  │ ⚑ High    │ 👤 Jatin C.  │
├──┼──────────────────────────────────────────┼─────────────┼──────────┼───────────┼──────────────┤
│▶ │ ○ TO DO (8 issues)                       │             │          │           │              │
├──┼──────────────────────────────────────────┼─────────────┼──────────┼───────────┼──────────────┤
│▶ │ ✓ DONE (19 issues)                       │             │          │           │              │
└──┴──────────────────────────────────────────┴─────────────┴──────────┴───────────┴──────────────┘
```

#### Features:
- **Collapsible Groups**: Group issues by State, Priority, Assignee, Cycle, or Module with collapsible accordion chevrons.
- **Batch Selection**: Multi-select issues via `Shift + Click` or `Cmd + Click` to apply batch state/priority changes.
- **Inline Editing**: Click directly on State, Priority, or Assignee in the table to open a popover picker without entering the detail view.

---

### 4.5 Universal Command Palette (`Cmd + K`)

- Global instant modal (<50ms open time).
- Keyboard arrows (`↑`, `↓`), `Enter` to navigate, `Esc` to dismiss.
- Categorized result sections: Navigation, Quick Actions, Projects, Sprints, Epics, Docs, Issues.
- Styled hotkey badges: `<kbd>C</kbd>`, `<kbd>P</kbd>`, `<kbd>↵</kbd>`, `<kbd>ESC</kbd>`.

---

## 5. Keyboard-First Navigation Matrix

| Shortcut | Context | Action |
| :--- | :--- | :--- |
| `Cmd + K` / `Ctrl + K` | Universal | Open Universal Command Palette |
| `C` | Global Workspace | Open Quick Issue Creator modal with title autofocus |
| `P` | Global Workspace | Open Quick Project Creator modal |
| `B` | Project Space | Jump to Kanban Board view |
| `L` | Project Space | Jump to List View |
| `D` | Project Space | Jump to Documentation Pages view |
| `Cmd + B` / `Ctrl + B` | Universal | Toggle 260px Sidebar expand / collapse |
| `↑` / `↓` | List / Palette | Navigate highlighted row |
| `Enter` | Selected Item | Open Side-Peek issue drawer or execute command |
| `Escape` | Modal / Drawer / Palette | Dismiss open view and return focus to main canvas |
| `#` | Document Editor | Trigger live issue autocomplete popup |

---

## 6. Verification Checklist & Quality Gates

### Gate 1: Visual Design Token Purity
- [ ] No unstyled native browser inputs or beige/cream backgrounds.
- [ ] Every container, dropdown, and card adheres to the `#080c14` dark precision palette.
- [ ] Borders use 1px hairline rules (`rgba(255, 255, 255, 0.08)`) with unified radii (`2px`, `4px`, `8px`, `12px`).
- [ ] Typography scale conforms to Inter and IBM Plex Mono without italic headers.

### Gate 2: Ergonomic UX & Keyboard Reflexes
- [ ] Pressing `Cmd + K` opens the command palette in `<50ms`.
- [ ] Pressing `C` anywhere outside an input opens the issue creator with cursor in title input.
- [ ] Pressing `Esc` closes any active modal, popover, or the 720px side drawer.
- [ ] Toggling between Kanban and List views updates the URL cleanly with zero page flicker.

### Gate 3: State Machine Complete Coverage
- [ ] Every interactive button and input implements all 8 states:
  - Default
  - Hover (`--plane-surface-hover`)
  - Focus-Visible (`2px solid --plane-accent`)
  - Active (`transform: translateY(1px)`)
  - Disabled (`opacity: 0.5; pointer-events: none`)
  - Loading (integrated spinner)
  - Error (rose border & message)
  - Success (emerald checkmark)

### Gate 4: Production Root Build Integrity
- [ ] `npm run typecheck` passes with code 0.
- [ ] `npm run build` succeeds with zero bundling or dynamic route errors.
- [ ] Zero layout shifting (CLS < 0.05) during optimistic Kanban drag-and-drop.
