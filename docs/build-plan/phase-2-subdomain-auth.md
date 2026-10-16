# Phase 2: Subdomain Routing & Role-Based Auth
> **Status:** ✅ **COMPLETED & VERIFIED** · Ponytail Strict: Single clean Next.js middleware  
> **Results:** Subdomain routing (`app.*` vs root), `/@username` rewrite to `/portfolio/[username]`, role selection with Founder/Student/Employee options, passed production build.

---

## 1. Middleware Architecture (`middleware.ts`)

Extract the hostname on incoming requests and rewrite internal Next.js routes:

```typescript
// Pseudocode for middleware.ts
const host = req.headers.get('host') || '';
const isAppSubdomain = host.startsWith('app.') || host.includes('localhost:3000');

// 1. Root Domain (innovator-global.com):
// - /@username -> rewrites to /public-portfolio/[username]
// - / -> public landing page
if (!isAppSubdomain) {
  if (pathname.startsWith('/@')) {
    const username = pathname.replace('/@', '');
    return NextResponse.rewrite(new URL(`/portfolio/${username}`, req.url));
  }
  return NextResponse.next();
}

// 2. App Subdomain (app.innovator-global.com):
// - Authenticated workspace, chat, project management
// - Redirects unauthenticated users to /login
```

---

## 2. Role-Based Navigation & Access Control

Users select their role upon signup:
1. **Founder:** Access to Workspace creation, Project roadmaps, Cycles, Chat, Team invites, and Founder Portfolio (`startup_name`, `startup_stage`, funding).
2. **Student:** Access to Assigned projects/issues, Team chat, and Student Portfolio (`education`, `skills`, project highlights).
3. **Employee / Team Member:** Access to Assigned projects, Cycles, and Workspace chat channels.

---

## 3. Verification & Gate Checks
- Test hostname rewrite logic with mock `x-forwarded-host` headers.
- Test unauthenticated attempts to hit `/dashboard` on `app.*` receive clean redirect to `/login`.
- Verify `npm run typecheck` passes.
