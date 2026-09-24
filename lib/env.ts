import { z } from "zod";

/**
 * ROOT (Supabase-only): build/runtime env gate. Auth = Supabase Auth
 * (email + Google + LinkedIn-OIDC). No Clerk variables accepted.
 */
const serverSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(20),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(20),
  NEXT_PUBLIC_APP_URL: z.string().url().default("https://innovators-global.com"),
});

export type Env = z.infer<typeof serverSchema>;

let cached: Env | null = null;

export function getEnv(): Env {
  if (cached) return cached;
  const parsed = serverSchema.safeParse(process.env);
  if (!parsed.success) {
    const missing = Object.keys(parsed.error.flatten().fieldErrors).join(", ");
    throw new Error(`Missing/invalid env: ${missing}`);
  }
  cached = parsed.data;
  return cached;
}

/** Non-throwing probe for /api/health (never leaks values). */
export function checkEnv(): { ok: boolean; missing: string[] } {
  const parsed = serverSchema.safeParse(process.env);
  if (parsed.success) return { ok: true, missing: [] };
  return {
    ok: false,
    missing: Object.keys(parsed.error.flatten().fieldErrors),
  };
}
