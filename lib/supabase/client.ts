"use client";

import { useSupabaseBrowser, getSupabaseBrowser } from "./browser";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Canonical browser client factory for Supabase Realtime and client-side operations.
 * Returns singleton browser client with shared wildcard cookie options.
 */
export function createClient(): SupabaseClient {
  return getSupabaseBrowser();
}

export { useSupabaseBrowser, getSupabaseBrowser };
