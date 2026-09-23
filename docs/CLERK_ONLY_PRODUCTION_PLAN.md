# Clerk-Only Auth + Supabase-as-Database — Production Cutover Plan (Root Fix, No Patches)

**Goal:** Clerk becomes the ONLY auth provider. Supabase remains ONLY as Postgres + Storage + Realtime (database provider). Zero client data loss. No dual-auth fallbacks, no env-toggles, no patchwork.
**Non-goals (this plan makes NO code changes):** this document is the build spec. Execution happens in a separate release branch.
**Status:** plan only — zero files changed by this plan.

---

## 1. Principles (root-fix rules — non-negotiable)

1. **Single auth mode.** No `hybrid ? legacy`, no `if (!userId) tryLegacy()`, no `NEXT_PUBLIC_CLERK_* ? clerk : supabase`. Clerk configured = required. Missing keys = build fails, never silent fallback.
2. **Fail closed.** `getToken({ template: "supabase" })` returns null → `UNAUTHORIZED`, never legacy impersonation. RLS deny by default.
3. **UUID stability.** `profiles.id` (uuid) NEVER changes. `clerk_user_id` is a link column, not a new PK. Every FK stays intact.
4. **Supabase Auth (GoTrue) is retired, Supabase Postgres is not.** Disable GoTrue providers; keep the same Supabase project (same `NEXT_PUBLIC_SUPABASE_URL`), same buckets, same tables. No data export/import between projects.
5. **Service-role stays server-only.** Browser/edge never sees it. RLS stays `FORCE`d; all user traffic uses the Clerk JWT → Supabase third-party auth path.
6. **Reversible until cutover.** Every phase has a backup + rollback. Cutover is a single flag flip + single deploy, not 20 small patches.

## 2. Current vs target

**Current (dual):** `middleware.ts` hybrid/legacy, `lib/supabase/` 7 clients (server, public, legacy-server, clerk-server, clerk-client, admin, client), `lib/auth/require-user.ts` Clerk → legacy fallback, `lib/security/admin.ts` legacy fallback, `app/auth/legacy-signin`, `app/auth/callback` (Supabase code exchange), `app/api/auth/signin` (password), `next-auth` + `bcryptjs` dead deps, Supabase Email provider ON, RLS supports both `auth.uid()` and `current_profile_id()`.

**Target (Clerk-only):**
```
Browser (ClerkProvider + useClerkSupabaseClient)
  → Clerk JWT (template "supabase")
  → Supabase PostgREST/Storage/Realtime (anon key + Authorization: Clerk JWT)
  → RLS: current_profile_id() = profiles.id via clerk_user_id link
Server (Route Handlers / Server Components)
  → auth() → userId → getToken({template:"supabase"}) → createClient(url, anon, {accessToken})
  → same RLS. Admin jobs → supabaseAdmin (service-role, server-only).
Middleware (Edge): clerkMiddleware only — no Supabase client, no service-role, no getUser().
Webhooks: Clerk → /api/webhooks/clerk (svix) → link/create profile + shadow cleanup.
```
Only 3 Supabase modules remain: `server.ts` (Clerk JWT, async), `browser.ts` (Clerk JWT, client), `admin.ts` (service-role, server-only). `public.ts` stays for truly public reads (anon, no auth).

## 3. Data inventory — what MUST survive (no loss)

- `public.profiles` (all rows, all columns incl. `id`, `email`, `clerk_user_id`, `role`, `username`, `avatar_url`, skills/interests, `email_opt_in`, `suspended`).
- All domain tables + FKs: `projects`, `applications`, `connections`, `bookmarks`, `messages`, `message_reactions`, `message_edits`, `team_rooms`, `team_members`, `team_tasks`, `marketplace_services`, `service_inquiries`, `community_events`, `event_attendees`, `meetings`, `meeting_attendees`, `reviews`, `endorsements`, `user_badges`, `certificates`, `cofounder_profiles`, `match_actions`, `notifications`, `analytics_events`, `universities`, `university_members`, `open_roles`, `milestones`, `reports`, `user_blocks`.
- `public.clerk_identity_map` + `public.clerk_webhook_events` (idempotency).
- `storage.objects` + all 4 buckets (`avatars`, `resumes`, `project-files`, `team-files`) — paths `"<uuid>/..."` unchanged.
- Supabase migrations 001–024 (incl. 024 storage/admin hardening) — additive only from here.
- What is DISCARDED: `auth.users` password rows (after link verification), Supabase Email templates/OTPs, `next-auth` sessions, legacy cookies (`sb-*`, `ibf_seen` legacy name), `app/auth/callback` code flow.

## 4. Phase 0 — Freeze, backup, audit (Day 0, 2–4h, no downtime)

1. Freeze auth-related PRs. Tag `pre-clerk-only` + record Vercel deployment ID for one-click rollback.
2. Supabase backup: full DB backup (dashboard → Backups) + `pg_dump --schema-only` + `storage` bucket inventory (`select bucket_id, count(*) from storage.objects group by 1`).
3. Audit queries (record counts — these are the cutover acceptance numbers):
```sql
select count(*), count(clerk_user_id) from public.profiles;
select role, count(*) from public.profiles group by role;
select count(*) from public.profiles where clerk_user_id is null; -- legacy-only backlog
select count(*) from auth.users; -- shadow + legacy password users
select * from public.clerk_webhook_events where status='FAILED' order by created_at desc limit 20;
select bucket_id, count(*) from storage.objects group by bucket_id;
```
4. List legacy entry points to delete later (do NOT delete yet): `lib/supabase/legacy-server.ts`, `app/auth/legacy-signin/page.tsx`, `app/auth/callback/route.ts`, `app/api/auth/signin/route.ts`, `app/api/auth/set-role` (keep, Clerk-only rewrite later), legacy link in `app/auth/signin/page.tsx:2`, `requireLegacyUser` imports in `require-user.ts` + `server.ts` + `security/admin.ts`.
5. Confirm Clerk prod instance: domain `clerk.innovators-global.com`, JWT template `supabase` exists and returns `sub = clerk user id`, webhook endpoint + secret, allowed identifiers (email + username + Google + GitHub).

## 5. Phase 1 — Clerk ↔ Supabase trust (staging first, 4h)

1. Supabase Dashboard → Authentication → Third-party Auth → Add Clerk → enter Clerk production domain. Keep Supabase Email ON until cutover (do NOT disable yet).
2. Verify JWT template: in Clerk → JWT Templates → `supabase` → claims include `sub`, `email`, exp ≤ 60s. Test: sign in on preview, `getToken({template:"supabase"})` decodes at jwt.io with correct issuer.
3. Add `025_clerk_only_trust.sql` (additive, reversible):
```sql
-- Assert every authenticated request carries a Clerk JWT linked to a profile.
create or replace function public.current_profile_id() returns uuid
language sql security definer stable set search_path = public as $$
  select p.id from public.profiles p
  where p.clerk_user_id = nullif(auth.jwt()->>'sub','')
  limit 1;
$$;
revoke all on function public.current_profile_id() from public;
grant execute on function public.current_profile_id() to authenticated;
-- Force RLS everywhere (kills service-role-shaped bypasses via anon path):
-- run for each public table: alter table public.<t> force row level security;
```
4. Acceptance: on preview with Clerk provider enabled, `select auth.jwt()->>'sub'` returns `user_xxx`; `select public.current_profile_id()` returns the linked uuid; unauthenticated returns NULL (deny).

## 6. Phase 2 — Database cutover migration `026_clerk_only.sql` (staging, 1 day)

Additive, idempotent, zero row rewrites:
1. `profiles.clerk_user_id` → `not null` where possible AFTER backfill (see §7), add `unique(clerk_user_id)` (already exists — verify), add `check (clerk_user_id like 'user\_%')` for new rows.
2. Replace legacy `auth.uid()`-based policies with `current_profile_id()` equivalents (already done in 012–014 — this migration only DROPS the leftover legacy branches, e.g. `auth.uid()=user_id` in bookmarks/messages). Keep policy names, change bodies.
3. Storage: keep 024 owner-folder policies (they already use `current_profile_id()`). No path renames.
4. `admin_audit_log` (from 024) becomes mandatory: `requireSuperAdmin` reads Clerk `privateMetadata.role`, never `profiles.role`.
5. `delete_own_account()` rewrite: delete `profiles` row + Clerk user via Clerk API (server), do NOT touch `auth.users` (GoTrue retired).
6. Rollback: this migration is DROP-policy + ADD-policy; rollback = re-apply 012–015 policy bodies (kept in git). No data migration to reverse.

## 7. Phase 3 — Legacy user backfill (the zero-loss core, 2–5 days, before cutover)

Passwords CANNOT be migrated (bcrypt hashes are one-way and GoTrue-owned). Identity IS migrated:
1. For every `profiles` row with `clerk_user_id IS NULL`: match by verified email to Clerk user (via webhook `handleUser` + `findShadow` bounded lookup already in prod). On match: `update profiles set clerk_user_id = <clerk id> where id = <uuid>`. UUID unchanged → every FK intact.
2. Comms: email every legacy-only user (Resend, `sanitizeEmailSubject` path): "Sign in with the same email via Clerk (Google/GitHub or password reset). Your projects, connections, files are unchanged." Include 2-week window + support link. No password-creation link (Clerk recovery flow instead).
3. Unmatched after window: rows stay with `clerk_user_id NULL`, login blocked with "Account not linked — check email / contact support" (404-safe, no oracle). NOTHING is deleted. Support runbook: verify email ownership → manual `clerk_identity_map` upsert + `profiles` link (service-role, audited).
4. `auth.users` rows: after backfill + 30-day grace, delete ONLY rows whose `id` has a linked `profiles.clerk_user_id` AND no orphan storage. Keep the DB backup + CSV of `auth.users(id,email,created_at)` for audit. Never delete `profiles` or `storage.objects`.

## 8. Phase 4 — App cutover spec (single release branch `clerk-only`, no patches)

Delete vs rewrite (exact file list — implement in ONE PR, behind `CLERK_ONLY=true` flag that fails build when false):
- DELETE: `lib/supabase/legacy-server.ts`, `app/auth/legacy-signin/page.tsx`, `app/auth/callback/route.ts`, `app/api/auth/signin/route.ts`, legacy link in `app/auth/signin/page.tsx`, `lib/supabase/client.ts` (replaced by `browser.ts`).
- REWRITE (Clerk-only, fail-closed):
  - `lib/supabase/server.ts` → `createServerClient` with `getToken({template:"supabase"})`, throw `UNAUTHORIZED` on null (no public fallback for protected paths; public reads use `public.ts` explicitly).
  - `lib/supabase/browser.ts` (new, replaces `clerk-client.ts`+`client.ts`): `useMemo` Clerk token, single export `useSupabaseBrowser()`.
  - `lib/supabase/clerk-server.ts` → keep, add `maxAge` guard + throw (not null) on missing template.
  - `lib/auth/require-user.ts` → remove `requireLegacyUser` import + fallback; Clerk-only select by `clerk_user_id`; `provider:"clerk"` always.
  - `lib/security/admin.ts` → remove legacy branch; Clerk `privateMetadata` only.
  - `middleware.ts` → `clerkMiddleware` only + existing CSRF gate + `touchPresenceCookie`; delete `legacy()` + Supabase `createServerClient` + `auth.getUser()` hop (saves 80–400ms p95).
  - `app/api/auth/set-role/route.ts` → keep, Clerk-only (already whitelists FOUNDER/STUDENT).
  - `lib/supabase/admin.ts` → keep, add `import "server-only"` + edge-import guard (`if (process.env.NEXT_RUNTIME==="edge") throw`).
- DEPS: `npm uninstall next-auth bcryptjs` (+ `@types/bcryptjs`), remove `postinstall prisma generate` OR delete `prisma/` (decided separately — not part of auth cutover, but must not ship `bcryptjs` implying password auth still exists).
- ENV: require at build `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, `CLERK_WEBHOOK_SIGNING_SECRET`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (server-only). Delete `DATABASE_URL`-as-auth references. Add `/api/health` returning `{clerk:true, supabase:true}` (no secrets) for pre-deploy gate.
- REALTIME/STORAGE/EMAIL: no path changes (folderKeys stay uuid-based, RLS already path-based). Realtime channels keep `useSupabaseBrowser()` (memoized — fixes resubscribe loop). Email keeps Clerk `privateMetadata` names.

## 9. Phase 5 — Validation matrix (preview, must all pass before prod)

| # | Test | Expect |
|---|------|--------|
| 1 | New Clerk signup → role → onboarding → dashboard | 1 profile, 1 map row, 0 shadow dupes |
| 2 | Legacy email user signs via Clerk same email | Same `profiles.id`, all projects/connections/files visible |
| 3 | Wrong/unknown email | `PROFILE_NOT_FOUND` 404, no oracle |
| 4 | `getToken` null (template misconfigured) | 401, Sentry `area:auth`, no legacy session |
| 5 | Two-user isolation: bookmarks/messages/storage direct fetch | 404/403 cross-user, owner 200 |
| 6 | Webhook replay (same svix-id ×2), FAILED reclaim | 2nd = `ok` no-op; reclaim processes once |
| 7 | `user.deleted` | profile anonymized, map row deleted, domain rows intact |
| 8 | Public: projects list, sitemap, stats | 200 signed-out; protected `/dashboard` → signin |
| 9 | Sign-out (Clerk) → protected API | 401, no Supabase session residue |
| 10 | Load: 200 concurrent chat polls + presence | p95 < 600ms, 0 RLS denials for linked users |
| 11 | `rg "legacy|requireLegacy|next-auth|bcrypt" app/ lib/ middleware.ts` | 0 hits (except this plan + docs) |
| 12 | `tsc --noEmit` + `npm audit --omit=dev` | clean / 0 high |

## 10. Phase 6 — Rollout + rollback (production, 2-week window)

1. **T-24h:** backup DB + storage inventory (§4.3 numbers), retain last stable Vercel deployment, announce maintenance window + support staffing.
2. **T-0:** apply `025` + `026` on prod (preview-verified), deploy `clerk-only` branch to prod with legacy routes REMOVED (404, not redirect — no silent downgrade). Supabase Email provider → OFF in the SAME window (after deploy healthy 30min).
3. **T+0–14d:** monitor `clerk_webhook_events FAILED`, Sentry `auth`/`api`, Resend bounces, p95 latency, support queue for "not linked". Daily `select count(*) from profiles where clerk_user_id is null` should decay.
4. **Rollback (any red):** one-click Vercel rollback to `pre-clerk-only` + re-enable Supabase Email + re-apply 012–015 policy bodies. Data written during the window is forward-compatible (uuid-stable, additive map rows) — NO restore needed unless DB migration itself failed (then restore backup).
5. **Go/No-Go:** cutover is GO only if §9 1–12 all green on preview + backup verified + on-call ack. Otherwise NO-GO, no partial deploy.

## 11. Phase 7 — Cleanup + hardening (week 3, after 14 clean days)

- Delete `docs/CLERK_MIGRATION.md` hybrid sections (superseded by this plan), remove `app/auth/choose-role` legacy branches, prune `suspended`-flag dead paths or wire to Clerk `banned`.
- Supabase Dashboard → Authentication → Providers → disable Email + Phone + Anonymous; set JWT expiry ≤ 60s; enable leaked-password protection OFF (irrelevant post-GoTrue) — document why.
- Rotate `SUPABASE_SERVICE_ROLE_KEY` once (post-legacy, pre-scale) + verify edge bundle contains zero `SERVICE_ROLE` (`rg SERVICE_ROLE middleware.ts lib/supabase/browser.ts` = 0).
- Re-run full audit scorecard: auth Grade A target (fail-closed, 3 clients, 0 legacy hits).

## 12. Risks (honest)

- **Unlinked users locked out** (expected, bounded): mitigated by email campaign + support backfill runbook + rows never deleted.
- **JWT template misconfig → mass 401:** mitigated by `/api/health` gate + preview §9.4 + 30min Email-ON overlap + instant rollback.
- **RLS policy drop locks outlinked users:** mitigated by staging-first + per-table `FORCE RLS` verify + rollback scripts.
- **Storage confusion (owner-folder):** no path migration, so zero breakage; collaborators keep via signed URLs after project authz (024 design).

*End of plan. Next step when approved: implement Phase 1–4 in branch `feat/clerk-only` (single PR, flag-gated), then execute §9 matrix on preview. No code was changed by this plan.*
