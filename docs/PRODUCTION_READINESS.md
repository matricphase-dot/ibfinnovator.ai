# IBF production readiness checklist

A passing build is necessary but does not by itself make the platform production-ready.

## Identity and access (Pure Supabase Auth)

- [ ] `supabase/PRODUCTION_SETUP_ROOT.sql` applied to Supabase project
- [ ] Email, Google, and LinkedIn OAuth providers configured in Supabase Dashboard
- [ ] User sign-up (email verification or autoconfirm), role selection, and 5-step onboarding pass
- [ ] User sign-in (email/password, Google OAuth, LinkedIn OIDC) pass
- [ ] Password reset flow (`/auth/forgot-password` -> email link -> `/auth/reset-password`) passes
- [ ] Authenticated password update in `/settings` passes
- [ ] Single sign-out paths (`/settings` and user menu) clear cookies and terminate session
- [ ] Two-user RLS tests cover profiles, projects, applications, messages, rooms, credentials, and Storage isolation

## Core workflows

- [ ] Founder and student five-step onboarding pass
- [ ] Project publish, application, acceptance, connection, and direct chat pass
- [ ] Team messages, files, tasks, reactions, replies, and typing pass
- [ ] Meeting create, invite, RSVP, and calendar export pass
- [ ] Badge, certificate, review, and endorsement workflows pass
- [ ] Marketplace inquiry, event RSVP, and university API-key workflows pass

## Security

- [ ] Secrets exist only in Vercel encrypted environment variables (`SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`, etc.)
- [ ] CSP verified with Supabase, Sentry, and Storage domains
- [ ] Rate-limit 429 and Retry-After tests pass
- [ ] File MIME/size and cross-user access tests pass
- [ ] Dependency audit reviewed
- [ ] Account export and deletion (`delete_own_account`) tested

## Email and monitoring

- [ ] Resend sender domain, SPF, and DKIM verified
- [ ] Every transactional template delivered and links correctly
- [ ] Email opt-out prevents delivery
- [ ] Sentry client/server/edge test exceptions received
- [ ] Source maps available only to Sentry

## Quality

- [ ] Keyboard-only navigation and modal focus traps pass
- [ ] WCAG AA contrast audit passes
- [ ] Mobile tests pass on current iOS Safari and Android Chrome
- [ ] Lighthouse performance, accessibility, and SEO targets reviewed
- [ ] Sitemap and robots responses verified
- [ ] PWA install, update, and offline fallback pass
- [ ] Load tests cover public reads, matching, chat, and API routes

## Cutover

1. Record the last stable Git/Vercel deployment.
2. Validate all checks in Vercel Preview with separate founder and student test accounts.
3. Apply `supabase/PRODUCTION_SETUP_ROOT.sql` to the production Supabase database.
4. Verify environment variables in Vercel production settings.
5. Deploy to production.
6. Monitor Sentry errors, auth callbacks, email delivery, and API latency.

## Rollback by subsystem

- **Application:** promote the last stable Vercel deployment.
- **Database / RLS:** restore from Supabase automated point-in-time backup.
- **Email:** unset `RESEND_API_KEY`; dispatch safely becomes a no-op.
- **Sentry:** unset DSN/auth token; instrumentation becomes a no-op.
- **PWA:** increment cache version and deploy a service worker that deletes IBF caches.
- **Storage:** disable uploads first; do not delete buckets or objects during incident response.
