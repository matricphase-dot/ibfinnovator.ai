import { z } from "zod";

/**
 * User ids are Clerk user ids (e.g. `user_2abcDe9f…`).
 * Legacy Supabase-auth uuids are also accepted so existing data keeps working.
 */
export const userId = z.string().min(8).max(64);
