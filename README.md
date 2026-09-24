# IBF — Innovator Bridge Foundry

A full-stack, enterprise-grade founder and emerging-talent collaboration platform built with **Next.js 15 (App Router)**, **Pure Supabase Auth**, **PostgreSQL (with Row Level Security & pgvector)**, and **TypeScript**.

---

## Architecture Overview

```
                                  +-----------------------------+
                                  |     Next.js 15 App Router   |
                                  |     (React 19 + TypeScript)  |
                                  +--------------+--------------+
                                                 |
                       +-------------------------+-------------------------+
                       |                                                   |
                       v                                                   v
         +---------------------------+                       +---------------------------+
         |      Supabase Auth        |                       |    Supabase Database      |
         |  - Email & Password       |                       |  - 34 Production Tables   |
         |  - Google OAuth (PKCE)    |                       |  - Strict Row Level Sec.  |
         |  - LinkedIn OIDC (PKCE)   |                       |  - Realtime Publications  |
         |  - Direct Session Refresh |                       |  - pgvector Embeddings    |
         +-------------+-------------+                       +-------------+-------------+
                       |                                                   |
                       +-------------------------+-------------------------+
                                                 |
                                                 v
                                  +-----------------------------+
                                  |      Supabase Storage       |
                                  |  - avatars (public)         |
                                  |  - service-portfolios (pub) |
                                  |  - resumes (private RLS)    |
                                  |  - project-files (private)  |
                                  |  - team-files (private)     |
                                  +-----------------------------+
```

### Key Highlights
- **100% Pure Supabase Auth**: Complete elimination of third-party auth proxies/Clerk. Unified session management using `@supabase/ssr` cookies and `auth.getUser()`.
- **Bulletproof User Lifecycle**: Security-definer Postgres trigger `handle_new_user()` guarantees automatic profile creation upon signup or OAuth callback, preventing orphaned sessions.
- **Enterprise Row Level Security (RLS)**: Forced on all 34 tables. Non-recursive policy design prevents infinite recursion loops.
- **Scale-Ready Database Architecture**: Automated performance indexes on high-cardinality keys, foreign keys, and sorting fields.
- **Automated Health Verification**: Zero-dependency Node.js verification script (`node scripts/verify-supabase.mjs`) for continuous schema health checks.

---

## Getting Started

### Prerequisites
- Node.js >= 22.0.0
- npm or pnpm
- Supabase account & project

### 1. Clone & Install
```bash
git clone https://github.com/matricphase-dot/ibfinnovator.ai.git
cd ibfinnovator.ai
npm install
```

### 2. Configure Environment Variables
Copy the example environment template:
```bash
cp .env.local.example .env.local
```

Fill in your project values in `.env.local`:
```env
# Application
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Supabase (Pure Auth + Database + Storage)
NEXT_PUBLIC_SUPABASE_URL=https://<your-project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>

# Email Dispatch (Resend)
RESEND_API_KEY=<your-resend-api-key>
EMAIL_FROM=IBF <no-reply@innovators-global.com>

# Monitoring (Sentry - Optional)
NEXT_PUBLIC_SENTRY_DSN=
SENTRY_AUTH_TOKEN=
SENTRY_ORG=
SENTRY_PROJECT=
```

### 3. Deploy Database Schema
1. Open your [Supabase Dashboard](https://supabase.com/dashboard).
2. Go to **SQL Editor** -> **New query**.
3. Open [`supabase/PRODUCTION_SETUP_ROOT.sql`](./supabase/PRODUCTION_SETUP_ROOT.sql), copy the entire content, paste it into the editor, and click **Run**.
4. Verify your database schema:
   ```bash
   node scripts/verify-supabase.mjs
   ```

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Authentication Flow

1. **Sign-up (`/auth/signup`)**:
   - Supports Email/Password, Google OAuth, and LinkedIn OIDC.
   - On completion, `auth.users` triggers `handle_new_user()` which provisions the corresponding row in `public.profiles`.
   - New users are redirected to `/auth/choose-role`.

2. **Role Selection & Onboarding (`/auth/choose-role` & `/auth/complete-onboarding`)**:
   - Users select their role (`FOUNDER` or `STUDENT`).
   - Completes role-specific profiles and startup details atomically via `finalize_onboarding()`.

3. **Sign-in (`/auth/signin`)**:
   - Email/password authentication or direct one-click OAuth login.
   - Redirects to `/auth/choose-role` if onboarding is incomplete, or directly to `/dashboard`.

4. **Password Recovery (`/auth/forgot-password` & `/auth/reset-password`)**:
   - Self-service recovery flow via Supabase password reset emails.
   - Authenticated password changes available under `/settings`.

---

## Project Structure

```
├── app/                      # Next.js App Router pages and API routes
│   ├── auth/                 # Sign-in, sign-up, callback, password reset, onboarding
│   ├── api/                  # 50+ REST endpoints (projects, team, chat, meetings, etc.)
│   ├── dashboard/            # Founder and student dashboards
│   ├── projects/             # Project exploration, creation, and detail views
│   ├── team/                 # Team collaboration rooms, tasks, and files
│   ├── chat/                 # Direct and general messaging
│   └── settings/             # Account settings, credentials, and password management
├── components/               # Reusable UI components
├── lib/                      # Core business logic and database adapters
│   ├── auth/                 # Session verification (`requireUser()`, identity types)
│   ├── supabase/             # Server (`server.ts`), browser (`browser.ts`), and admin clients
│   └── env.ts                # Validated environment access
├── scripts/                  # DevOps and database verification scripts
│   ├── verify-supabase.mjs   # Automated schema & storage health verification
│   └── build-setup-sql.mjs   # Synchronizes canonical SQL setup to migrations
├── supabase/                 # Supabase configuration and canonical SQL setup
│   ├── PRODUCTION_SETUP_ROOT.sql # Master one-shot production setup script
│   ├── README.md             # Supabase deployment instructions
│   └── migrations/           # Versioned migration directory
└── docs/                     # Production readiness and architectural specs
```

---

## Useful Scripts

| Command | Description |
| :--- | :--- |
| `npm run dev` | Starts the Next.js local development server |
| `npm run build` | Compiles the production build and validates all TypeScript types |
| `npm run start` | Starts the production server |
| `node scripts/verify-supabase.mjs` | Verifies all 17 tables and 5 storage buckets in your Supabase DB |
| `node scripts/build-setup-sql.mjs` | Syncs `PRODUCTION_SETUP_ROOT.sql` to `supabase/migrations/` |

---

## Production Deployment Checklist

Refer to [`docs/PRODUCTION_READINESS.md`](./docs/PRODUCTION_READINESS.md) for the complete pre-launch checklist covering OAuth redirect URI configuration, CSP headers, rate-limiting, and error tracking.
