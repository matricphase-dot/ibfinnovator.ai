# Supabase Production Database Setup

This directory contains the canonical production database contract for **IBF Innovators.ai**, architected for **100% Pure Supabase Auth** with zero Clerk dependencies.

## Files

- **`PRODUCTION_SETUP_ROOT.sql`**: pasteable fresh-install and repair artifact for the Supabase SQL Editor. It includes the final reconciliation phase and can be rerun against a compatible project.
- **`hotfix_default_privileges.sql`**: default-privilege audit and repair. It strips the API roles from every default ACL the project role controls and reports the three entries Supabase owns as `supabase_admin`, which a project cannot alter. Run it when verification reports project-controllable exposure, or to confirm the platform boundary.
- **`migrations/001_initial_production_schema.sql`**: immutable historical baseline.
- **`migrations/20260924000000_reconcile_production_contract.sql`**: forward migration that reconciles the application contract, relationships, constraints, RLS, indexes, storage, realtime publication, grants, and RPCs.
- **`tests/fresh_install_smoke.sql`** and **`tests/upgrade_smoke.sql`**: TAP catalog assertions for a fresh chain and an upgraded schema.
- **`preflight_production.sql`**: read-only checks to run and retain the output before applying the repair to a populated project.

## Fresh project

1. Open the Supabase Dashboard and select **SQL Editor -> New query**.
2. Paste the entire contents of `PRODUCTION_SETUP_ROOT.sql`.
3. Run the query and wait for a successful transaction result.
4. Run `npm run db:check` and, with a local Supabase stack available, `npm run db:test`.
5. Run `node scripts/verify-supabase.mjs`. If it reports project-controllable default-privilege exposure, paste `hotfix_default_privileges.sql` and run it, then verify again.

Supabase also creates default privileges in `public` owned by the platform role `supabase_admin`. A project cannot run `ALTER DEFAULT PRIVILEGES FOR ROLE` on a role it is not a member of, so those entries are read-only from both the SQL Editor and a project connection. They only affect objects Supabase itself creates, and `schema_contract` audits the actual privileges on every table, routine, and column, so any real exposure still fails verification. The verifier prints them as an informational note.

## Existing project

Use a preview branch or backup before applying the versioned migration with the Supabase CLI. Do not use `supabase db reset` against a hosted production project. Run the upgrade smoke assertions against the preview schema before promotion.

The root artifact is one transaction and briefly holds schema locks while it reconciles tables, policies, indexes, and grants. Schedule a maintenance window for a populated production project and rehearse the exact script on a preview branch or production-sized snapshot first. Local database tests require Docker and a running Supabase stack (`supabase start`).

The migration file is the auditable deployment history and must remain immutable after release.

## After pasting the root artifact

Pasting SQL into the SQL Editor does not record migration history, so record the applied versions once or the next `supabase db push` will try to re-apply them:

```bash
npx supabase login
npx supabase link --project-ref <project-ref>
npx supabase migration list
npx supabase migration repair --status applied 001
npx supabase migration repair --status applied 20260924000000
```

Run `node scripts/verify-supabase.mjs` after any paste; it checks the schema contract, RPCs, storage buckets, the public anonymous reads the marketing pages depend on, and that sensitive reads stay denied.
