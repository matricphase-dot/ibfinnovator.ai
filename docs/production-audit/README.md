# IBF Production Root Audit

**Scope:** full production-readiness audit of the repository at commit `6a17fd2` (`feat: implement production API routes and Supabase database migrations`).

**Mode:** documentation only. This audit made **no** changes to application code, SQL, dependencies, environment files, or production data.

## Read in this order

| # | Report | Contents |
|---|---|---|
| 00 | [Executive Summary](./00-executive-summary.md) | Release verdict, severity counts, top blockers |
| 01 | [Security, Auth & RLS](./01-security-auth-rls.md) | Privilege boundaries, RPC validation, tenant isolation |
| 02 | [Database, Schema & Migrations](./02-database-schema-migrations.md) | Migration ordering, contract drift, type safety |
| 03 | [Backend, API & Reliability](./03-backend-api-reliability.md) | Route handlers, error handling, caching, pagination |
| 04 | [Product Workflows & Data Integrity](./04-product-workflows-data-integrity.md) | Onboarding, projects, review, moderation, deletion |
| 05 | [Services & Integrations](./05-services-integrations.md) | Storage, Redis, email, AI, payments, external APIs |
| 06 | [UI/UX, Accessibility & Responsive Design](./06-ui-ux-accessibility.md) | Design-token migration, navigation, a11y |
| 07 | [Performance, Scale & Caching](./07-performance-scale-caching.md) | Bundle, waterfalls, caching, connection limits |
| 08 | [Testing, CI, Deployment & Operations](./08-testing-ci-deployment-operations.md) | Gate status, lint, DB smoke, dependencies, runbooks |
| 09 | [Placeholders & Fabricated Claims](./09-placeholders-fabricated-claims.md) | Truthfulness of user-facing copy and features |
| 10 | [Root-Fix Roadmap & Acceptance Gates](./10-root-fix-roadmap.md) | Sequenced remediation with verifiable exit criteria |
| 11 | [Verification Evidence Log](./11-verification-evidence.md) | Every command run, exit status, and what it does/does not prove |

## Severity scale

- **P0** — exploitable, data-destroying, launch-blocking, or blocks release. Must be fixed before production traffic.
- **P1** — user-visible breakage, privacy leak, or unsupported product surface. Fix before or immediately after launch.
- **P2** — correctness, maintainability, or performance debt with a bounded workaround.
- **P3** — hygiene and consistency.

## Rules for reading these reports

- Every finding cites a concrete file path and line, verified against the source during this audit (see the verification table in `11`).
- Findings are labelled **Confirmed** (observed in code/config), **Observed at runtime** (a verification command reproduced it), or **Assumption** (inferred, needs live-environment confirmation).
- "Existing control" sections list protections that already work, so remediation does not regress them.
- Prior audit documents (`docs/UI_UX_HALLMARK_AUDIT_REPORT.md`, older `AUDIT_REPORT_PRODUCTION.md`) are **stale** and are cited only as history, never as current evidence.

## Headline blockers (full detail in `00`)

1. Stored XSS — `finalize_onboarding` validates URLs in the route, not in the `security definer` RPC, so clients bypass it.
2. Cross-tenant leak — the university projects API returns every OPEN project platform-wide to any partner key, including `terms_private` ones.
3. Unverifiable database — `db:test` cannot run, so RLS/RPC business rules have no CI enforcement.
4. No mobile navigation — signed-in users below 1024px can reach only notifications and settings.

## Verification status at a glance

| Check | Result |
|---|---|
| `npm run typecheck` | PASS |
| `npm run build` (73 pages) | PASS, with Sentry deprecation warnings |
| `npm run db:check` (static contract) | PASS |
| `node scripts/verify-supabase.mjs` (live) | PASS — 35 tables, 14 anon reads, 5 denied reads |
| `node scripts/verify-upstash.mjs` | PASS |
| `node scripts/build-setup-sql.mjs` | PASS |
| `npm run db:test` (DB smoke) | FAIL — requires a local Supabase CLI/Docker stack |
| `npm run lint` | BLOCKED — no ESLint config/dependency; `next lint` prompts interactively |
| `npm audit --omit=dev --audit-level=moderate` | FAIL — critical Next.js, high PostCSS/brace-expansion, moderate fast-uri |

**Release verdict: not ready for production traffic.** See `00-executive-summary.md`.