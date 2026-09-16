# IBF PRD Gap Analysis

Assessment basis: Founders & Students Collaboration Platform PRD v1.0 (23 May 2026) compared with local commit `a931f6d`.

## Summary

| Area | Estimated completion | Notes |
|---|---:|---|
| Database/domain foundation | 88% | Core and PRD tables, relationships and most RLS exist. |
| Phase 1 MVP | 70% | Core flows exist; onboarding, invites, email and messaging details remain. |
| Phase 2 Growth | 53% | Foundations and several UIs exist; workflows need completion. |
| Phase 3 Scale | 28% | Investor intake, marketplace/events and university portal started. |
| Non-functional readiness | 38% | Responsive UI/build pass; formal security, accessibility and performance testing remain. |
| Overall PRD product | ~55% | Not yet production-complete for all PRD phases. |

## Phase 1 — MVP

- Registration/Auth: mostly built. Email/password and role selection work. OAuth providers require credentials.
- Onboarding: partial. Founder/student questions differ, but PRD five-step journeys, education, proficiency, portfolio and match preview need completion.
- Profiles: mostly built. Real profiles/settings exist; education, proficiency verification and richer work history UI remain.
- Startup/project listing: mostly built. Real publishing and detail pages exist; logo, open roles, team roster, rich problem/solution editor and terms privacy need UI.
- Basic matching: built with transparent structured scoring. Timezone and pass-feedback are incomplete.
- Match feed: built with real data and filtering.
- Applications: built for student submission API/status and founder review. Project-page cover-letter UI and founder proactive invites remain.
- Connections: built with acceptance/rejection and self/duplicate protections.
- One-to-one messaging: persistent and access-controlled. Read receipts, typing, reactions and attachments remain.
- Notifications: in-app built. Transactional email is not integrated.
- Public directory: built with real listings; SEO JSON-LD and sitemap need completion.

## Phase 2 — Growth

- Co-founder questionnaire/matching: built. Double opt-in, prompts and Coffee Chat workflow remain.
- Team rooms: channels, messages, membership, tasks, reactions and pins built. File upload UI and threaded replies remain.
- Meetings: base create/list APIs and UI built; RSVP/export APIs built. UI for attendee selection, RSVP, edit/cancel and ICS download remains.
- Reviews/endorsements: APIs and profile display exist. User-facing creation/award controls remain.
- Badges/certificates: storage, APIs, credential page and public verification exist. Founder award/issue UI and designed PDF output remain.
- Equity/stipend: basic project terms exist. Visibility controls and structured open-role UI remain.
- Advanced AI: values and structured matching exist. Embeddings, implicit-signal ranking and collaborative filtering remain.
- Portfolio/work history: portfolio links exist; structured contribution history remains.

## Phase 3 — Scale

- Investor module: detailed inquiry intake exists. Startup investor visibility profiles and internal inquiry operations remain.
- Service marketplace: browse API/UI exists. Provider publishing/editing, inquiry and transaction workflows remain.
- University: authenticated portal and domain membership exist. API keys, partner administration and white-label configuration remain.
- Community: event browse/RSVP exists. Host create/manage UI, AMAs and founder stories remain.
- Mobile: responsive web/PWA foundation only. Native iOS/Android apps are not built.
- Advanced founder analytics: partial.
- Crowdfunding/donations: not built.

## Safety, privacy and operations

- User report/block APIs: built; report/block buttons need to be placed throughout profiles/projects/messages.
- Customer-facing admin console: intentionally removed. A future admin tool must be a separate private deployment.
- Data export/deletion: built, pending migration 009 in each environment.
- Verification queue: database fields exist; separate private operations tooling remains.
- Rate limiting/anti-spam: not built.
- 2FA: not configured.
- Audit trail: analytics events exist but are not emitted consistently by all workflows.

## Production acceptance work

- Founder and student end-to-end test suites
- RLS/authorization tests
- Accessibility WCAG 2.1 AA audit
- Mobile browser matrix
- Performance budgets and load tests
- Error tracking and alerting
- Email deliverability setup
- File scanning and upload abuse protection
- Privacy/legal review
- Backup and recovery verification
