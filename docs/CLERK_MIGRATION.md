# Clerk dual-auth rollout

## Dashboard configuration

### Clerk

1. Use the production Clerk instance for `innovators-global.com`.
2. Activate Clerk's native Supabase integration.
3. In User & Authentication → Email, phone, username, enable **Username** as an allowed identifier so users can sign in with email, username, Google, or GitHub.
4. Create webhook `https://innovators-global.com/api/webhooks/clerk` for `user.created`, `user.updated`, `user.deleted`.
5. Add its secret to Vercel as `CLERK_WEBHOOK_SIGNING_SECRET`.

### Supabase

1. Authentication → Sign In / Providers → Add Clerk.
2. Enter the Clerk production instance domain.
3. Keep Supabase Email enabled throughout migration.
4. Apply migrations 012, 013, 014 and 015 in order on preview first.

### Vercel

Configure `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, `CLERK_WEBHOOK_SIGNING_SECRET`, `SUPABASE_SERVICE_ROLE_KEY`, Clerk route variables, and existing Supabase public variables.

## Five-phase rollout

1. **Schema:** back up preview DB; apply 012–015; verify `current_profile_id()` and policy definitions.
2. **Hybrid activation:** deploy ClerkProvider, hybrid middleware, webhook, clients and legacy login to a preview deployment.
3. **Validation:** test Clerk signup/role, existing Supabase login, webhook retries, identity linking, public routes, RLS and Storage isolation with two users.
4. **Production coexistence:** deploy with visible legacy login; monitor `clerk_webhook_events` for `FAILED` and identity conflicts for at least two weeks.
5. **Clerk default:** hide legacy link after clean migration; remove legacy auth only in a later reversible release.

## Existing users

Passwords cannot be transferred. Existing users use Clerk password recovery or Google/GitHub with the same verified email. The webhook links that Clerk identity to the existing UUID profile. The UUID and every foreign key remain unchanged. Legacy sign-in remains available during rollout.

## Validation checklist

- Production build succeeds.
- Legacy and Clerk sessions both reach protected APIs.
- Clerk role writes to Clerk metadata and the mapped Supabase profile.
- New Clerk user creates one shadow auth user, profile and identity-map row.
- Duplicate event is a no-op; FAILED event is reclaimable.
- Unverified email and conflicting mapping fail closed.
- Public APIs work signed out.
- Profiles/bookmarks/messages/storage reject cross-user access.
- Both sign-out paths clear their own session.

## Rollback

1. Redeploy the last Supabase-only commit.
2. Restore Supabase-only middleware and `lib/supabase/server.ts`.
3. Restore prior auth pages.
4. Disable Clerk webhook and Supabase Clerk provider.
5. Keep additive identity columns/tables in place.
6. Restore policies from migrations 001–009 only if required and only after a database backup.

## Risk warnings

Applying RLS migrations before enabling Supabase's Clerk provider may deny Clerk requests. Switching to Clerk-only middleware would lock out legacy users. Never expose the service-role or Clerk secret in browser code. Test in Vercel Preview before production.
