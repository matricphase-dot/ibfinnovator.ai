# Clerk Migration — Dual-Auth Rollout Plan

Status: **in progress**. The app is moving from Supabase-only auth to a dual-auth
model where Clerk is the primary identity provider and legacy Supabase
email/password sessions keep working unchanged.

## Shipped

| Batch | Commit | Contents |
|---|---|---|
| 1 | `cb01575` | Clerk dual-auth foundation — `lib/auth/*`, `lib/supabase/{admin,public,clerk-server,legacy-server}.ts`, migration `012` |
| 1 fixes | `ece84a8` | `onboarding_completed` column, hybrid `createClient()` fallback |
| 2 | `7d2d644` | RLS migrations `013`–`015` (identity swap to `current_profile_id()`) |
| 2 cleanup | `92a2460` | RLS migration `016` (the three policies missed by table scoping) |
| 3 | `d8f4c70` | Clerk middleware, `<ClerkProvider>`, webhook, `set-role` route, dual sign-in pages |
| 3 cleanup | _this batch_ | Migration `017` (`clerk_identity_map`), onboarding placeholder, this doc |

## How identity resolves

`public.current_profile_id()` (migration `012`) is the single identity entry
point for every RLS policy in the schema:

- subject `user_*` → looks up `public.profiles.clerk_user_id`
- subject `<uuid>` → casts directly to `uuid` (legacy Supabase session)

Both auth types therefore hit the same UUID primary keys, so `profiles.id`
stays the canonical user identity and **no foreign key changes were required**.

## How a Clerk signup becomes a profile

The webhook (`app/api/webhooks/clerk/route.ts`) performs, in order:

1. Verify the Svix signature.
2. Atomically claim the delivery in `clerk_webhook_events` (idempotency ledger).
3. Resolve a verified email address from the Clerk payload.
4. Link an existing profile by email, or create one.
5. **Create a shadow Supabase auth user** via `auth.admin.createUser()`.

Step 5 is mandatory, not optional: `profiles.id` carries
`references auth.users(id) on delete cascade`, so a profile row cannot exist
without a matching `auth.users` row. This was confirmed empirically — inserting
a profile with an unknown id fails with `profiles_id_fkey`.

6. Insert into `clerk_identity_map` (`017`) as the durable identity map.

## Pending: Rich Onboarding Reconstruction

The previous signup page captured founder/student profile fields that are now missing.
These will be rebuilt as the 5-step wizard in Batch 4. Field list:

- Founder: name, email, company, startup title, domain, stage, problem, solution, skills, engagement, hours, duration
- Student: name, email, skills+proficiency, interests, goals, availability, college, education_year, portfolio_urls, resume_url

### Why this is needed

Replacing `app/auth/signup/page.tsx` with Clerk's `<SignUp />` removed the
multi-step capture that previously fed `handle_new_user()` (migration `001`)
through signup metadata. That trigger used the metadata to:

- populate the new profile's `skills`, `interests`, `availability`, `company`,
  `goals` and `role`, and
- **auto-create the founder's first project** when `startup_title` was present.

Consequences today:

- Clerk signups produce a **bare profile** (empty name, default `STUDENT` role).
- Founders get **no starter project**, so the founder dashboard is empty until
  they create one manually.

The old implementation is preserved in git history at commit `2ae0a27`
(`app/auth/signup/page.tsx`) and should be used as the source of truth when
rebuilding the wizard.

`app/auth/complete-onboarding/page.tsx` currently redirects straight to
`/dashboard` as a placeholder so the post-signup flow does not 404.

## Environment variables required for Clerk

Without these, `middleware.ts` deliberately falls back to the previous
Supabase-only behaviour and the app keeps working:

- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`
- `CLERK_WEBHOOK_SIGNING_SECRET`

## Migrations

`012`–`017` must be applied in numeric order. `012` is a hard dependency of all
later ones because they call `current_profile_id()`, and `013`/`015` reference
`can_access_team_room()`, whose Clerk-aware version lands in `014`.
