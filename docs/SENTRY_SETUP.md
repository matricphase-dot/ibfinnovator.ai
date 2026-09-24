# Sentry Error Tracking & Observability Guide

This document outlines the production-grade Sentry configuration for the IBF Platform Next.js application.

---

## 1. Project Overview & Architecture

- **Sentry Organization:** `ibf-i2`
- **Sentry Project:** `javascript-nextjs`
- **SDK Package:** `@sentry/nextjs` (v10.74.0+)
- **Framework Support:** Next.js 15 (App Router + Turbopack/Webpack compatibility)

```
                       ┌────────────────────────────┐
                       │        Next.js App         │
                       └─────────────┬──────────────┘
                                     │
         ┌───────────────────────────┼───────────────────────────┐
         ▼                           ▼                           ▼
┌──────────────────┐       ┌──────────────────┐       ┌──────────────────┐
│  Client Runtime  │       │  Server Runtime  │       │   Edge Runtime   │
│ (Browser/Replay) │       │ (Node.js API/SSR)│       │  (Middleware)    │
└────────┬─────────┘       └────────┬─────────┘       └────────┬─────────┘
         │                          │                          │
         ▼                          ▼                          ▼
instrumentation-client.ts   sentry.server.config.ts   sentry.edge.config.ts
sentry.client.config.ts     instrumentation.ts
         │                          │                          │
         └──────────────────────────┼──────────────────────────┘
                                    │
                                    ▼
                https://*.ingest.us.sentry.io (Sentry SaaS)
```

---

## 2. Configuration Files

| File | Purpose | Description |
|---|---|---|
| [`instrumentation.ts`](../instrumentation.ts) | Server/Edge hook | Imports `sentry.server.config` and `sentry.edge.config` dynamically per runtime. Exports `onRequestError = Sentry.captureRequestError` for Next.js 15 server error capture. |
| [`instrumentation-client.ts`](../instrumentation-client.ts) | Client hook | Turbopack & Webpack compatible client initialization hook. Captures router transition events and browser crashes. |
| [`sentry.client.config.ts`](../sentry.client.config.ts) | Browser config | Configures client tracing and Session Replay with 100% capture on errors. |
| [`sentry.server.config.ts`](../sentry.server.config.ts) | Server config | Captures unhandled server exceptions, route crashes, and database/API performance traces. |
| [`sentry.edge.config.ts`](../sentry.edge.config.ts) | Edge config | Monitors edge middleware and edge API routes. |
| [`next.config.ts`](../next.config.ts) | Build integration | Wraps Next config with `withSentryConfig`, uploads sourcemaps on release, and configures CSP `connect-src` whitelist for Sentry ingestion. |
| [`app/global-error.tsx`](../app/global-error.tsx) | App error boundary | Fallback UI that catches unhandled React root render errors and sends digests to Sentry. |

---

## 3. Environment Variables

Configure the following environment variables across local development and production platforms (e.g., Vercel, GitHub Actions):

| Variable | Environment | Required | Description |
|---|---|---|---|
| `NEXT_PUBLIC_SENTRY_DSN` | All | Yes | Public DSN used by both browser client and server runtimes. |
| `SENTRY_AUTH_TOKEN` | CI/CD, Build | Yes | Secret auth token used by Sentry Build Plugin to upload source maps during `next build`. |
| `SENTRY_ORG` | CI/CD, Build | Yes | Sentry organization slug (`ibf-i2`). |
| `SENTRY_PROJECT` | CI/CD, Build | Yes | Sentry project slug (`javascript-nextjs`). |

> **Note on `.env.sentry-build-plugin`:**
> This file is generated locally for development build tests and is tracked in `.gitignore`. **Do not commit auth tokens to source control.**

---

## 4. Production Sampling Strategy

To balance observability depth with performance and quota management, sampling rates are configured dynamically:

```typescript
// Production vs Development sampling rates
const tracesSampleRate = process.env.NODE_ENV === "production" ? 0.2 : 1.0;
const edgeSampleRate = process.env.NODE_ENV === "production" ? 0.05 : 1.0;

// Session Replay
const replaysSessionSampleRate = 0.1; // 10% of normal user sessions recorded
const replaysOnErrorSampleRate = 1.0;  // 100% of sessions with unhandled errors recorded
```

- **Server & Client Tracing:** 20% sampled in production to prevent performance degradation while maintaining statistical significance.
- **Edge Tracing:** 5% sampled in edge middleware to prevent latency overhead on fast-path redirects.
- **Session Replay on Error:** 100% replay capture on error gives exact visual reproduction of what led to client-side crashes.

---

## 5. Security & Content Security Policy (CSP)

In [`next.config.ts`](../next.config.ts), CSP headers include the Sentry US ingest endpoints to ensure browser events are not blocked by ad-blockers or restrictive policies:

```
connect-src 'self' https://*.supabase.co wss://*.supabase.co https://*.ingest.sentry.io https://*.ingest.us.sentry.io https://*.sentry.io
```

- **Source Map Security:** `sourcemaps: { disable: !process.env.SENTRY_AUTH_TOKEN }` ensures that source maps are only generated and uploaded when authenticated, preventing exposure of unbundled source code to the public web.

---

## 6. How to Verify

1. **Type Check:**
   ```bash
   npm run typecheck
   ```
2. **Production Build:**
   ```bash
   npm run build
   ```
3. **Trigger Test Exception:**
   In development or a test route:
   ```typescript
   import * as Sentry from "@sentry/nextjs";
   Sentry.captureMessage("Test Sentry verification message", "info");
   ```
4. Verify event in Sentry Dashboard:
   - Navigate to **Sentry → Issues → ibf-i2 / javascript-nextjs**.
