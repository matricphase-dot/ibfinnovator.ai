# Phase 5: Link-in-Bio & Public Portfolio Builder
> **Status:** Planning · Ponytail Strict: Clean SSR/ISR + Edge CDN Cache  
> **Target:** Ultra-fast public profile pages (`/@username`) with Cloudflare edge caching, tailored for Founders vs. Students.

---

## 1. Public Portfolio Architecture
- **URL Route:** `innovator-global.com/@username`
- **Render Mode:** Next.js Server Components with ISR (`revalidate = 3600`) or standard SSR backed by Cloudflare Cache Rules.
- **Cache Headers:** `Cache-Control: public, s-maxage=3600, stale-while-revalidate=86400`.

---

## 2. Profile Customization Engine (`/profile/edit`)
- Live preview editor: Drag-and-drop link ordering, theme selector (Minimalist, Obsidian, Cyber, Clean Slate).
- Role-specific dynamic blocks:
  - **Founder:** Startup pitch, Stage badge, Team roster, Key milestones, Pitch deck link, Founder socials.
  - **Student:** Degree / University, Core skills chips, Project portfolio showcase, GitHub / Portfolio links.

---

## 3. Instant Cache Invalidation (Cloudflare Purge API)
When a user updates their profile in `/profile/edit`:
```typescript
// Call Cloudflare Zone Purge API on update:
await fetch(`https://api.cloudflare.com/client/v4/zones/${process.env.CLOUDFLARE_ZONE_ID}/purge_cache`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${process.env.CLOUDFLARE_API_TOKEN}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    files: [`https://innovator-global.com/@${username}`]
  })
});
```
This drops the edge-cached copy within seconds without needing a server restart or cache flush.
