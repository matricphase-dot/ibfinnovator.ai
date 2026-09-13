import type { SupabaseClient } from "@supabase/supabase-js";
export type UploadBucket =
  | "avatars"
  | "resumes"
  | "project-files"
  | "team-files";
export type UploadResult = { url: string; path: string };
export class UploadError extends Error {
  constructor(
    public code: "TOO_LARGE" | "INVALID_TYPE" | "UPLOAD_FAILED",
    message: string,
  ) {
    super(message);
    this.name = "UploadError";
  }
}
const MAX = 10 * 1024 * 1024;
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
export async function uploadFile(
  bucket: UploadBucket,
  file: File,
  folderKey: string,
  supabase: SupabaseClient,
): Promise<UploadResult> {
  if (file.size > MAX)
    throw new UploadError("TOO_LARGE", "Files must be 10MB or smaller");
  if (!allowed[bucket].includes(file.type))
    throw new UploadError(
      "INVALID_TYPE",
      `Unsupported file type for ${bucket}`,
    );
  const safe = file.name
      .toLowerCase()
      .replace(/[^a-z0-9._-]/g, "-")
      .slice(-120),
    path = `${folderKey}/${crypto.randomUUID()}-${safe}`;
  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, file, { contentType: file.type, upsert: false });
  if (error) throw new UploadError("UPLOAD_FAILED", error.message);
  if (bucket === "avatars") {
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return { url: data.publicUrl, path };
  }
  const { data, error: signError } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, 60 * 60 * 24 * 7);
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
