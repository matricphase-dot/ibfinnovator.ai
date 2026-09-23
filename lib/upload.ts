import type { SupabaseClient } from "@supabase/supabase-js";
export type UploadBucket =
  | "avatars"
  | "resumes"
  | "project-files"
  | "team-files";
export type UploadResult = { url: string; path: string };
export class UploadError extends Error {
  constructor(
    public code: "TOO_LARGE" | "INVALID_TYPE" | "INVALID_PATH" | "UPLOAD_FAILED",
    message: string,
  ) {
    super(message);
    this.name = "UploadError";
  }
}
// ROOT FIX M2: per-bucket limits (single source of truth — FileUploader must
// import MAX_BY_BUCKET, never hardcode), extension allowlist + magic-byte sniff
// (client MIME is attacker-controlled), strict folderKey, 1h signed URLs.
export const MAX_BY_BUCKET: Record<UploadBucket, number> = {
  avatars: 2 * 1024 * 1024,
  resumes: 10 * 1024 * 1024,
  "project-files": 10 * 1024 * 1024,
  "team-files": 10 * 1024 * 1024,
};
const allowed: Record<UploadBucket, string[]> = {
  avatars: ["image/png", "image/jpeg", "image/webp"],
  resumes: ["application/pdf"],
  "project-files": [
    "application/pdf",
    "image/png",
    "image/jpeg",
    "image/webp",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/zip",
  ],
  "team-files": [
    "application/pdf",
    "image/png",
    "image/jpeg",
    "image/webp",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/zip",
  ],
};
const allowedExtensions: Record<UploadBucket, string[]> = {
  avatars: ["png", "jpg", "jpeg", "webp"],
  resumes: ["pdf"],
  "project-files": ["pdf", "png", "jpg", "jpeg", "webp", "docx", "zip"],
  "team-files": ["pdf", "png", "jpg", "jpeg", "webp", "docx", "zip"],
};
const FOLDER_KEY_RE = /^[A-Za-z0-9-]{1,64}$/;
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function extensionOf(name: string): string {
  const base = name.toLowerCase().split("/").pop() || "";
  const dot = base.lastIndexOf(".");
  if (dot <= 0 || dot === base.length - 1) return "";
  return base.slice(dot + 1);
}

/** Magic-byte sniff: first bytes of file header, not client MIME. */
async function sniffKind(
  file: File,
): Promise<"png" | "jpg" | "webp" | "pdf" | "zip" | "docx" | "unknown"> {
  const buf = new Uint8Array(await file.slice(0, 16).arrayBuffer());
  const hex = (i: number) => buf[i];
  if (
    buf.length >= 8 &&
    hex(0) === 0x89 &&
    hex(1) === 0x50 &&
    hex(2) === 0x4e &&
    hex(3) === 0x47
  )
    return "png";
  if (buf.length >= 3 && hex(0) === 0xff && hex(1) === 0xd8 && hex(2) === 0xff)
    return "jpg";
  if (
    buf.length >= 12 &&
    hex(0) === 0x52 &&
    hex(1) === 0x49 &&
    hex(2) === 0x46 &&
    hex(3) === 0x46 &&
    hex(8) === 0x57 &&
    hex(9) === 0x45 &&
    hex(10) === 0x42 &&
    hex(11) === 0x50
  )
    return "webp";
  if (
    buf.length >= 5 &&
    hex(0) === 0x25 &&
    hex(1) === 0x50 &&
    hex(2) === 0x44 &&
    hex(3) === 0x46 &&
    hex(4) === 0x2d
  )
    return "pdf";
  if (
    buf.length >= 4 &&
    hex(0) === 0x50 &&
    hex(1) === 0x4b &&
    hex(2) === 0x03 &&
    hex(3) === 0x04
  ) {
    const ext = extensionOf(file.name);
    return ext === "docx" ? "docx" : "zip";
  }
  return "unknown";
}

function canonicalContentType(
  bucket: UploadBucket,
  kind: string,
  ext: string,
): string | null {
  const map: Record<string, string> = {
    png: "image/png",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    webp: "image/webp",
    pdf: "application/pdf",
    zip: "application/zip",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  };
  const fromKind = map[kind];
  const fromExt = map[ext];
  // Both signals must agree and be allowed for the bucket — kills polyglot spoofing.
  if (!fromKind || !fromExt || fromKind !== fromExt) return null;
  if (!allowed[bucket].includes(fromKind)) return null;
  return fromKind;
}
export async function uploadFile(
  bucket: UploadBucket,
  file: File,
  folderKey: string,
  supabase: SupabaseClient,
): Promise<UploadResult> {
  const maxBytes = MAX_BY_BUCKET[bucket];
  if (file.size <= 0 || file.size > maxBytes) {
    const mb = Math.round(maxBytes / 1024 / 1024);
    throw new UploadError("TOO_LARGE", `Files must be ${mb}MB or smaller`);
  }
  const folder = folderKey.trim();
  // Strict folderKey: plain profile/room id only — kills `../../` traversal and
  // cross-tenant writes (`other-uuid/...`). UUID or 1-64 alnum-dash.
  if (
    !folder ||
    folder.includes("/") ||
    folder.includes("\\") ||
    folder.includes("..") ||
    (!FOLDER_KEY_RE.test(folder) && !UUID_RE.test(folder))
  ) {
    throw new UploadError("INVALID_PATH", "Invalid upload destination");
  }
  const ext = extensionOf(file.name);
  if (!ext || !allowedExtensions[bucket].includes(ext)) {
    throw new UploadError(
      "INVALID_TYPE",
      `Unsupported file extension for ${bucket}`,
    );
  }
  const kind = await sniffKind(file);
  const contentType = canonicalContentType(bucket, kind, ext);
  if (!contentType) {
    throw new UploadError(
      "INVALID_TYPE",
      "File content does not match its extension",
    );
  }
  const safe = file.name
      .toLowerCase()
      .replace(/[^a-z0-9._-]/g, "-")
      .slice(-120),
    path = `${folder}/${crypto.randomUUID()}-${safe}`;
  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, file, { contentType, upsert: false });
  if (error) throw new UploadError("UPLOAD_FAILED", error.message);
  if (bucket === "avatars") {
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return { url: data.publicUrl, path };
  }
  // 1h signed URLs (was 7 days) — least-privilege lifetime for private buckets.
  const { data, error: signError } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, 60 * 60);
  if (signError || !data?.signedUrl)
    throw new UploadError(
      "UPLOAD_FAILED",
      signError?.message || "Could not sign uploaded file",
    );
  return { url: data.signedUrl, path };
}
export function allowedTypes(bucket: UploadBucket) {
  return allowed[bucket];
}
