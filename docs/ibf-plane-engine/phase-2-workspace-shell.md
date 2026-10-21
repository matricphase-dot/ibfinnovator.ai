# Phase 2: Authentic IBF Workspace Shell (Plane Navigation Clone)

> **Platform Target**: `app.innovators-global.com`  
> **Source Baseline**: `makeplane/plane` (`packages/ui/src/sidebar`, `packages/ui/src/breadcrumbs`, `apps/web/core/components/workspace`)  
> **Status**: Ready for Production Execution  

---

## 1. Overview & Objective

Replace the legacy, fragmented navigation with Plane.so's authentic **Workspace Navigation Architecture**. Provide seamless workspace-level and project-level navigation, collapsible project trees with live issue badges, dynamic breadcrumbs, keyboard shortcuts (`Cmd+K`, `C`), and responsive mobile drawers.

---

## 2. Visual Layout Architecture

```
┌───────────────────────────────────────────────────────────────────────────────────────────────────┐
│ [IBF Logo] IBF Foundry ▼  │  Breadcrumbs: Foundry > Innovator (INN) > Issues    [🔍 Cmd+K] [+ Issue] │
├───────────────────────────┼───────────────────────────────────────────────────────────────────────┤
│ GLOBAL VIEWS              │ View Tabs: [⊞ Board] [≡ List] [⟳ Cycles (2)] [⊡ Modules (4)] [📄 Docs]│
│ ⌂ Home / Overview         ├───────────────────────────────────────────────────────────────────────┤
│ ⚑ Your Issues             │ MAIN WORKSPACE CANVAS (Dark Precision: #080c14)                       │
│ 🔔 Notifications          │                                                                       │
│                           │                                                                       │
│ PROJECTS                  │                                                                       │
│ ▼ ✦ Innovator Engine (INN)│                                                                       │
│   ├── ⊞ Issues (18)       │                                                                       │
│   ├── ⟳ Cycles (2 active) │                                                                       │
│   ├── ⊡ Modules (4)       │                                                                       │
│   ├── 📄 Pages (7)        │                                                                       │
│   ├── 📊 Analytics        │                                                                       │
│   └── ⚙ Settings          │                                                                       │
│ ▶ ✦ Mobile App (MOB)      │                                                                       │
│ ▶ ✦ AI Copilot (COP)      │                                                                       │
│ ＋ Create New Project     │                                                                       │
├───────────────────────────┤                                                                       │
│ [JP] Jatin Patel ▼        │                                                                       │
└───────────────────────────┴───────────────────────────────────────────────────────────────────────┘
```

---

## 3. Component Architecture & File Tree

All shell components are encapsulated under `components/ibf/layout/`:

```
components/ibf/layout/
├── ibf-sidebar.tsx                 # Core multi-level workspace navigation
├── ibf-topbar.tsx                  # Breadcrumbs, view switcher tabs, Cmd+K trigger
├── ibf-project-tree.tsx            # Recursive collapsible project hierarchy with badges
├── ibf-workspace-switcher.tsx      # Popover dropdown to switch or create workspaces
├── ibf-user-menu.tsx               # Profile avatar, status indicator, logout popover
└── ibf-mobile-drawer.tsx           # Off-canvas sliding drawer for mobile & tablet
```

---

## 4. Component Technical Specifications

### 4.1 Workspace Sidebar (`components/ibf/layout/ibf-sidebar.tsx`)

#### State & Props:
```typescript
interface IbfSidebarProps {
  currentWorkspace: {
    id: string;
    name: string;
    slug: string;
    logo_url?: string;
  };
  projects: Array<{
    id: string;
    name: string;
    identifier: string;
    emoji?: string;
    issue_count: number;
    active_cycle_count: number;
  }>;
  activeProjectId?: string;
  activeSection?: 'issues' | 'cycles' | 'modules' | 'pages' | 'analytics' | 'settings';
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}
```

#### Behavior & Interactions:
1. **Workspace Header**:
   - Displays workspace name with IBF monogram icon.
   - Click opens `<IbfWorkspaceSwitcher />` listing user's workspaces and `+ Create New Workspace`.
2. **Global Navigation Links**:
   - `Home / Overview` (`/dashboard`): Cross-project activity and summary metrics.
   - `Your Issues` (`/your-issues`): Issues assigned to the current user across all projects.
   - `Notifications` (`/notifications`): Unread mentions and status updates.
3. **Collapsible Project Tree**:
   - Each project renders with its icon/identifier (e.g. `INN`).
   - Clicking the caret toggles expansion of child routes (`Issues`, `Cycles`, `Modules`, `Pages`, `Settings`).
   - Hovering a project reveals a quick `+` button that opens the issue creator pre-set to that project.
4. **Create Project Button**:
   - Direct button in sidebar to launch project creation modal.
5. **User Profile Footer**:
   - Displays user avatar, name, and green online indicator.
   - Popover contains: Account Settings, Theme Switcher, Workspace Invite, and Log Out.

---

### 4.2 Workspace Topbar (`components/ibf/layout/ibf-topbar.tsx`)

#### State & Props:
```typescript
interface IbfTopbarProps {
  workspaceName: string;
  projectName?: string;
  projectIdentifier?: string;
  activeView: 'board' | 'list' | 'cycles' | 'modules' | 'pages' | 'settings';
  onViewChange: (view: 'board' | 'list' | 'cycles' | 'modules' | 'pages' | 'settings') => void;
  onOpenCommandPalette: () => void;
  onOpenCreateIssue: () => void;
  counts?: {
    issues: number;
    cycles: number;
    modules: number;
    pages: number;
  };
}
```

#### Key Capabilities:
1. **Dynamic Breadcrumbs**:
   - `Workspace` > `Project (Identifier)` > `Active View`.
   - Clickable breadcrumbs allow navigating back up the hierarchy.
2. **Universal Search Trigger (`Cmd+K`)**:
   - Centered input mockup displaying `Search or jump to...` with `⌘K` keyboard badge.
   - Clicking opens the full `<CommandPalette />`.
3. **Project View Navigation Tabs**:
   - Horizontal tab bar directly under breadcrumbs:
     - `⊞ Board` (Kanban drag-and-drop)
     - `≡ List` (Linear-style high-density table)
     - `⟳ Cycles` (Active sprint countdown & burndown)
     - `⊡ Modules` (Feature epics & milestones)
     - `📄 Pages` (Collaborative PRDs & notes)
     - `⚙ Settings` (Project members & labels)
   - Active tab highlighted with `#00f5d4` bottom border and cyan text.
4. **Primary Quick Action (`+ New Issue`)**:
   - High-contrast button in top-right corner.
   - Keyboard listener binds global key `C` to trigger this modal from anywhere.

---

## 5. CSS Design System & Token Integration

Defined in `app/globals.css`:

```css
/* IBF Plane Workspace Theme Tokens */
:root {
  --ibf-canvas: #080c14;            /* Main content area */
  --ibf-sidebar: #0d121f;           /* Sidebar navigation */
  --ibf-topbar: #0d1422;            /* Top navigation bar */
  --ibf-surface: #111a2e;           /* Cards, dropdowns, panels */
  --ibf-surface-hover: #16223b;     /* Interactive hover state */
  --ibf-surface-active: #1b2947;    /* Selected row or active tab */
  
  --ibf-border-subtle: rgba(255, 255, 255, 0.06);
  --ibf-border-medium: rgba(255, 255, 255, 0.12);
  
  --ibf-brand: #00f5d4;             /* IBF Cyan Accent */
  --ibf-brand-dim: rgba(0, 245, 212, 0.1);
  
  --ibf-text-primary: #f8fafc;
  --ibf-text-secondary: #94a3b8;
  --ibf-text-muted: #64748b;
}
```

---

## 6. Migration from Legacy `Sidebar.tsx` to `IbfSidebar`

1. Deprecate `components/Sidebar.tsx` which contained outdated prototype links (`/team`, `/meetings`, `/explore-projects`).
2. Update `components/AppShell.tsx` and `app/dashboard/layout.tsx` to import and render `components/ibf/layout/ibf-sidebar.tsx` and `components/ibf/layout/ibf-topbar.tsx`.
3. Wrap main content area with `<main className="flex-1 bg-[#080c14] overflow-y-auto">`.

---

## 7. Verification Checklist

- [ ] Workspace sidebar renders correctly on desktop (260px fixed width).
- [ ] Clicking on any project expands its child links (`Issues`, `Cycles`, `Modules`, `Pages`).
- [ ] View tabs switch smoothly without full-page reloads.
- [ ] Pressing `Cmd+K` (or `Ctrl+K`) opens the command palette.
- [ ] Pressing `C` on the keyboard opens the issue creation modal.
- [ ] Zero presence of legacy cyber-neon or cream paper styling.
