/**
 * Clerk publishable-key validation — shared by middleware.ts and the auth
 * pages so all three agree on whether Clerk is usable.
 *
 * Why this exists: clerkMiddleware throws "Publishable key not valid" for a
 * malformed key, and that throw happens inside the request handler, so EVERY
 * route returns 500 — including public pages. Likewise <SignIn /> renders a
 * blank widget when the key is missing. A single typo or placeholder value in
 * the Vercel environment would take the whole site down.
 *
 * The algorithm is a faithful copy of Clerk's own
 * (@clerk/shared -> parsePublishableKey / isPublishableKey / isValidDecodedPublishableKey)
 * and is verified against the real package.
 */

/** Clerk's isValidDecodedPublishableKey */
function isValidDecodedPublishableKey(decoded: string): boolean {
  if (!decoded.endsWith("$")) return false;
  const withoutTrailing = decoded.slice(0, -1);
  if (withoutTrailing.includes("$")) return false;
  return withoutTrailing.includes(".");
}

/** Clerk's isPublishableKey, plus the same base64 decode parsePublishableKey performs. */
export function isValidClerkPublishableKey(key: string | undefined): boolean {
  if (!key) return false;
  if (!key.startsWith("pk_test_") && !key.startsWith("pk_live_")) return false;

  const parts = key.split("_");
  if (parts.length !== 3) return false;

  const encoded = parts[2];
  if (!encoded) return false;

  try {
    // Keys are unpadded base64; pad before decoding.
    const padded = encoded + "=".repeat((4 - (encoded.length % 4)) % 4);
    return isValidDecodedPublishableKey(atob(padded));
  } catch {
    return false;
  }
}

/**
 * True when the deployment has a publishable key Clerk will actually accept.
 * This is the client-safe half of the check — CLERK_SECRET_KEY is server-only,
 * so middleware does the full check including the secret.
 */
export function isClerkPublishableKeyConfigured(): boolean {
  return isValidClerkPublishableKey(
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
  );
}
