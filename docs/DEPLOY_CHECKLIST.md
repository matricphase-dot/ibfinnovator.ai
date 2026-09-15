# Deploy Checklist (Vercel preview)

Companion to `docs/CLERK_MIGRATION.md`. These are the steps and checks for the
first Vercel preview of the dual-auth build.

## 1. Environment variables — required

Set these in Vercel → Project → Settings → Environment Variables for the
**Preview** (and later Production) environment. Values marked *server only*
must never be exposed to the browser.

| Variable | Where to get it | Notes |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Settings → API | Public |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Settings → API | Public |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Settings → API → service_role | **Server only.** Required by the Clerk webhook and `/api/auth/set-role`. Missing → all Clerk webhook deliveries return 500 and no shadow users are created. |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk → API keys | Starts `pk_test_` / `pk_live_` |
| `CLERK_SECRET_KEY` | Clerk → API keys | **Server only.** Starts `sk_test_` / `sk_live_` |
| `CLERK_WEBHOOK_SIGNING_SECRET` | Clerk → Webhooks → signing secret | Starts `whsec_` |
| `NEXT_PUBLIC_GOOGLE_OAUTH_ENABLED` | — | Leave `false` unless enabled in Supabase Auth |
| `NEXT_PUBLIC_GITHUB_OAUTH_ENABLED` | — | Leave `false` unless enabled in Supabase Auth |

### Failure behaviour (by design)

| Situation | Result |
| --- | --- |
| Publishable key missing **or** malformed | Clerk disabled, app runs legacy Supabase auth. `/auth/signin` redirects to `/auth/legacy-signin`, `/auth/signup` shows a notice. A warning is logged once at startup. **No 500s.** |
| Both keys valid | Normal Clerk flow. |
| Clerk reachable but erroring | Middleware logs the error and serves the request via legacy auth rather than failing the request. |
| `SUPABASE_SERVICE_ROLE_KEY` missing | Webhook returns 500 (Svix retries) and logs the cause. Clerk sign-up appears to work but no profile is created. |

## 2. Supabase — one confirmation

The migrations have been applied. Confirm the anon grant from migration 018
landed (this is what lets logged-out visitors load public pages):

```sql
select has_function_privilege('anon', 'public.current_profile_id()', 'execute');
```

Expected: `true`. If it returns `false`, re-run section 018 of
`ALL_CLERK_MIGRATIONS.sql`.

## 3. Clerk dashboard

- Add the webhook endpoint: `https://<your-domain>/api/webhooks/clerk`
- Subscribe to at least `user.created` and `user.updated`.
- Copy the signing secret into `CLERK_WEBHOOK_SIGNING_SECRET`.

## 4. Validation tests for the preview

Run these against the deployed preview URL.

**Public / anonymous**

1. `/` loads (200) with no redirect and no error page.
2. `/marketplace` loads (200) while logged out.
3. `/events` loads (200) while logged out.
4. `/projects` loads (200) while logged out.
5. `/dashboard` redirects to `/auth/signin?next=%2Fdashboard` (307) while logged out.

**Clerk sign-up / sign-in**

6. `/auth/signup` shows the Clerk widget (not the "temporarily unavailable" notice).
7. Complete a sign-up → lands on `/auth/choose-role`.
8. Choose a role → profile is created and you land on `/dashboard`.
9. `/auth/signin` shows the Clerk widget; signing in returns you to `/dashboard`.
10. Sign out returns you to a public page with no error.

**Webhook / data**

11. Clerk → Webhooks shows the `user.created` delivery as **200** (not 500).
12. `select count(*) from public.clerk_identity_map;` is ≥ 1 after a sign-up.
13. `select count(*) from public.profiles;` increased by the same sign-up.
14. `select count(*) from auth.users;` shows the shadow user the webhook created.
15. Sign in with a pre-existing legacy Supabase account resolves to that same
    profile (dual-auth identity resolution), not a duplicate.

If test 11 or 12 fails, `SUPABASE_SERVICE_ROLE_KEY` is the first thing to check.

## 5. Known non-blockers

- `npm install` may exit non-zero locally because the Prisma postinstall cannot
  reach `binaries.prisma.sh`; dependencies still install.
- Vercel's build does not need Prisma binaries generated for the pages that are
  currently shipped.
