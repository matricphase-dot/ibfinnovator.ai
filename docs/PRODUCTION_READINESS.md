# IBF production readiness checklist

A passing build is necessary but does not by itself make the platform production-ready.

## Identity and access

- [ ] Migrations 012–021 applied to preview in order
- [ ] Clerk native Supabase provider active
- [ ] Clerk webhook signature and retry tests pass
- [ ] New Clerk user, linked legacy user, role selection and both sign-out paths pass
- [ ] Two-user RLS tests cover profiles, projects, applications, messages, rooms, credentials and Storage
- [ ] Legacy login remains visible during rollout

## Core workflows

- [ ] Founder and student five-step onboarding pass
- [ ] Project publish, application, acceptance, connection and direct chat pass
- [ ] Team messages, files, tasks, reactions, replies and typing pass
- [ ] Meeting create, invite, RSVP and calendar export pass
- [ ] Badge, certificate, review and endorsement workflows pass
- [ ] Marketplace inquiry, event RSVP and university API-key workflows pass

## Security

- [ ] Secrets exist only in Vercel encrypted environment variables
- [ ] CSP verified with Clerk, Supabase, Sentry and Storage
- [ ] Rate-limit 429 and Retry-After tests pass
- [ ] File MIME/size and cross-user access tests pass
- [ ] Webhook replay/conflict tests pass
- [ ] Dependency audit reviewed
- [ ] Account export/deletion tested

## Email and monitoring

- [ ] Resend sender domain, SPF and DKIM verified
- [ ] Every transactional template delivered and links correctly
- [ ] Email opt-out prevents delivery
- [ ] Sentry client/server/edge test exceptions received
- [ ] Source maps available only to Sentry

## Quality

- [ ] Keyboard-only navigation and modal focus traps pass
- [ ] WCAG AA contrast audit passes
- [ ] Mobile tests pass on current iOS Safari and Android Chrome
- [ ] Lighthouse performance, accessibility and SEO targets reviewed
- [ ] Sitemap and robots responses verified
- [ ] PWA install, update and offline fallback pass
- [ ] Load tests cover public reads, matching, chat and webhooks

## Cutover

1. Back up Supabase and record the last stable Git/Vercel deployment.
2. Validate all checks in Vercel Preview with separate founder/student accounts.
3. Apply migrations to production during a monitored window.
4. Deploy hybrid auth with legacy login enabled.
5. Monitor errors, failed Clerk events, email delivery and API latency.
6. Promote Clerk as default only after the documented observation period.

## Rollback by subsystem

- **Application:** promote the last stable Vercel deployment.
- **Clerk:** disable webhook and Clerk Supabase provider; restore Supabase-only middleware/auth pages.
- **RLS:** restore policies from the last reviewed migration after taking a fresh backup.
- **Email:** unset `RESEND_API_KEY`; dispatch safely becomes a no-op.
- **Sentry:** unset DSN/auth token; instrumentation becomes a no-op.
- **PWA:** increment cache version and deploy a service worker that deletes IBF caches.
- **Storage:** disable uploads first; do not delete buckets or objects during incident response.
