import { NextResponse, type NextRequest } from "next/server";
import { requireUserOr401 } from "@/lib/auth/require-user-http";
import { z } from "zod";

/**
 * Re-sign a private storage path.
 *
 * Signed URLs expire after an hour, which would leave older chat attachments
 * pointing at dead links. The client calls this when an image fails to load,
 * and the caller's own client verifies access through the storage RLS policies
 * before a fresh URL is handed back.
 */

const schema = z.object({
  bucket: z.enum([
    "avatars",
    "resumes",
    "project-files",
    "team-files",
    "service-portfolios",
    "chat-attachments",
  ]),
  path: z.string().min(1).max(400),
});

export async function POST(request: NextRequest) {
  try {
    const auth = await requireUserOr401();
    if (auth.response) return auth.response;
    const { supabase } = auth.session;
    const { bucket, path } = schema.parse(await request.json());

    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(path, 60 * 60);

    if (error || !data?.signedUrl) {
      return NextResponse.json(
        { error: error?.message ?? "Could not sign that file." },
        { status: 403 },
      );
    }
    return NextResponse.json({ url: data.signedUrl, expiresIn: 3600 });
  } catch (e: any) {
    const unauthorized = e?.message === "UNAUTHORIZED" || e?.message === "PROFILE_NOT_FOUND";
    return NextResponse.json(
      { error: e?.message ?? "Could not sign that file." },
      { status: unauthorized ? 401 : 400 },
    );
  }
}
