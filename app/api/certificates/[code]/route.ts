import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Public certificate lookup by verification code — the backend for /verify/[code].
 *
 * Anyone holding the code may read this without signing in, which is the whole
 * point of a verifiable certificate. Because it is public it must never fail
 * with a bare 500: if the server client cannot be created (missing or broken
 * configuration) the caller gets a clean 404 so the verify page can render its
 * "certificate not found" card instead of crashing.
 */
export async function GET(
  _: Request,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params;

  if (!code || code.length > 128) {
    return NextResponse.json({ error: "Certificate not found" }, { status: 404 });
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("certificates")
      .select(
        "*,project:projects(id,title,domain),issuer:profiles!issued_by(id,name,company),receiver:profiles!receiver_id(id,name)",
      )
      .eq("verification_code", code)
      .maybeSingle();

    if (error || !data) {
      return NextResponse.json({ error: "Certificate not found" }, { status: 404 });
    }
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Certificate not found" }, { status: 404 });
  }
}
