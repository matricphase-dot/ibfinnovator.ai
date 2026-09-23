import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { z } from "zod";

/**
 * ROOT FIX for P1: inconsistent status codes + Prisma/Supabase leaks + Zod leaks.
 * Single choke-point for every API route. Never return raw e.message for 500.
 */

export function toStatus(e: unknown): { status: number; message: string } {
  if (e instanceof z.ZodError) {
    const first = e.flatten().formErrors[0] || e.flatten().fieldErrors;
    const msg =
      typeof first === "string"
        ? first
        : Object.values(first).flat()[0] || "Invalid input";
    return { status: 400, message: String(msg).slice(0, 300) };
  }
  if (e instanceof Error) {
    const msg = e.message;
    if (msg === "UNAUTHORIZED") return { status: 401, message: "Authentication required" };
    if (msg === "PROFILE_NOT_FOUND") return { status: 404, message: "Profile not found" };
    if (msg === "FORBIDDEN") return { status: 403, message: "Forbidden" };
    // PostgREST not-found
    if (msg.includes("PGRST116") || msg.includes("0 rows")) return { status: 404, message: "Not found" };
    // Unique violation — never leak constraint name
    if (msg.includes("23505") || msg.toLowerCase().includes("duplicate") || msg.toLowerCase().includes("already exists"))
      return { status: 409, message: "Already exists" };
    // Known safe 400s (validation-style messages under 200 chars without internals)
    if (msg.length < 200 && !/constraint|violates|supabase|postgres|prisma|stack|at /i.test(msg))
      return { status: 400, message: msg };
  }
  return { status: 500, message: "Internal server error" };
}

export function apiError(e: unknown, context?: string): NextResponse {
  const { status, message } = toStatus(e);
  if (status === 500) {
    try {
      Sentry.captureException(e, context ? { tags: { api: context } } : undefined);
    } catch {
      // never throw from error path
    }
    // eslint-disable-next-line no-console
    console.error(`[api:error${context ? `:${context}` : ""}]`, e);
  }
  return NextResponse.json({ error: message }, { status });
}

/** Parse JSON body with safeParse — returns typed data or 400 response tuple. */
export async function parseBody<T extends z.ZodTypeAny>(
  req: Request,
  schema: T,
): Promise<{ data: z.infer<T> } | { response: NextResponse }> {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return { response: NextResponse.json({ error: "Invalid JSON" }, { status: 400 }) };
  }
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    const flat = parsed.error.flatten();
    const firstField = Object.values(flat.fieldErrors).flat()[0] || flat.formErrors[0];
    return {
      response: NextResponse.json(
        { error: firstField || "Invalid input", fieldErrors: flat.fieldErrors },
        { status: 400 },
      ),
    };
  }
  return { data: parsed.data };
}

/** Validate URL query params with safeParse — no silent [] / 400 leaks. */
export function parseQuery<T extends z.ZodTypeAny>(
  searchParams: URLSearchParams,
  schema: T,
): { data: z.infer<T> } | { response: NextResponse } {
  const obj: Record<string, string> = {};
  searchParams.forEach((v, k) => {
    obj[k] = v;
  });
  const parsed = schema.safeParse(obj);
  if (!parsed.success) {
    const flat = parsed.error.flatten();
    const firstField = Object.values(flat.fieldErrors).flat()[0] || flat.formErrors[0];
    return {
      response: NextResponse.json(
        { error: firstField || "Invalid query", fieldErrors: flat.fieldErrors },
        { status: 400 },
      ),
    };
  }
  return { data: parsed.data };
}
