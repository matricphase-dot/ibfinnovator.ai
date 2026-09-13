# IBF — Innovator Bridge Foundry

Full-stack founder and emerging-talent collaboration platform built with Next.js, Clerk, Supabase PostgreSQL/Storage, and TypeScript.

## Local development

```bash
cp .env.local.example .env.local
npm install
npm run dev
```

Use Node.js 22. Apply Supabase migrations in numeric order on a non-production project first. See [Clerk migration](docs/CLERK_MIGRATION.md) before activating dual authentication.

## Environment variables

### Application

```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Clerk

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
CLERK_WEBHOOK_SIGNING_SECRET=
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/auth/signin
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/auth/signup
NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/dashboard
NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/auth/choose-role
```

### Supabase

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
DATABASE_URL=
```

`SUPABASE_SERVICE_ROLE_KEY` is server-only and must never use a `NEXT_PUBLIC_` prefix.

### Resend

```env
RESEND_API_KEY=
EMAIL_FROM=IBF <no-reply@innovators-global.com>
```

Without these variables, email dispatch logs a skipped event and never blocks product APIs.

### Sentry

```env
NEXT_PUBLIC_SENTRY_DSN=
SENTRY_AUTH_TOKEN=
SENTRY_ORG=
SENTRY_PROJECT=
```

Sentry is disabled when the DSN is absent.

## Production deployment

1. Import the GitHub repository into Vercel.
2. Select Node.js 22 and configure all environment variables.
3. Apply migrations to Supabase in order and enable Clerk as a third-party auth provider.
4. Configure Clerk webhook `/api/webhooks/clerk`.
5. Deploy to a Vercel Preview environment and complete `docs/PRODUCTION_READINESS.md`.
6. Promote the validated deployment to production.

## Rate limiting

Sensitive mutation routes use an in-memory sliding window. Limits are per warm Vercel instance and are suitable for initial single-region operation only. Replace the implementation with Upstash Redis before multi-region or high-volume deployment.

## PWA

The production build registers `/sw.js`, caches same-origin static assets, and provides `/offline` for failed navigations. Install from the browser's app/install menu after deployment.

## Internationalisation

English is the source locale. `lib/i18n.ts` provides the initial dictionary contract for future Hindi and Spanish translations.

## Matching formula

- Skill overlap: 40%
- Domain alignment: 30%
- Availability: 20%
- Engagement preference: 10%
