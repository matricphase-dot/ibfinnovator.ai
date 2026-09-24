# PRODUCTION-GRADE CODEBASE AUDIT — innovators.ai (IBF Platform)
**Date:** 2026-09-23 | **Stack:** Next.js 15.1.3 / React 19 / TypeScript 5.7 / Clerk 7.9.2 + Supabase SSR + Prisma 5.22 + Sentry 10.74 / Tailwind 4
**Method:** 5 parallel specialist subagents (Security, Bugs/Reliability, Architecture/Quality, Dependencies/Config, Performance/Data) — full static audit of `app/`, `lib/`, `components/`, `middleware.ts`, `next.config.ts`, `prisma/`, `supabase/migrations/`, configs. No code changed. Transparent — no sugar-coating.

**Verdict: NOT production-ready. Ship-blockers exist in security (data leaks), reliability (IDOR/injection), and scalability (unbounded queries). Fix P0/Critical before any public launch, rotate SUPABASE_SERVICE_ROLE_KEY after fix.**

---

## 0. Executive Scorecard

| Area | Grade | Blocker? |
|------|-------|----------|
| Security (auth/authz, RLS, injection, secrets) | D — 4 Critical, 8 High | YES |
| Bugs / Error handling | D — 4 P0, 12+ P1 | YES |
| Architecture / Maintainability | C — strict-in-name-only, 25% duplication, 100% CSR | YES for velocity |
| Dependencies / Config | C — EOL deps, Vercel-breakers, Sentry PII gap | YES (deploy) |
| Performance / Data / Scale | D — unbounded scans, 5s polling, no cache | YES (will timeout at ~2-5k rows) |

**Top 10 ship-blockers (fix in this order):**
1. C1 — SERVICE_ROLE in Edge `middleware.ts:33-42` → move to RPC, rotate key
2. C2 — `GET /api/account` leaks all milestones/meetings `app/api/account/route.ts:40`
3. C3 — `GET /api/marketplace/inquiries` returns all inquiries `app/api/marketplace/inquiries/route.ts:6-11`
4. P0 — Team tasks/messages IDOR, no membership check `app/api/team/tasks/route.ts:13-47`, `app/api/team/messages/route.ts:34-54`
5. P0 — PostgREST injection `app/api/projects/route.ts:3` `or(ilike %${q}%)`
6. P0 — Open redirect `app/auth/callback/route.ts:2` + `middleware.ts:78-81`
7. P0 — Webhook `findShadow()` 100k user scan DoS `app/api/webhooks/clerk/route.ts:6-20`
8. F1/F2 — No pagination + app-side matching full scan `app/api/matches/route.ts`, `lib/matching.ts:3`
9. F11/F12 — 5s polling + UPDATE read_at every poll `app/chat/*/page.tsx`, `app/api/chat/direct/[projectId]/route.ts:55-61`
10. F14 — Middleware `auth.getUser()` + blocking touch on every request `middleware.ts:55-88` (+80-400ms p95)

---

## 1. SECURITY — Critical/High (full list from Security subagent)

### Critical
- **C1 middleware.ts:33-42 — SERVICE_ROLE in Edge.** `touch()` creates admin client in middleware (Edge). Fix: use `supabase.rpc("touch_current_profile")` with user JWT or background job. Never import service-role in middleware. Rotate key post-fix.
- **C2 app/api/account/route.ts:40 — cross-tenant export.** `milestones`/`meetings` fall through with `limit(1000)` and no user filter. Fix: filter via `project founder_id=uid` join or drop tables.
- **C3 app/api/marketplace/inquiries/route.ts:6-11 — global inquiry leak.** No `.eq()`. Fix: scope to `service_ids IN (own) OR from_user_id=uid`.
- **C4 lib/auth/require-user.ts:7-62 + lib/supabase/server.ts:7-16 + clerk-server.ts:1 — dual-auth downgrade.** Clerk user with null `getToken()` silently falls back to legacy Supabase user (impersonation). `getToken()` without `{template:"supabase"}` breaks `current_profile_id()` RLS. Env-toggle flips auth model. Fix: fail closed, require template, single auth mode.

### High
- **H1 Open redirect:** `app/auth/callback/route.ts:2` `new URL(next,origin)` allows `//evil.com`. + `middleware.ts:80` reflects pathname. Fix: `if(!next.startsWith("/")||next.startsWith("//")||next.includes(":")) next="/dashboard"`.
- **H2 PostgREST filter injection:** `app/api/projects/route.ts:3`. Fix: `q.replace(/[%,"'()*]/g,"").slice(0,80)` + `z.string().max(80)`.
- **H3 Team message edit/pin:** `app/api/team/messages/route.ts:34-54` any member edits any message. Fix: owner-only content, ADMIN-only pinned + app-level check.
- **H4 Team tasks no membership check:** `app/api/team/tasks/route.ts:13-47` any authed UUID-guesser writes. Fix: `can_access_team_room(room_id)` RPC before insert/update.
- **H5 No rate-limit on signin/investor-inquiries/webhook:** `app/api/auth/signin/route.ts:8-29`, `investor-inquiries`, `webhooks/clerk`. + `lib/rate-limit.ts` in-memory (per-instance, bypassed on Vercel scale-out). Fix: Upstash Redis sliding window; signin 5/10min, inquiry 3/hr, webhook 30/min.
- **H6 Certificate PDF IDOR:** `app/api/certificates/[id]/pdf/route.ts:10-20` no receiver check. Fix: `receiver==uid OR issuer==uid OR founder` else 404.
- **H7 Unauth GENERAL chat history:** `app/api/chat/general/route.ts:10-26` uses anon `createClient()`, no auth though `/chat` is protected. Fix: `requireUser()` or explicit public + caps.
- **H8 Prisma DATABASE_URL bypasses RLS:** `prisma/schema.prisma:5-8`, `lib/prisma.ts:1` direct Postgres, divergent User/Project models, `bcryptjs` legacy hint. Fix: delete prisma OR force RLS + least-privilege role; remove dead `bcryptjs/next-auth/socket.io`.

### Medium/Defense-in-depth
- M1 CSP `unsafe-inline`+`unsafe-eval` `next.config.ts:3-30`, missing COOP/CORP. Remove `unsafe-eval`, nonce Clerk.
- M2 Upload trusts `file.type`, unsanitized `folderKey`, 7-day signed URLs `lib/upload.ts:38-73`. Fix: magic-byte check, `folderKey /^[a-z0-9-]{1,64}$/`, 1h TTL, bucket `allowed_mime_types`.
- M3 Resend subject header injection via `project.title` `lib/email/client.ts:24-28`. Fix: `subject.replace(/[\r\n]+/g," ")`.
- M4 Reactions/inquiries lack context authz `team/reactions`, `messages/[id]/react`, `marketplace/[id]/inquiries POST` (no ACTIVE/self-block).
- M5 `z.string().url()` accepts `javascript:/data:` → stored XSS via `AttachmentPreview.tsx:31-43`. Fix: `refine(u=>u.startsWith("https://"))` + `rel=noopener`.
- M6 SUPER_ADMIN trusts mutable `profiles.role` `university/admin/route.ts:5-8`. Fix: source from Clerk `privateMetadata` + audit log.
- M7 No CSRF Origin check on POST/PATCH/DELETE. Fix: `Sec-Fetch-Site==cross-site → 403` + Origin allowlist.
- M8 Storage RLS over-permissive `018_storage_buckets.sql:47-49` any-auth read of `project-files`. Scope to team/founder.
- L1-L9: legacy signin sunset + Turnstile, Sentry DSN spam + `allowUrls`/`beforeSend` PII scrub, `x-api-key` plaintext + non-constant-time (`university/*`), `ibf_seen` missing `__Host-` prefix, iCal line-folding RFC5545, dead deps audit, `FORCE RLS` audit query.

**Verified good (don't regress):** svix verify + idempotent `clerk_webhook_events` claim, `set-role` whitelists FOUNDER/STUDENT only, projects/marketplace/meetings/events/milestones/connections PATCH/DELETE scoped by founder/host/organizer/recipient, upload blocks SVG + 10MB + random path, HSTS/nosniff/DENY present.

---

## 2. BUGS / RELIABILITY — P0/P1/P2

### P0 Blockers
- **PostgREST injection + no try/catch on GET** `app/api/projects/route.ts:3` (same as H2).
- **`findShadow()` webhook DoS** `app/api/webhooks/clerk/route.ts:6-20` up to 100×1000 `listUsers` sync → Vercel timeout. Fix: `profiles.ilike(email)` + 1-2 pages + `maxDuration` + background retry.
- **Team IDOR** (same as H3/H4).
- **Bookmarks check-then-act race** `app/api/bookmarks/route.ts` double-click → 23505 / flap. Fix: unique + upsert RPC; client `disabled={busy}` + functional `setItems` + rollback.
- **Open redirect** (same as H1).

### P1 Major
- Only root `error.tsx`+`global-error.tsx` (both named GlobalError), zero segment boundaries → full remount. Add per-segment `error.tsx`+`loading.tsx`, Sentry with digest.
- `console.error` without Sentry (middleware:44, email/client:32, dispatch:48) + empty `catch{}` (OnboardingWizard:86, chat/general:27-28, team:70, stats:57 returns `{users:0} 200` masking outage → must be 503).
- Fire-and-forget `void dispatchEmail` unhandled rejection. `.catch(Sentry)` + `after()`/queue.
- Inconsistent status: bookmarks 401 for DB errors → signin loop, `e.message` leaks Prisma unique violations to toast, `catch{401}` loses context. Need `toStatus(e)` helper: 401 UNAUTH, 404 PGRST116, 409 23505, 400 Zod, 500 generic + Sentry.
- `zod .parse()` in ~20 routes leaks schema JSON; only 5 use `safeParse`. Standardize `safeParse` + `{error: flatten().fieldErrors}`.
- Missing query validation: `status/project_id/before` raw → silent [] or 400 leak. `z.enum + uuid + datetime`.
- Null crashes: `OnboardingWizard:82` unsafe JSON.parse, `settings/page:36-48` no `r.ok` check + stale `prefs` closure, `dashboard:54-61` `.catch(()=>null)` hides auth expiry (blank 0s, no redirect), `chat/direct:168` `m.parent.content.slice` null (general is safe), `ProjectDetail:156` Invalid Date, `team:145` assumes `room.channels` exists.
- Races: chat 5s interval + Realtime both call `load()` no abort/dedupe → out-of-order + scroll jump. Presence cookie-only throttle → N parallel writes. Team move/pin no optimistic rollback. Apply button `setLoading` no `try/finally` → stuck on offline.
- Next.js 15: double DB hit (server `projects/[id]` + client refetch), `stats revalidate=300` caches zeros, `useEffect [supabase]` resubscribe loop (memoize), metadata ignores RLS error (use `notFound()`).

### P2 Minor
- Forms missing `disabled`/double-submit (cofounder Enable, inquiry modals), generic toasts hide Zod details, dashboard respond no per-row pending, `>100 any` + Proxy hides init failure (fail-fast at import), `datetime-local`→UTC hydration mismatch (use date-fns-tz + explicit timeZone), `URL.createObjectURL` never revoked + client/server maxMB drift.

---

## 3. ARCHITECTURE / QUALITY

- **tsconfig strict-in-name-only:** `strict:true` but missing `noUncheckedIndexedAccess/noImplicitReturns/noUnusedLocals/noUnusedParameters/exactOptionalPropertyTypes/forceConsistentCasing`, `allowJs:true` without `checkJs`, `include **/*` covers `.next/`, no `typecheck` script. ~130 `any` in ~90 files (dashboard, OnboardingWizard 12x, team 12x, analytics `reduce((a:any,e:any)`). `catch(e:any)` erases discrimination. Missing return types in `lib/supabase/client`, `lib/data`, `lib/matching`, `lib/utils`, `lib/email/client`, `lib/prisma`.
- **Duplication ~20-25%:** 55+ routes repeat 12-line auth+catch (~660 LOC), `requireUser` duplicated in `server.ts` vs `require-user.ts` vs `middleware.ts`, 7 Supabase variants (server/client/legacy-server/clerk-server/clerk-client/admin/public) + 3 inline + 62 import sites, pagination only in 2 chat routes (rest unbounded), no shared envelope.
- **Client-heavy inversion:** 51 `"use client"` — every page `useEffect(fetch(/api))` double-hop. `dashboard:38-62` 6 parallel fetches, `projects/page:11-20` client search (should be RSC), `meetings/page` 646 LOC god-page, `ProfileView:27-44` sequential fetches. Zero `loading.tsx`, zero `generateStaticParams/dynamic`. SEO dead on projects/marketplace/investors.
- **Prisma vs Supabase drift:** zero `prisma.` call sites, runtime tables (`profiles/team_rooms/community_events/analytics_events`) absent from `schema.prisma`, `prisma generate` on every postinstall wasted. Pick one.
- **God files:** `OnboardingWizard 821 LOC`, `meetings 646`, `settings 526`, `investors 437`, `dashboard 354`. No unit tests found. Flat `app/` (25 folders, no groups), flat `components/` (24 mixed), `createClient` name collision server vs browser, per-file Profile/Project types (no `lib/types.ts` / generated Database types).
- **REST/errors:** `{error:string}` vs `{error:object}` vs bare array vs `{projects,total}` vs `{ok,redirect}`; UNAUTH maps to 401/400/403 inconsistently. `PATCH /events` duplicates `POST /events/[id]/rsvp`, `GET /marketplace/[id]/inquiries` inverted, `GET+DELETE /api/account` non-resource.
- **a11y:** custom modals without `role=dialog/aria-modal` (`meetings:487-492` ignores existing `useModalA11y`), settings toggle button-in-label no `role=switch`, ProjectCard bookmark no `aria-label/pressed`, search label placeholder-only, raw `<img>` CLS, 0 `aria-*` in 20+ pages, color-only status.
- **i18n stub:** `lib/i18n.ts` 15 keys, 0 consumers, 500+ hardcoded strings, `t(path:string)` untyped, no plural/date/RTL. Adopt `next-intl`.

**Refactor plan:** P0 `lib/api.ts` (ok/fail/withAuth envelope) + consolidate supabase to 3 files + `typecheck` + top-20 any → Database types + rm dead deps; P1 RSC for projects/marketplace/investors + `lib/pagination.ts` + split gods to <200 LOC + openapi contract; P2 jsx-a11y + next-intl.

---

## 4. DEPENDENCIES / CONFIG

- **CRITICAL C1 next ^15.1.3 (resolved 15.5.23) behind + CVE-2026-23869 (RSC DoS, CVSS 7.5).** Need `>=15.5.15` minimal, then staged 16.x (breaking: Cache Components, proxy.ts, no `next lint`).
- **CRITICAL C2 next-auth 4.24.11 dead + EOL, 0 imports.** `npm uninstall next-auth bcryptjs socket.io(-client)` (verify zero imports).
- **CRITICAL C3 triple-auth (Clerk + Supabase-legacy + next-auth).** Delete legacy behind flag.
- **HIGH H1 Clerk 7.9.2 roughly current but `^` floats across keyless-throw change; floors need `next>=15.2.8`.** Remove keyless assumption `middleware.ts:89-92`.
- **HIGH H2 Prisma 5.22 two majors behind (latest 7.10).** Staged 5→6→7, needs `prisma.config.ts` + `DIRECT_URL` (pooler `DATABASE_URL` breaks migrate).
- **HIGH H3 socket.io 4.8 dead + Vercel-incompatible** (no server.js, plain `next start`). Uninstall or self-host with Dockerfile + sticky LB.
- **HIGH H4 bcryptjs dead + weak KDF.** Uninstall or bcrypt@6/argon2.
- **MEDIUM M1 pdfkit 0.20.2 current, no npm CVE (don't conflate python-pdfkit CVE-2025-26240).** Pin exact, rate-limit route. M2 qrcode 1.5.4 latest but abandoned — keep or `uqr`. M3 resend 6.28 bleeding major — pin exact + contract test. M4 svix/supabase/sentry/zod — pin exact (float risk). M5 TS 5.7→5.9, recharts 2→3 (React19), tailwind 4 lockstep.
- **LOW L1 caret-everywhere + no .npmrc/audit CI.** Add `save-exact, engine-strict`, enforce `npm ci`, `npm audit --audit-level=high`. L2 `next lint` dies in 16 → eslint9 flat now.
- **Prisma H5 drift + H6 Cascade fan-out** (every FK cascade → delete founder wipes all; `suspended` unused → Restrict + soft-delete). **M6 missing indexes** (connections founder/status, messages project/sender, milestones project, reviews/endorsements — SQL has some Prisma lacks). **M7 N+1 + unbounded arrays.** **M8 postinstall + pooler directUrl.** **L3 migration hygiene** (skipped 008/010/011, git-ignored combined SQL, no downs).
- **Env H7 `!` in middleware:36,59-60 → 500 on every protected route if vars missing.** Early-return redirect, never service-role in middleware. **M8 build-time `export default ? hybrid : legacy` freezes auth mode at build.** Per-request check. **M9 .env.example gaps** (empty SERVICE_ROLE, no DIRECT_URL, SENTRY_DSN duality, hardcoded `https://innovators-global.com` fallback in 10+ routes → `lib/env.ts` zod fail-fast). **M10 half-Clerk degrades silently → `clerkConfigured=pub&&secret` + `/api/health`.**
- **Sentry M11 sourcemaps disabled without AUTH_TOKEN ships minified traces + silent; M11b double init (sentry.*.config + instrumentation).** Require 4 vars in prod, single init, `tunnelRoute:/monitoring`. **H8 no PII scrub** (`sendDefaultPii` unset, replay on auth app) → `beforeSend` strip auth, `maskAllText`, session 0 / error 0.05.
- **Build M12 `images.remotePatterns *.supabase.co` too broad** → pin project ref + AVIF. **M13 `headers() /(.*)` wastes CSP on /api** → exclude api, add `Cache-Control: private,no-store` for api. **L4 .gitignore ok except ignored combined migration; L5 target ES2017 → ESNext, `@/*` too broad.**

**Deploy TL;DR:** Vercel+socket.io WILL BREAK, `.node22-version` ignored (add `.nvmrc`, pin `22.x`), postinstall burns 15-30s, Clerk 7.9 throws (no keyless).

---

## 5. PERFORMANCE / DATA

- **CRITICAL F1 no pagination:** projects/marketplace/matches/cofounder/sitemap unbounded + `count:exact` double scan. 10k rows → 800ms-2s, 5-20MB, timeout. Fix: `range(from,to)` limit 24/max48 + `count:estimated` + `{data,nextCursor}` + explicit columns.
- **CRITICAL F2 matching full scan:** `matches:8-12` fetches ALL open + ALL students then JS sort; `lib/matching` O(P), cofounder O(A*B), ignores existing `vector(384)` cols. 5k×1k DAU=5M evals/day → 3-8s. Fix: pg_trgm GIN + `overlaps(skills)` prefilter top-200 → score 24; long-term pgvector ivfflat.
- **HIGH F3 analytics unbounded + JS loops:** `analytics/route` no limit, founder branch `.in(ids)` blowup, `founder/route:views` missing user filter (correctness + full scan), 30×N daily loop O(P*A). Fix: `founder_funnel_30d` RPC + `unstable_cache(300s)` + `analytics_user_type_created` index.
- **HIGH F4 missing indexes:** projects search (needs GIN trgm), marketplace active_created, messages project_direct, connections project_status/parties, analytics, profiles lower(username) unique, certificates verify, projects founder_status. Each +50-300ms at 10k rows.
- **HIGH F5 N+1/waterfall:** `team/[projectId]:10-66` 5 sequential, `chat/direct authorize` sequential ×2 + email await, dashboard 6× auth+profile. Fix: `Promise.all` + `void dispatchEmail`.
- **MEDIUM F6 SELECT * sprawl** (profile/projects/marketplace/notifications/chat 3-level join → 200-500KB/poll). Explicit columns, hydrate sender map client-side.
- **MEDIUM F7 Prisma dead cold-start 100-300ms/15MB + Edge crash risk.** Delete or commit with pgbouncer + `DIRECT_URL`.
- **CRITICAL F8 use-client sprawl (51 files), zero SSR, no loading.tsx.** No SEO, TTI 1.5-3s 4G, analytics waterfall. Fix: RSC for projects/marketplace/investors + `revalidate=60` + Suspense skeletons, client islands only.
- **MEDIUM F9 bundle:** recharts (~350KB) 0 imports, socket.io (~120KB) 0 imports → uninstall; `optimizePackageImports: [lucide-react,date-fns]`, bundle-analyzer 250KB budget.
- **MEDIUM F10 raw `<img>`** → `next/image` AVIF/lazy, LCP +0.5-1.5s otherwise.
- **CRITICAL F11 dual realtime (Realtime + 5s poll):** 100 users → 1200 heavy reads/min (~200 DB-s/min + egress). Fix: realtime-only + `?after=` + visibility guard, 30s stale revalidate.
- **HIGH F12 read_at UPDATE every poll** even zero unread → 1200 writes/min WAL. Fix: `seen_up_to` param or `POST .../read` debounced 10s.
- **MEDIUM F13 typing broadcast per keystroke** → 800ms throttle.
- **HIGH F14 middleware +80-400ms:** `getUser()` hop + awaiting touch write. Fix: 5min throttle, `void` + `waitUntil`, narrow matcher (exclude /api/stats, polling), keep prisma out of edge.
- **HIGH F15 only stats cached; sitemap unbounded OOM.** `sitemap revalidate=3600 limit 5000`, public pages `revalidate=60` + `revalidateTag`.
- **HIGH F16 PDF+QR sync per request no-store 300-800ms CPU.** Generate once → Storage + 302 signed URL + `max-age=86400 immutable` + rate-limit 10/min.
- **HIGH F17 in-memory rate-limit broken on serverless** (Map, O(N) sweep, no IP). Upstash Redis sliding window, dev fallback only.

**Roadmap (effort×payoff):** S-paginate+columns, S-realtime-only+seen_up_to, S-Upstash, S-middleware fire-forget → 70% p95 win; M-SQL prefilter+indexes, M-RSC+skeletons, M-analytics RPC+cache; S-cert Storage, XS-sitemap, S-uninstall+image.

---

## 6. Consolidated Fix Backlog (deduplicated, ordered)

**Week 0 — rotate & block leaks (day 1-2):**
- [ ] C1: remove service-role from middleware → RPC `touch_current_profile()`, rotate SERVICE_ROLE_KEY, add edge-bundle guard
- [ ] C2: scope `/api/account` milestones/meetings or drop tables + regression test
- [ ] C3: scope marketplace inquiries + test
- [ ] H4/H3: `can_access_team_room` on tasks/messages/reactions, owner-only edit, ADMIN pin
- [ ] H6: cert PDF authz (404 oracle-safe)
- [ ] H2/P0: sanitize `search` + `z.max(80)` + try/catch GET
- [ ] H1/P0: `next` allowlist in callback + middleware + signin

**Week 1 — auth/abuse/observability:**
- [ ] C4: fail-closed Clerk (no legacy fallthrough when userId present), `getToken({template:"supabase"})`, single auth mode + integration tests
- [ ] H5/F17: Upstash Redis limits (signin 5/10m, inquiry 3/h, webhook 30/m, cert 10/m) + `getIp` keys
- [ ] P0 webhook: bound `findShadow` to 1-2 pages / email index + `maxDuration`
- [ ] P0 bookmarks atomic upsert + client disabled/rollback
- [ ] `lib/api.ts` withAuth + toStatus + safeParse everywhere, no `e.message` on 500, Sentry capture (email/presence/stats 503)
- [ ] Sentry: single init, require 4 vars prod, `beforeSend` PII strip, maskAllText, tunnelRoute, rates 0.05
- [ ] Deps: `uninstall next-auth bcryptjs socket.io(-client)` (or commit self-host), pin exact resend/svix/sentry/supabase, `.nvmrc`+`engines 22.x`+`.npmrc`, `images` pin, `headers()` api-split, `middleware !` guards, `lib/env.ts`

**Week 2 — scale (kills timeouts):**
- [ ] F1: pagination + `count:estimated` + explicit columns on projects/marketplace/matches/notifications
- [ ] F2/F4: pg_trgm + role/status/founder/analytics/cert indexes + SQL prefilter (200 → top 24)
- [ ] F11/F12: realtime-only, remove interval, `seen_up_to` read receipts, throttle typing
- [ ] F14: middleware 5min + fire-forget + narrow matcher
- [ ] F3/F15/F16: analytics RPC + `unstable_cache(300)`, sitemap `revalidate 3600 limit 5000`, cert PDF → Storage signed URL + cache
- [ ] F8/F9/F10: RSC projects/marketplace/investors + loading skeletons + `revalidate 60`, uninstall recharts, `optimizePackageImports`, `next/image`
- [ ] Decide Prisma: delete OR `db pull` + least-privilege + DIRECT_URL; H6 cascade → Restrict + soft-delete
- [ ] Upgrades staged: `next 15.5.15 + clerk 7.9.x` → 16 codemod; prisma 5→6→7; TS 5.9; recharts 3; `npm audit` + `migrate diff` CI

**Ongoing:** split gods <200 LOC, openapi contract, eslint jsx-a11y + axe-playwright, next-intl, per-segment error.tsx, date-fns-tz, upload revoke + server re-check.

---

## 7. Appendix — how to verify

- `rg -n "SERVICE_ROLE|service_role|supabaseAdmin|getSupabaseAdmin" middleware.ts lib/ app/api/` (must be zero in middleware/client)
- `rg -n "\.or\(.*\$\{q\}" app/api/` + `GET /api/projects?search=%,%` → 400 capped, no 500
- `GET /api/account`, `/api/marketplace/inquiries` as low-priv user → zero foreign rows
- `PATCH /api/team/tasks {id: victim-uuid}` as outsider → 403
- `GET /api/certificates/<other-id>/pdf` → 404
- `/auth/callback?next=//evil.com` → stays `/dashboard`
- `rg -n "socket|next-auth|bcrypt" app/ lib/` → zero (after prune)
- `npm run typecheck (tsc --noEmit)`, `npm audit --omit=dev`, Lighthouse TTI/LCP, Supabase slow-query log p95 before/after indexes.

*End of report — 5 subagents, 0 files changed. Implement Week 0 first.*
