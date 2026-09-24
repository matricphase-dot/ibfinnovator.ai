import { NextResponse } from "next/server";
import { checkEnv } from "@/lib/env";

/** Pre-deploy gate for innovators-global.com: no secrets, just booleans. */
export async function GET() {
  const env = checkEnv();
  const supabase = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
  const ok = env.ok && supabase;
  return NextResponse.json(
    { ok, auth: "supabase", supabase, missing: env.missing },
    { status: ok ? 200 : 503 },
  );
}
