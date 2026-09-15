/**
 * Helpers for Supabase storage URLs.
 *
 * Private buckets use signed URLs that expire after an hour, so a URL stored in
 * the database (a chat attachment, an applicant's resume) can stop working.
 * These helpers recover the underlying path and re-sign it on demand through
 * the caller's own client, so storage RLS still decides who may read the file.
 */

export function parseStorageUrl(url: string): { bucket: string; path: string } | null {
  try {
    const match = new URL(url).pathname.match(
      /\/storage\/v1\/object\/(?:public|sign)\/([^/]+)\/(.+)$/,
    );
    if (!match) return null;
    return { bucket: decodeURIComponent(match[1]), path: decodeURIComponent(match[2]) };
  } catch {
    return null;
  }
}

/** True for a signed (private-bucket) URL, which is the only kind that expires. */
export function isSignedStorageUrl(url: string): boolean {
  return /\/storage\/v1\/object\/sign\//.test(url) && /[?&]token=/.test(url);
}

/**
 * Return a currently-valid URL for the given storage URL: fresh signed URL when
 * the original has expired, otherwise the original. Falls back to the input on
 * any failure so callers can always render something.
 */
export async function resolveStorageUrl(url: string): Promise<string> {
  if (!url || !isSignedStorageUrl(url)) return url;
  const parsed = parseStorageUrl(url);
  if (!parsed) return url;
  try {
    const response = await fetch("/api/storage/sign", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(parsed),
    });
    if (!response.ok) return url;
    const data = await response.json();
    return data?.url ?? url;
  } catch {
    return url;
  }
}
