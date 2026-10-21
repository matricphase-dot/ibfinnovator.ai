# Phase 5: Pages (Docs Engine) & Universal Command Palette (Cmd+K)

> **Platform Target**: `app.innovators-global.com`  
> **Source Baseline**: `makeplane/plane` (`apps/web/core/components/pages`, `apps/web/core/components/command-palette`)  
> **Status**: Ready for Production Execution  

---

## 1. Overview & Objective

Implement Plane's collaborative Pages & Documentation engine for Product Requirement Docs (PRDs), meeting notes, and architecture specs, coupled with a universal **`Cmd+K` Command Palette** for rapid keyboard-first navigation and actions across the entire IBF Workspace.

---

## 2. Component Architecture & File Tree

All documentation and command palette components reside under `components/ibf/`:

```
components/ibf/
├── pages/
│   ├── pages-view.tsx              # Document catalog (Pinned, Recent, All Docs)
│   ├── page-row.tsx                # High-density document list row with actions
│   ├── page-editor.tsx             # Notion-grade markdown document editor
│   ├── page-toolbar.tsx            # Rich text formatting toolbar (H1, H2, Bold, Code, Lists)
│   └── page-issue-embed.tsx        # Inline embedded issue card within document
└── command-palette.tsx             # Universal Cmd+K keyboard navigator & action runner
```

---

## 3. Detailed Component Specifications

### 3.1 IBF Pages Engine (`components/ibf/pages/pages-view.tsx`)

#### Document Catalog Features:
1. **Pinned / Favorite Documents**:
   - Starred documents appear in a quick-access carousel at the top of the view.
2. **Recent Documents Table**:
   - Title with document icon.
   - Author avatar and full name.
   - Last modified relative timestamp ("3 hours ago").
   - Quick action menu: Star/Favorite, Copy Link, Duplicate, Delete.
3. **Primary Action**:
   - `+ New Page` button creates a new record in `public.pages` and navigates into the editor immediately.

#### The Notion-Style Document Editor (`page-editor.tsx`):
```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ [← Back to Docs]   [ ★ Favorite ]   [ ☁ Saved to Cloud ]   [ ⛶ Fullscreen ]   [ Share ]│
├────────────────────────────────────────────────────────────────────────────────────────┤
│ Title: IBF Plane Engine Architecture & API Specification                               │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ [ H1 ] [ H2 ] [ Bold ] [ Italic ] [ Code ] [ Checklist ] [ Quote ] [ Link ] [ # Issue ] │
├────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                        │
│ # Architecture Overview                                                                │
│ The IBF project management engine replaces Django microservices with Supabase          │
│ PostgreSQL and Next.js 15 App Router.                                                  │
│                                                                                        │
│ ## Key Engineering Principles                                                          │
│ - [x] All sequence IDs use project identifier prefix (e.g., INN-1)                     │
│ - [x] Dark precision canvas palette (#080c14)                                          │
│ - [ ] Sub-150ms optimistic state updates on Kanban drag                                │
│                                                                                        │
│ ```typescript                                                                          │
│ export function handleIssueDrop(issueId: string, newState: IssueState) {               │
│   // Optimistic local update                                                           │
│ }                                                                                      │
│ ```                                                                                    │
│                                                                                        │
│ Relevant issue: #INN-42 [ Integrate Supabase Realtime WebSockets · In Progress ]      │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

#### Editor Capabilities:
- **Auto-Save Engine**: Edits to the title and body are debounced and saved to Supabase every 2,000ms. A subtle status pill toggles between `Saving...` and `Saved to Cloud`.
- **Live Markdown Support**: Full GitHub Flavored Markdown (GFM) including task lists, blockquotes, syntax highlighting for 20+ programming languages, and tables.
- **Embedded Issue Cards**: Typing `#INN-` opens an autocomplete dropdown that embeds a live, interactive issue pill directly into the document text.

---

### 3.2 Universal Command Palette (`components/ibf/command-palette.tsx`)

Activated globally from anywhere in the application via **`Cmd + K`** (macOS) or **`Ctrl + K`** (Windows/Linux).

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ 🔍 Type a command or search issues, projects, cycles...                       [ ESC ]  │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ NAVIGATION                                                                             │
│ ⊞ Go to Kanban Board                                                         Jump to   │
│ ≡ Go to List View                                                            Jump to   │
│ ⟳ Go to Active Cycles                                                        Jump to   │
│ ⊡ Go to Feature Modules                                                      Jump to   │
│ 📄 Go to Documentation Pages                                                 Jump to   │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ QUICK ACTIONS                                                                          │
│ ＋ Create New Issue                                                          Hotkey C  │
│ ✦ Create New Project                                                         Hotkey P  │
│ 📄 Create New Document                                                       Action    │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ RECENT ISSUES                                                                          │
│ INN-42: Integrate Supabase Realtime WebSockets                             In Progress │
│ INN-39: Add 128k proxy buffers to Nginx configuration                             Done │
│ INN-36: Configure cross-subdomain authentication cookies                          Done │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

#### Navigation & Shortcut Rules:
- **Fuzzy Search**: Instantly searches across:
  - Issue IDs and titles (e.g. `INN-42`, `login crash`)
  - Project names
  - Cycle names (`Sprint 2`)
  - Module titles (`Auth Engine`)
  - Documentation page titles
- **Keyboard Handling**:
  - `↑` and `↓`: Move selection highlight.
  - `Enter`: Execute highlighted action or navigate to selected item.
  - `Escape`: Close palette.

---

## 4. API Endpoints Specification

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/projects/[id]/pages` | List all documentation pages for a project |
| `POST` | `/api/projects/[id]/pages` | Create new documentation page |
| `GET` | `/api/pages/[pageId]` | Fetch document markdown content and metadata |
| `PATCH` | `/api/pages/[pageId]` | Auto-save document title, markdown, and favorite status |
| `DELETE`| `/api/pages/[pageId]` | Delete document |
| `GET` | `/api/workspace/search?q={query}` | Global fuzzy search endpoint for `Cmd+K` palette |

---

## 5. Verification Checklist

- [ ] Pressing `Cmd+K` (or `Ctrl+K`) anywhere in the workspace opens the command palette in under 50ms.
- [ ] Typing an issue ID (e.g. `INN-1`) or keyword searches across all projects and displays results.
- [ ] Creating a page creates a new row in `public.pages` and opens the editor.
- [ ] Document auto-saves edits to Supabase without manual save buttons.
- [ ] Embedded issue references render as interactive cards inside the document.
