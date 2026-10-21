# Phase 4: Sprints (Cycles) & Epics (Modules) Engine

> **Platform Target**: `app.innovators-global.com`  
> **Source Baseline**: `makeplane/plane` (`apps/web/core/components/cycles`, `apps/web/core/components/modules`)  
> **Status**: Ready for Production Execution  

---

## 1. Overview & Objective

Implement Plane's Sprint (Cycles) and Feature Epics (Modules) engine. Deliver sprint planning, burndown velocity analytics, live countdown clocks, backlog assignment trays, and feature roadmap tracking inside the IBF Workspace.

---

## 2. Component Architecture & File Tree

All cycle and module components reside under `components/ibf/`:

```
components/ibf/
├── cycles/
│   ├── cycles-view.tsx             # Main sprint hub (Active, Upcoming, Completed)
│   ├── active-cycle-card.tsx       # Live countdown, burndown bar, and metrics
│   ├── cycle-modal.tsx             # Create & Edit sprint modal
│   ├── cycle-backlog-tray.tsx      # Split drawer to transfer issues from Backlog to Sprint
│   └── cycle-complete-modal.tsx    # End-of-sprint wizard (rollover unfinished issues)
└── modules/
    ├── modules-view.tsx            # Epics roadmap table & cards
    ├── module-card.tsx             # Epic progress bar, lead avatar, and issue count
    ├── module-modal.tsx            # Create & Edit epic modal
    └── module-detail-drawer.tsx    # Side-peek listing all issues linked to an epic
```

---

## 3. Detailed Component Specifications

### 3.1 Cycles (Sprints) Engine (`components/ibf/cycles/cycles-view.tsx`)

#### Sprint Lifecycle:
- `Draft`: Planned upcoming sprint (dates scheduled, scope being defined).
- `Active`: Currently active sprint. Only one cycle can be active at a time per project.
- `Completed`: Archived sprint with immutable velocity record.

#### Active Cycle Dashboard:
```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ ACTIVE CYCLE: Sprint 4 · Realtime Synchronization                                      │
│ Oct 19, 2026 – Nov 02, 2026                                                            │
├──────────────────────────┬─────────────────────────────┬───────────────────────────────┤
│ ⏱ TIME REMAINING        │ 📈 SCOPE COMPLETION         │ 🎯 STORY POINTS               │
│ 5 Days 14 Hours Left     │ 9 of 14 Issues Done (64%)   │ 28 of 42 Points (66%)         │
├──────────────────────────┴─────────────────────────────┴───────────────────────────────┤
│ PROGRESS DISTRIBUTION                                                                  │
│ [████████████████████████░░░░░░░░░░░░░░░░░░] 64% Complete                              │
│ • Done: 9 issues (64%)   • In Progress: 3 issues (21%)   • To Do: 2 issues (15%)       │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ [ + Add Issues from Backlog ]            [ Complete Sprint 🏁 ]                        │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

#### Key Cycle Features:
1. **Live Countdown Clock**:
   - Calculates time remaining based on `end_date` and client system clock.
   - Highlights in amber if `< 48 hours` remain, or red if overdue.
2. **Interactive Backlog Assignment Tray (`cycle-backlog-tray.tsx`)**:
   - Split panel view:
     - Left: Current cycle issue list.
     - Right: Unassigned project backlog issues.
   - Users can click `+ Add to Sprint` or drag issues directly into the active cycle.
3. **Sprint Completion Wizard (`cycle-complete-modal.tsx`)**:
   - Triggered when user clicks `Complete Sprint`.
   - Shows summary: Completed issues vs. Incomplete issues.
   - Offers 2 actions for uncompleted issues:
     - Move to Next Sprint (`Sprint 5`).
     - Return to Project Backlog.
   - Marks current sprint `completed` and records end timestamp.

---

### 3.2 Modules (Feature Epics) Engine (`components/ibf/modules/modules-view.tsx`)

Modules represent high-level business initiatives, feature epics, or architectural milestones:

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ MODULE: Auth Engine & Subdomain Routing                                                │
│ Status: In Progress   Lead: (JP) Jatin P.   Target: Oct 28, 2026                       │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ PROGRESS: 5 of 6 Issues Completed · 83%                                                │
│ [████████████████████████████████░░░░░░] 83%                                           │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ LINKED ISSUES                                                                          │
│ ☑ INN-12: Configure wildcard cookies on .innovators-global.com               [Done]    │
│ ☑ INN-15: Provision Nginx 128k proxy buffers to prevent 502 Bad Gateway       [Done]    │
│ ☑ INN-18: Sync Supabase user metadata profiles table                          [Done]    │
│ ☐ INN-21: Multi-tab session broadcast channel                                 [To Do]   │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

#### Key Module Features:
1. **Automated Progress Calculation**:
   - Aggregates all issues where `module_id = module.id`.
   - Calculates percentage completed: `(done_issues / total_issues) * 100`.
2. **Status Workflow**:
   - `Planned` (`#64748b` - Gray)
   - `In Progress` (`#38bdf8` - Sky blue)
   - `Completed` (`#10b981` - Emerald green)
   - `Paused` (`#f59e0b` - Amber)
3. **Lead Ownership**:
   - Assignee avatar with tooltip indicating the module owner.

---

## 4. API Endpoints Specification

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/projects/[id]/cycles` | List all project cycles with issue counts |
| `POST` | `/api/projects/[id]/cycles` | Create new sprint cycle |
| `PATCH` | `/api/projects/[id]/cycles/[cycleId]` | Start cycle, update dates, or complete sprint |
| `DELETE`| `/api/projects/[id]/cycles/[cycleId]` | Delete cycle |
| `POST` | `/api/cycles/[cycleId]/issues` | Batch assign issues to cycle |
| `GET` | `/api/projects/[id]/modules` | List all feature epics with progress metrics |
| `POST` | `/api/projects/[id]/modules` | Create new module / epic |
| `PATCH` | `/api/projects/[id]/modules/[moduleId]` | Update module status, lead, or target date |
| `DELETE`| `/api/projects/[id]/modules/[moduleId]` | Delete module |

---

## 5. Verification Checklist

- [ ] Creating a sprint displays it under the Cycles tab with correct date range.
- [ ] Active sprint displays real-time countdown clock and percentage progress bar.
- [ ] Backlog drawer allows transferring issues into the active cycle in 1 click.
- [ ] Completing a sprint moves incomplete tasks to the next sprint or backlog.
- [ ] Modules calculate completion percentage based on linked issues.
