# IBF — Innovator Bridge Foundry

IBF is a Next.js collaboration platform for founders and emerging talent.
**Authentication is handled by Clerk; Supabase is used as the database.**

## Setup

### 1. Supabase (database)

1. Create a Supabase project.
2. Open **SQL Editor** and run the migrations in order:
   `supabase/migrations/001…010` (the last one, `010_clerk_auth.sql`, switches
   user ids to Clerk ids).
3. From **Settings → API**, copy the **Project URL** and the **service_role**
   key (secret — used only by the server).

### 2. Clerk (authentication)

1. Create an application at [dashboard.clerk.com](https://dashboard.clerk.com).
2. In **Configure → Sessions**, make sure the redirect URLs include your
   local/dev/prod origins (e.g. `http://localhost:3000`).
3. From **API Keys**, copy the publishable key and the secret key.
4. Enable any social providers you want (Google, GitHub, …) under
   **Configure → SSO Connections** — no code changes needed.

### 3. Environment

Copy `.env.local.example` to `.env.local` and enter:

- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` / `CLERK_SECRET_KEY`
- `NEXT_PUBLIC_SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY`

### 4. Run

```bash
npm install
npm run dev
```

## How auth + data fit together

- **Clerk** owns every screen of authentication: `/auth/signin`, `/auth/signup`,
  password resets, email verification and social login.
- After signing up, users complete `/onboarding` (role, skills, startup details).
- The `profiles` row is created automatically on first authenticated request
  (`lib/supabase/server.ts`), keyed by the Clerk user id.
- `middleware.ts` protects the dashboard area with `clerkMiddleware()`.
- All Supabase queries run server-side with the service-role key; route
  handlers enforce authorization. RLS policies from the Supabase-Auth era are
  dormant and never match.
- Account deletion removes the profile (cascades across all tables) and the
  Clerk user via the Backend API.
- Never expose `CLERK_SECRET_KEY` or `SUPABASE_SERVICE_ROLE_KEY` in browser code.

## Implemented foundation

- Clerk email/password + social authentication
- Automatic role-aware profile creation and onboarding wizard
- Founder project creation (founder-only, enforced in the route)
- Public live project queries and weighted live matchmaking
- Applications, connections, bookmarks, messages (general/direct/team)
- Notifications, reviews, endorsements, teams, meetings, analytics
- PWA manifest/service worker

## Match formula

- Required-skill overlap: 40%
- Domain/interest alignment: 30%
- Availability: 20%
- Engagement preference: 10%

No paid AI provider is needed.

## Production

Deploy to Vercel, add the same environment variables, and add the production
origin to Clerk's allowed redirect URLs. Never expose a database password or
service-role key in browser code.
