import { z } from "zod";

/**
 * ROOT FIX for M5: stored `javascript:` / `data:` XSS.
 * Single choke-point: only https:// URLs (or null) are accepted anywhere
 * user-controlled URLs are persisted (avatar, portfolio, attachments).
 */

const UNSAFE_PROTOCOL = /^(javascript|data|vbscript|file|blob):/i;

export function isSafeHttpsUrl(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > 2048) return false;
  if (UNSAFE_PROTOCOL.test(trimmed)) return false;
  // Block backslash-tricks, control chars, embedded whitespace
  if (/[\s\x00-\x1F\x7F\\]/.test(trimmed)) return false;
  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return false;
  }
  if (parsed.protocol !== "https:") return false;
  if (!parsed.hostname || parsed.hostname.length > 253) return false;
  // Block userinfo (`https://evil@trusted`) and non-default-port tricks are allowed
  // but userinfo is a classic phishing vector — reject it at the root.
  if (parsed.username || parsed.password) return false;
  return true;
}

export function sanitizeHttpsUrl(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!isSafeHttpsUrl(trimmed)) return null;
  return trimmed;
}

/** Drop-in zod schema: use everywhere instead of bare `z.string().url()`. */
export function safeHttpsUrlSchema(options?: { max?: number }) {
  const max = options?.max ?? 2048;
  return z
    .string()
    .trim()
    .min(1)
    .max(max)
    .refine(isSafeHttpsUrl, {
      message: "URL must be a valid https:// address",
    });
}

export function safeHttpsUrlNullableSchema() {
  return z
    .string()
    .trim()
    .max(2048)
    .nullable()
    .optional()
    .refine((v) => v == null || v === "" || isSafeHttpsUrl(v), {
      message: "URL must be a valid https:// address",
    });
}

export function filterSafeUrls(urls: unknown): string[] {
  if (!Array.isArray(urls)) return [];
  const out: string[] = [];
  for (const u of urls) {
    if (typeof u !== "string") continue;
    const clean = u.trim();
    if (isSafeHttpsUrl(clean) && !out.includes(clean)) out.push(clean);
  }
  return out;
}
