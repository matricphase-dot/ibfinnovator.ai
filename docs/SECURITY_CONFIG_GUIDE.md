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

---

## 4. Phase 2: Moderate Severity Hardening (M1–M8) Configuration

This phase eliminates medium-risk injection, state mutation, storage snooping, and privilege escalation vulnerabilities.

### A. M8: Supabase Storage RLS & Database Migration `024`
1. Open the **Supabase Dashboard** -> **SQL Editor**.
2. Run the SQL script from `supabase/migrations/024_storage_admin_hardening.sql`:
   - **Avatar Limits**: Enforces 2MB maximum limit on the `avatars` bucket (`storage.buckets.file_size_limit = 2097152`) matching client/server restrictions.
   - **Project Files & Resumes**: Restricts `SELECT` queries to owner-only path-based folder checks (`(storage.foldername(name))[1] = public.current_profile_id()::text`). Eliminates direct storage object guessing by other authenticated users.
   - **Short-Lived Signed URLs**: Reduces signed URL validity from 7 days down to 1 hour (3600s) for least-privilege private file access.
   - **Admin Audit Log**: Creates `public.admin_audit_log` with RLS enabled (accessible only to service role) for logging Super Admin access attempts.

### B. M6: Clerk Super Admin Setup & Private Metadata
To prevent privilege escalation through writable `profiles.role` database rows, Super Admin checks now use Clerk `privateMetadata` as the authoritative source of truth.
1. In the **Clerk Dashboard**, locate the target Super Admin user.
2. In the user details, navigate to **Metadata** -> **Private Metadata**.
3. Set the role to:
   ```json
   {
     "role": "SUPER_ADMIN"
   }
   ```
4. Save changes. Any administrative endpoint (such as `/api/university/admin`) verifies this claim on each request and writes an entry to `admin_audit_log`.
5. API keys generated for university integrations now use 256-bit cryptographically secure pseudorandom numbers prefixed with `ibf_`.

### C. M7: Edge CSRF & Origin Defense
1. State-changing requests (`POST`, `PUT`, `PATCH`, `DELETE`) on API routes are gated in `middleware.ts`:
   - Browser requests with `sec-fetch-site: cross-site` are blocked immediately with `403 Forbidden`.
   - `Origin` and `Referer` headers are validated against the request host and `NEXT_PUBLIC_APP_URL`.
2. Ensure `NEXT_PUBLIC_APP_URL` is accurately configured in production to match your exact canonical domain (e.g. `https://innovators-global.com`).
3. Presence tracking cookie uses the `__Host-` prefix in production (`__Host-ibf_seen`) to ensure secure-only, host-bound transmission.

### D. M1: Strict Content Security Policy & Isolation Headers
In `next.config.ts`:
- Removed `unsafe-eval` from script directives.
- Retained minimal required `unsafe-inline` for Clerk authentication components.
- Added cross-origin isolation headers: `Cross-Origin-Opener-Policy: same-origin`, `Cross-Origin-Resource-Policy: same-origin`, and `Origin-Agent-Cluster: ?1`.
- Configured API routes (`/api/:path*`) with `Cache-Control: private, no-store, max-age=0` to prevent sensitive caching.

### E. M2: Magic-Byte Upload Sniffing & MIME Parity
In `lib/upload.ts` and `components/FileUploader.tsx`:
- Validates file signatures (magic bytes) for PNG, JPEG, WebP, PDF, ZIP, and DOCX.
- Cross-validates detected magic bytes against file extensions and allowed bucket types to defeat polyglot and spoofing attacks.
- Strict path sanitization on upload folders (`folderKey`) prevents directory traversal (`../`).
- Automatically revokes temporary preview object URLs (`URL.revokeObjectURL`) to prevent browser memory leaks.

### F. M3: Email Header Injection Protection
In `lib/security/email.ts` and `lib/email/client.ts`:
- Strips CR/LF characters (`\r`, `\n`) and ASCII control characters from email subjects.
- Validates recipient email lists through strict zod schemas, preventing SMTP header injection attacks.

### G. M4: Authorization & Probing Defenses on Reactions and Marketplace Inquiries
- Message reaction endpoints (`/api/team/reactions`, `/api/messages/[id]/react`) enforce that the caller has active read access to the target message before accepting reactions, preventing existence oracles and timing attacks.
- Marketplace inquiries (`/api/marketplace/[id]/inquiries`) block self-inquiries and inactive service requests at the application level.

### H. M5: Safe HTTPS URLs & Stored XSS Prevention
- Replaced open `z.string().url()` validators across all user profiles, onboarding, project attachments, and chat endpoints with `safeHttpsUrlSchema()`.
- Drops `javascript:`, `data:`, `blob:`, and userinfo credential spoofing.
- Attachment and link preview components sanitize and discard unsafe protocols before DOM rendering.

