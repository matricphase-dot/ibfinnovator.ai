# IBF PRD Implementation Scope

Source: Founders & Students Collaboration Platform PRD v1.0, 23 May 2026.

## Product decisions

- Pricing: free during launch and validation. No paywall or payment processor.
- Branding: IBF — Innovator Bridge Foundry.
- Applications: verified students may apply to any open project; match scores rank applicants.
- Co-founder mode: free for verified users after profile completion and values questionnaire.
- Equity/stipend: surface ranges, expectations and visibility controls only. IBF does not execute legal agreements.
- Infrastructure: Vercel + Supabase free tiers. Supabase Auth, PostgreSQL, Realtime and Storage.
- Matching: transparent hybrid structured scoring first. pgvector/semantic matching may be enabled without making core matching dependent on a paid AI API.

## Required modules

### Phase 1 — launch-critical

- Founder and student role-aware onboarding
- Complete profile builder: skills, education, goals, portfolio, availability, location/timezone
- Structured startup and project profiles
- Open roles and engagement terms
- Live project directory and SEO project pages
- Student applications and founder invites
- Student-to-project and founder-to-talent matching
- Save, pass and connect actions
- Mutual connections
- Persistent one-to-one messaging
- In-app and email notifications
- Founder and student dashboards

### Phase 2 — growth

- Co-founder intent and compatibility questionnaire
- Double-opt-in co-founder connections
- Coffee-chat meeting template
- Team rooms and configurable channels
- File sharing, pinned messages and threads
- Task cards and project milestones
- Meeting scheduler, RSVP and calendar export
- Reviews, recommendations and skill endorsements
- Experience badges and PDF certificates
- Equity/stipend visibility module
- Enhanced matching signals and human-readable explanations
- Student work history and portfolio

### Phase 3 — scale

- Investor visibility and detailed inquiry intake
- Service marketplace for freelancer discovery
- University API and partner access
- Founder project/team analytics
- Community events, AMAs and founder stories
- Admin moderation, reports, blocks and verification queue
- Data export and account deletion
- Mobile-web feature parity and PWA

## Non-functional acceptance criteria

- No demonstration records in authenticated product screens
- Role-based authorization and Supabase Row-Level Security
- Responsive mobile, tablet and desktop layouts
- Accessible labels, keyboard support and reduced-motion support
- SEO metadata and JSON-LD for public projects
- Clear loading, empty, error and retry states
- Rate limits and anti-spam controls on messaging/applications
- Data privacy controls, export and deletion
- Real activity analytics and audit events
- Production build and end-to-end workflow verification before release
