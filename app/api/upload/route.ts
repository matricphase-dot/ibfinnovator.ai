import { NextResponse, type NextRequest } from "next/server";
import { requireUserOr401 } from "@/lib/auth/require-user-http";

export const runtime = "nodejs";

/**
 * Server-side upload endpoint.
 *
 * The browser never holds a storage credential: it posts the file here, and the
 * upload runs through the *caller's own* Supabase client (Clerk token or legacy
 * Supabase session). RLS policies on storage.objects therefore still apply —
 * this deliberately does not use the service-role client.
 */

const BUCKETS = {
  avatars: {
    limit: 2 * 1024 * 1024,
    mime: ["image/png", "image/jpeg", "image/webp"],
    public: true,
    scopedToProfile: true,
  },
  resumes: {
    limit: 10 * 1024 * 1024,
    mime: ["application/pdf"],
    public: false,
    scopedToProfile: true,
  },
  "project-files": {
    limit: 10 * 1024 * 1024,
    mime: [
      "application/pdf",
      "image/png",
      "image/jpeg",
      "image/webp",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/zip",
      "text/plain",
    ],
    public: false,
    scopedToProfile: true,
  },
  "team-files": {
    limit: 10 * 1024 * 1024,
    mime: [
      "application/pdf",
      "image/png",
      "image/jpeg",
      "image/webp",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/zip",
      "text/plain",
    ],
    public: false,
    // Team uploads are scoped to a team room, not to a profile folder.
    scopedToProfile: false,
  },
  "service-portfolios": {
    limit: 10 * 1024 * 1024,
    mime: ["image/png", "image/jpeg", "image/webp", "application/pdf"],
    public: true,
    scopedToProfile: true,
  },
  "chat-attachments": {
    limit: 10 * 1024 * 1024,
    mime: [
      "application/pdf",
      "image/png",
      "image/jpeg",
      "image/webp",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/zip",
      "text/plain",
    ],
    public: false,
    // Scoped to a conversation folder instead: general/ or direct/<project id>/
    scopedToProfile: false,
  },
} as const;

type BucketName = keyof typeof BUCKETS;

const SIGNED_URL_TTL_SECONDS = 60 * 60; // 1 hour

/** Strip directories and anything that could escape the folder. */
const safeName = (name: string) =>
  name
    .split(/[\\/]/)
    .pop()!
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .replace(/^\.+/, "")
    .slice(0, 120) || "file";

export async function POST(request: NextRequest) {
  const auth = await requireUserOr401();
  if (auth.response) return auth.response;
  const session = auth.session;

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json(
      { code: "BAD_REQUEST", message: "Expected multipart form data." },
      { status: 400 },
    );
  }

  const bucket = String(form.get("bucket") || "");
  const file = form.get("file");
  const folderKeyRaw = String(form.get("folderKey") || "");

  if (!(bucket in BUCKETS)) {
    return NextResponse.json(
      { code: "BAD_BUCKET", message: "Unknown upload bucket." },
      { status: 400 },
    );
  }
  const config = BUCKETS[bucket as BucketName];

  if (!(file instanceof File)) {
    return NextResponse.json(
      { code: "NO_FILE", message: "No file was included in the request." },
      { status: 400 },
    );
  }

  if (file.size > config.limit) {
    return NextResponse.json(
      {
        code: "TOO_LARGE",
        message: `That file is too large. Maximum size is ${Math.round(
          config.limit / (1024 * 1024),
        )} MB.`,
      },
      { status: 400 },
    );
  }

  const mime = file.type || "application/octet-stream";
  if (!(config.mime as readonly string[]).includes(mime)) {
    return NextResponse.json(
      { code: "INVALID_TYPE", message: `That file type (${mime}) is not allowed here.` },
      { status: 400 },
    );
  }

  // Profile-scoped buckets must be written under the caller's own folder. The
  // storage policy enforces this too; checking here turns a raw policy error
  // into a readable message.
  let folderKey = folderKeyRaw;
  if (config.scopedToProfile) {
    if (folderKey && folderKey !== session.user.id) {
      return NextResponse.json(
        {
          code: "FORBIDDEN_FOLDER",
          message: "Files can only be uploaded to your own folder.",
        },
        { status: 403 },
      );
    }
    folderKey = session.user.id;
  }

  if (!folderKey) {
    return NextResponse.json(
      { code: "NO_FOLDER", message: "A destination folder is required." },
      { status: 400 },
    );
  }

  const path = `${folderKey}/${crypto.randomUUID()}-${safeName(file.name)}`;

  const { error: uploadError } = await session.supabase.storage
    .from(bucket)
    .upload(path, Buffer.from(await file.arrayBuffer()), {
      contentType: mime,
      upsert: false,
    });

  if (uploadError) {
    return NextResponse.json(
      { code: "UPLOAD_FAILED", message: uploadError.message },
      { status: 400 },
    );
  }

  let url: string;
  if (config.public) {
    url = session.supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
  } else {
    const { data: signed, error: signError } = await session.supabase.storage
      .from(bucket)
      .createSignedUrl(path, SIGNED_URL_TTL_SECONDS);
    if (signError || !signed?.signedUrl) {
      return NextResponse.json(
        { code: "SIGN_FAILED", message: signError?.message ?? "Could not sign the file URL." },
        { status: 400 },
      );
    }
    url = signed.signedUrl;
  }

  return NextResponse.json({
    url,
    path,
    bucket,
    name: file.name,
    size: file.size,
    type: mime,
  });
}
