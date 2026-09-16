/**
 * Shared messaging constants.
 *
 * Single source of truth for the reaction allowlist so the API route and the
 * UI cannot drift apart. `strip()` lets a bare "❤" from an emoji picker match
 * the canonical "❤️" that carries the variation selector.
 */

export const ALLOWED_REACTIONS = ["👍", "❤️", "🔥", "👏", "🚀"] as const;

export type ReactionEmoji = (typeof ALLOWED_REACTIONS)[number];

export const stripVariationSelector = (value: string) => value.replace(/\uFE0F/g, "");

/** Canonical allowlisted emoji for any equivalent input, otherwise null. */
export function canonicalReaction(input: string): string | null {
  return (
    ALLOWED_REACTIONS.find(
      (emoji) => stripVariationSelector(emoji) === stripVariationSelector(input),
    ) ?? null
  );
}

export interface MessageAttachment {
  url: string;
  name: string;
  size?: number;
  type?: string;
  path?: string;
}

/** Human-readable file size. */
export function formatBytes(bytes?: number): string {
  if (!bytes || bytes < 0) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Supabase signed URLs expire, so a stored URL can stop working after an hour.
 * Falling back to the stored path keeps the file reachable for private buckets.
 */
export function isExpiredSignedUrl(url: string): boolean {
  return /[?&]token=/.test(url) && /\/object\/sign\//.test(url);
}
