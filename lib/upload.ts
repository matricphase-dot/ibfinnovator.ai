import { createBrowserClient } from "@supabase/ssr";

/**
 * Client-side upload helper.
 *
 * Validation happens twice on purpose: here for instant feedback, and again in
 * `/api/upload` because a client check can always be bypassed. The actual write
 * goes through that route using the caller's own credentials — no service-role
 * key ever reaches the browser.
 */

export type UploadBucket =
  | "avatars"
  | "resumes"
  | "project-files"
  | "team-files"
  | "service-portfolios";

export interface UploadedFile {
  url: string;
  path: string;
  name: string;
  size: number;
  type: string;
  bucket: UploadBucket;
}

export interface UploadError {
  code: "TOO_LARGE" | "INVALID_TYPE" | "UPLOAD_FAILED" | string;
  message: string;
}

export const BUCKET_RULES: Record<
  UploadBucket,
  { maxBytes: number; mime: string[]; maxFiles: number; label: string }
> = {
  avatars: {
    maxBytes: 2 * 1024 * 1024,
    mime: ["image/png", "image/jpeg", "image/webp"],
    maxFiles: 1,
    label: "PNG, JPEG or WebP up to 2 MB",
  },
  resumes: {
    maxBytes: 10 * 1024 * 1024,
    mime: ["application/pdf"],
    maxFiles: 1,
    label: "PDF up to 10 MB",
  },
  "project-files": {
    maxBytes: 10 * 1024 * 1024,
    mime: [
      "application/pdf",
      "image/png",
      "image/jpeg",
      "image/webp",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/zip",
      "text/plain",
    ],
    maxFiles: 10,
    label: "PDF, image, Word, ZIP or text up to 10 MB",
  },
  "team-files": {
    maxBytes: 10 * 1024 * 1024,
    mime: [
      "application/pdf",
      "image/png",
      "image/jpeg",
      "image/webp",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/zip",
      "text/plain",
    ],
    maxFiles: 10,
    label: "PDF, image, Word, ZIP or text up to 10 MB",
  },
  "service-portfolios": {
    maxBytes: 10 * 1024 * 1024,
    mime: ["image/png", "image/jpeg", "image/webp", "application/pdf"],
    maxFiles: 10,
    label: "Image or PDF up to 10 MB",
  },
};

/** Validate locally and throw `{code,message}` — never a bare Error. */
export function validateFile(file: File, bucket: UploadBucket): void {
  const rule = BUCKET_RULES[bucket];
  if (!rule) throw { code: "BAD_BUCKET", message: "Unknown upload bucket." };
  if (file.size > rule.maxBytes) {
    throw {
      code: "TOO_LARGE",
      message: `${file.name} is too large. Maximum size is ${Math.round(
        rule.maxBytes / (1024 * 1024),
      )} MB.`,
    };
  }
  const mime = file.type || "application/octet-stream";
  if (!rule.mime.includes(mime)) {
    throw {
      code: "INVALID_TYPE",
      message: `${file.name} is a ${mime} file. Allowed: ${rule.label}.`,
    };
  }
}

/**
 * Upload one file. Returns `{url, path, …}` where `url` is a public URL for
 * public buckets and a 1-hour signed URL for private ones.
 */
export async function uploadFile(
  bucket: UploadBucket,
  file: File,
  folderKey?: string,
): Promise<UploadedFile> {
  validateFile(file, bucket);

  const body = new FormData();
  body.append("bucket", bucket);
  body.append("file", file);
  if (folderKey) body.append("folderKey", folderKey);

  let response: Response;
  try {
    response = await fetch("/api/upload", { method: "POST", body });
  } catch {
    throw { code: "UPLOAD_FAILED", message: "Network error while uploading." };
  }

  const payload = await response.json().catch(() => null);
  if (!response.ok || !payload) {
    throw {
      code: payload?.code || "UPLOAD_FAILED",
      message: payload?.message || payload?.error || "Upload failed.",
    };
  }
  return payload as UploadedFile;
}

/** True when the value looks like an `{code,message}` upload error. */
export function isUploadError(value: unknown): value is UploadError {
  return (
    !!value &&
    typeof value === "object" &&
    "message" in value &&
    typeof (value as UploadError).message === "string"
  );
}

/**
 * Kept for compatibility with earlier code that expected a browser Supabase
 * client. Storage writes now go through `/api/upload`, so this is only a plain
 * anon-key client for realtime channels.
 */
export function getBrowserSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return null;
  return createBrowserClient(url, anonKey);
}
