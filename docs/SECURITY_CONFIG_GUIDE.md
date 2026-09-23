# Production Security Configuration & Deployment Guide

This guide details all external platform changes (Supabase, Clerk, Vercel/Hosting) and environment variables required for the production deployment of the **C1–C4 & H1–H8 Security Overhaul**.

---

## 1. Supabase Configuration Changes

### A. Rotate `SUPABASE_SERVICE_ROLE_KEY` (CRITICAL)
> **Why:** In previous commits, `SUPABASE_SERVICE_ROLE_KEY` was imported inside `middleware.ts` (Edge runtime). To ensure absolute security in production, rotate this key immediately after deploying this fix.

1. Go to your **Supabase Project Dashboard** -> **Project Settings** -> **API**.
2. Under **Project API keys**, locate `service_role` (secret).
3. Click **Generate a new secret** or **Roll key** (Note: this invalidates the old key immediately).
4. Copy the new secret and update:
   - Your local `.env.local` (`SUPABASE_SERVICE_ROLE_KEY=...`)
   - Your Vercel Project Environment Variables (`SUPABASE_SERVICE_ROLE_KEY`)

### B. Clerk Authentication Integration in Supabase
Supabase needs to verify tokens signed by Clerk.
1. Go to **Supabase Dashboard** -> **Project Settings** -> **API** -> scroll to **JWT Settings**.
2. Note your **JWT Secret** (used in Clerk below).
3. Ensure Supabase migrations `012`, `013`, `014`, `015`, and `016` are applied:
   - Check that the function `public.current_profile_id()` exists and extracts `auth.jwt()->>'sub'` or looks up `clerk_identity_map`.
   - Check that `public.can_access_team_room(target_room uuid)` and `public.touch_current_profile()` are present.

---

## 2. Clerk Configuration Changes

### A. Create the Supabase JWT Template (CRITICAL)
The application code in `lib/supabase/clerk-server.ts` and `lib/supabase/clerk-client.ts` now calls:
```ts
getToken({ template: "supabase" })
```
If this template does not exist in your Clerk Dashboard, Clerk will return `null` and requests will fail closed with `UNAUTHORIZED`.

**Steps to configure:**
1. Open the **Clerk Dashboard** -> select your application.
2. In the left navigation, navigate to **Configure** -> **JWT Templates**.
3. Click **New template** and select the **Supabase** template preset (or custom).
4. Set the **Name** to exactly:
   ```
   supabase
   ```
   *(Must be lowercase `supabase`)*
5. Set the **Signing Key**:
   - If using HMAC: Enter the **Supabase JWT Secret** copied from Supabase Dashboard -> Settings -> API -> JWT Settings.
   - If using RS256: Ensure Supabase is configured with Clerk's JWKS URL (`https://<your-clerk-domain>/.well-known/jwks.json`).
6. Set the **Token Lifetime**: 60 seconds (default recommended).
7. Ensure the Claims JSON contains:
   ```json
   {
     "aud": "authenticated",
     "role": "authenticated",
     "email": "{{user.primary_email_address}}",
     "app_metadata": {
       "provider": "clerk"
     },
     "user_metadata": {
       "role": "{{user.public_metadata.role}}"
     }
   }
   ```
8. Click **Save**.

### B. Clerk Webhook Configuration
The Clerk webhook syncs users to your Supabase `profiles` table and shadow accounts.
1. In Clerk Dashboard, navigate to **Configure** -> **Webhooks**.
2. Click **Add Endpoint**.
3. Endpoint URL:
   - Production: `https://innovators-global.com/api/webhooks/clerk` (or your production domain)
   - Staging/Preview: `https://your-preview-deployment.vercel.app/api/webhooks/clerk`
4. Subscribe to the following **Events**:
   - `user.created`
   - `user.updated`
   - `user.deleted`
5. Click **Create**.
6. Copy the **Signing Secret** (starts with `whsec_...`).
7. Save this as `CLERK_WEBHOOK_SIGNING_SECRET` in your environment variables.

---

## 3. Environment Variables Inventory

### Required for Core Functionality

| Variable | Scope | Location | Description |
|---|---|---|---|
| `NEXT_PUBLIC_APP_URL` | Public (Client & Server) | `.env.local` / Vercel | Production base URL (e.g. `https://innovators-global.com`) |
| `NEXT_PUBLIC_SUPABASE_URL` | Public | `.env.local` / Vercel | Supabase project URL (`https://xyz.supabase.co`) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public | `.env.local` / Vercel | Supabase anon public key |
| `SUPABASE_SERVICE_ROLE_KEY` | **Server Only (SECRET)** | `.env.local` / Vercel | Server-role key (used only in `lib/supabase/admin.ts` for webhooks) |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Public | `.env.local` / Vercel | Clerk publishable key (`pk_...`) |
| `CLERK_SECRET_KEY` | **Server Only (SECRET)** | `.env.local` / Vercel | Clerk backend secret (`sk_...`) |
| `CLERK_WEBHOOK_SIGNING_SECRET` | **Server Only (SECRET)** | `.env.local` / Vercel | Clerk webhook secret (`whsec_...`) |

### Optional / Recommended for Scale & Production

| Variable | Scope | Description |
|---|---|---|
| `UPSTASH_REDIS_REST_URL` | Server Only | Upstash Redis REST URL for distributed rate limiting across Vercel serverless lambdas. |
| `UPSTASH_REDIS_REST_TOKEN` | Server Only | Upstash Redis REST bearer token. |
| `RESEND_API_KEY` | Server Only | Resend API key for transactional emails (`re_...`). |
| `EMAIL_FROM` | Server Only | Sender header (e.g. `IBF <no-reply@innovators-global.com>`). |
| `NEXT_PUBLIC_SENTRY_DSN` | Public | Sentry DSN for frontend and backend error telemetry. |
| `SENTRY_AUTH_TOKEN` | Build Only | Sentry auth token for uploading production sourcemaps during build. |

### Variables Safe to Remove
- `DATABASE_URL` / `DIRECT_URL` (if previously used only for Prisma; Prisma has been decommissioned).
