# Innovators.ai — Production Build Plan: Master Plan
> **Standard:** Production-Ready · Ponytail Strict (Zero AI-Slop, Zero Bloat, Minimum Necessary Diffs) · October 2026  
> **Strict Execution Rule:** "NO CODE CHANGES IN THIS PLANNING TURN" — All phases below are detailed roadmaps with exact targets, commands, schema, and verification gates.

---

## 1. Executive Summary & Architecture Blueprint

We are refactoring the legacy multi-market platform into a lean, high-velocity Startup Operating System:
1. **Founder & Student Project Management** (Linear/Plane open-source pattern: Workspaces, Projects, Issues, Sprints/Cycles, Kanban/List).
2. **Real-time Team Chat** (Mattermost/Slack pattern: Workspaces, Channels, Direct Messages, Threads, Reactions, Supabase Realtime).
3. **Public Bio/Portfolio Site** (`/@username` public link-in-bio with Cloudflare Edge CDN 1-hour cache and instant purge on update).
4. **AI Assistant Integration** (Inception Labs Mercury 2.5: 1,107 tokens/sec, OpenAI-compatible function calling for PM commands).
5. **Production Infrastructure:** AWS EC2 `c7i-flex.large` (2 vCPU, 4 GiB RAM, 4th Gen Xeon) + Local Redis (`localhost:6379`) + Supabase PostgreSQL & Auth + Cloudflare Edge CDN.

### Key Domain Routing Architecture
- `app.innovator-global.com` -> Authenticated workspace app (`/dashboard`, `/workspace/[id]`, `/chat`, `/projects`).
- `innovator-global.com` -> Public landing page & `/@username` public portfolios (served from Cloudflare Edge cache).

---

## 2. Phase Breakdown Directory

Each phase has a dedicated, self-contained specification file with exact database migrations, API routes, UI components, terminal commands, edge cases, and automated test checks:

| Phase | Phase Plan Document | Core Objective | Primary Tech / Tables |
|---|---|---|---|
| **Phase 0** | [`docs/build-plan/phase-0-cleanup.md`](file:///c:/Users/Admin/Documents/jatin/IBF/innovators.ai/docs/build-plan/phase-0-cleanup.md) | ✅ **Complete** (Passes build & typecheck) | Removed marketplace, mentorship, legacy APIs, dead UI, 54 dead pkgs |
| **Phase 1** | [`docs/build-plan/phase-1-database-schema.md`](file:///c:/Users/Admin/Documents/jatin/IBF/innovators.ai/docs/build-plan/phase-1-database-schema.md) | ✅ **Complete** (Migrated & Verified) | Migrated workspaces, projects, cycles, issues, channels, messages + RLS & types |
| **Phase 2** | [`docs/build-plan/phase-2-subdomain-auth.md`](file:///c:/Users/Admin/Documents/jatin/IBF/innovators.ai/docs/build-plan/phase-2-subdomain-auth.md) | ✅ **Complete** (Passes build & typecheck) | Middleware routing, /@username rewrite to /portfolio/[username], Role RBAC |
| **Phase 3** | [`docs/build-plan/phase-3-project-management.md`](file:///c:/Users/Admin/Documents/jatin/IBF/innovators.ai/docs/build-plan/phase-3-project-management.md) | ✅ **Complete** (Passes build & typecheck) | Kanban Board, List View, Cycles View, Issue Modal, REST APIs |
| **Phase 4** | [`docs/build-plan/phase-4-realtime-chat.md`](file:///c:/Users/Admin/Documents/jatin/IBF/innovators.ai/docs/build-plan/phase-4-realtime-chat.md) | Mattermost Codebase Extraction & Refactor | Channels, DMs, Thread RHS, Hover Toolbar, Supabase Realtime WS |
| **Phase 5** | [`docs/build-plan/phase-5-portfolio-builder.md`](file:///c:/Users/Admin/Documents/jatin/IBF/innovators.ai/docs/build-plan/phase-5-portfolio-builder.md) | Public `/@username` Link-in-Bio & Portfolio | SSR + ISR, Cloudflare Edge Cache Purge API, Founder vs Student theme |
| **Phase 6** | [`docs/build-plan/phase-6-mercury-ai-pm.md`](file:///c:/Users/Admin/Documents/jatin/IBF/innovators.ai/docs/build-plan/phase-6-mercury-ai-pm.md) | Mercury 2.5 AI Assistant | Function calling, automated issue creation, sprint summaries |
| **Phase 7** | [`docs/build-plan/phase-7-production-deploy.md`](file:///c:/Users/Admin/Documents/jatin/IBF/innovators.ai/docs/build-plan/phase-7-production-deploy.md) | Production setup on `c7i-flex.large` + Redis | Nginx, PM2 Cluster, Local Redis, Cloudflare DNS & SSL Strict, CI/CD |

---

## 3. Strict Execution Principles (Ponytail Rules)
1. **Deletion beats addition:** Before writing a new module, delete obsolete legacy files and imports so the TypeScript compiler surface is clean.
2. **Re-use existing stack:** Use existing `@supabase/ssr`, Tailwind/CSS variables, `lucide-react`, `zod`, and Radix UI primitives. Zero new utility libraries for simple tasks.
3. **No placeholders or mock data in production paths:** Every component must bind to real Supabase tables or explicit empty states.
4. **Validation at boundaries:** Zod schemas for all API payloads; strict Supabase Row Level Security (RLS) on every table.
5. **Self-check before finishing each phase:** Every phase must pass `npm run typecheck` and `npm run build` with zero regressions.
