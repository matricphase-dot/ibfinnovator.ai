# Supabase Production Database Setup

This directory contains the canonical production database setup for **IBF Innovators.ai**, architected for **100% Pure Supabase Auth** (Email/Password, Google OAuth, LinkedIn OIDC) with zero Clerk dependencies.

## Files

- **`PRODUCTION_SETUP_ROOT.sql`** (PRIMARY MASTER FILE):
  - **This is the one-shot script to paste into your Supabase Dashboard SQL Editor.**
  - Creates all 34 tables, custom enums, security-definer helper functions, bulletproof `handle_new_user()` trigger, RLS policies, storage buckets & policies, performance indexes, base grants, and realtime publications.
  - Safe and idempotent to run on a fresh or existing Supabase project.

- **`migrations/001_initial_production_schema.sql`**:
  - Exact mirror of `PRODUCTION_SETUP_ROOT.sql` for the Supabase CLI (`supabase db push` / `supabase migration up`).
  - Generated and synchronized via `node scripts/build-setup-sql.mjs`.

## How to Set Up a Fresh Supabase Project

1. Log into your [Supabase Dashboard](https://supabase.com/dashboard).
2. Select your project (e.g. `omfcpzfcjgqqiyvwuyzu`).
3. Click **SQL Editor** in the left sidebar.
4. Click **New Query** (or use the shortcut `Ctrl + Enter`).
5. Open [PRODUCTION_SETUP_ROOT.sql](./PRODUCTION_SETUP_ROOT.sql) in your code editor, copy the entire file contents (`Ctrl + A`, `Ctrl + C`), and paste it into the Supabase SQL Editor.
6. Click **Run** (bottom right) or press `Ctrl + Enter`.
7. Once finished with "Success", run `node scripts/verify-supabase.mjs` in your terminal to verify database health.
