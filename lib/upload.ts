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
  | "service-portfolios"
  | "chat-attachments";

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
  "chat-attachments": {
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
    maxFiles: 5,
    label: "PDF, image, Word, ZIP or text up to 10 MB",
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

export interface UploadOptions {
  /** Called with 0-100 as the file uploads. */
  onProgress?: (percent: number) => void;
  signal?: AbortSignal;
}

/**
 * Upload one file. Returns `{url, path, …}` where `url` is a public URL for
 * public buckets and a 1-hour signed URL for private ones.
 *
 * Uses XMLHttpRequest when a progress callback is supplied (fetch cannot report
 * upload progress) and fetch otherwise.
 */
export async function uploadFile(
  bucket: UploadBucket,
  file: File,
  folderKey?: string,
  options: UploadOptions = {},
): Promise<UploadedFile> {
  validateFile(file, bucket);

  const body = new FormData();
  body.append("bucket", bucket);
  body.append("file", file);
  if (folderKey) body.append("folderKey", folderKey);

  if (options.onProgress && typeof XMLHttpRequest !== "undefined") {
    return new Promise<UploadedFile>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", "/api/upload");
      if (options.signal) {
        options.signal.addEventListener("abort", () => xhr.abort());
      }
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable && options.onProgress) {
          options.onProgress(Math.round((event.loaded / event.total) * 100));
        }
      };
      xhr.onload = () => {
        let payload: any = null;
        try {
          payload = JSON.parse(xhr.responseText);
        } catch {
          payload = null;
        }
        if (xhr.status >= 200 && xhr.status < 300 && payload) {
          options.onProgress?.(100);
          resolve(payload as UploadedFile);
          return;
        }
        reject({
          code: payload?.code || "UPLOAD_FAILED",
          message: payload?.message || payload?.error || "Upload failed.",
        });
      };
      xhr.onerror = () =>
        reject({ code: "UPLOAD_FAILED", message: "Network error while uploading." });
      xhr.onabort = () =>
        reject({ code: "UPLOAD_FAILED", message: "Upload cancelled." });
      xhr.send(body);
    });
  }

  let response: Response;
  try {
    response = await fetch("/api/upload", {
      method: "POST",
      body,
      signal: options.signal,
    });
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
