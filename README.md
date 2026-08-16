# IBF — Innovator Bridge Foundry

IBF is a Next.js/Supabase collaboration platform for founders and emerging talent.

## Real-data setup

1. Create a Supabase project.
2. Open **SQL Editor**, paste `supabase/migrations/001_ibf_core.sql`, and run it once.
3. Copy `.env.local.example` to `.env.local` and enter:
   - Session-pooler `DATABASE_URL`
   - Project URL
   - Publishable/anon API key
4. In Supabase Auth URL Configuration, set the Site URL and add `/auth/callback` as an allowed redirect.
5. Run:

```bash
npm install
npm run dev
```

## Implemented real-data foundation

- Supabase email/password and OAuth authentication
- Automatic role-aware profile creation
- Row-Level Security policies
- Founder project creation
- Public live project queries
- Weighted live matchmaking
- Applications/connections schema and APIs
- Persistent bookmarks
- Persistent general/direct/team message schema
- Realtime publication for messages, connections, notifications, and milestones
- Notifications, reviews, endorsements, teams, meetings, and analytics schema
- PWA manifest/service worker

## Match formula

- Required-skill overlap: 40%
- Domain/interest alignment: 30%
- Availability: 20%
- Engagement preference: 10%

No paid AI provider is needed.

## Production

Deploy the repository to Vercel, add the same environment variables, and add the Vercel URL to Supabase Auth redirect URLs. Never expose a database password or service-role key in browser code.
