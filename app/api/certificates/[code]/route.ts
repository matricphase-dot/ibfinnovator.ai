import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
export async function GET(
  _: Request,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params,
    s = await createClient();
  const { data, error } = await s
    .from("certificates")
    .select(
      "*,project:projects(id,title,domain),issuer:profiles!issued_by(id,name,company),receiver:profiles!receiver_id(id,name)",
    )
    .eq("verification_code", code)
    .single();
  return error
    ? NextResponse.json({ error: "Certificate not found" }, { status: 404 })
    : NextResponse.json(data);
}
