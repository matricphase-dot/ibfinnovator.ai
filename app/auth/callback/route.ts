import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

function sanitizeNext(raw: string | null): string {
  if (!raw || typeof raw !== "string") return "/dashboard";
  const t = raw.trim();
  if (
    !t.startsWith("/") ||
    t.startsWith("//") ||
    t.startsWith("/\\") ||
    t.includes("\\") ||
    t.includes("://") ||
    /[\x00-\x1F\x7F]/.test(t) ||
    /^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(t)
  ) {
    return "/dashboard";
  }
  return t;
}

/**
 * ROOT (Supabase-only): PKCE/OAuth code exchange.
 * Supabase redirects here with ?code=… after email verification, password reset, Google, or LinkedIn.
 * Hardened with provider error handling, cookie propagation, and smart onboarding routing.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);

  // 1. Handle OAuth provider errors (e.g. user cancelled login)
  const oauthError = url.searchParams.get("error");
  const oauthErrorDesc = url.searchParams.get("error_description");
  if (oauthError) {
    const message = oauthErrorDesc || oauthError || "Authentication cancelled";
    return NextResponse.redirect(
      new URL(`/auth/signin?error=${encodeURIComponent(message)}`, url.origin),
    );
  }

  const code = url.searchParams.get("code");
  let next = sanitizeNext(url.searchParams.get("next"));

  if (code) {
    const store = await cookies();
    const response = NextResponse.redirect(new URL(next, url.origin));

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => store.getAll(),
          setAll(values) {
            try {
              values.forEach(({ name, value, options }) => {
                store.set(name, value, options);
                response.cookies.set(name, value, options);
              });
            } catch {
              // Server component read-only fallback
            }
          },
        },
      },
    );

    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
    if (exchangeError) {
      return NextResponse.redirect(
        new URL(
          `/auth/signin?error=${encodeURIComponent(exchangeError.message || "Failed to authenticate")}`,
          url.origin,
        ),
      );
    }

    // 2. Smart Routing: inspect onboarding state for newly authenticated sessions
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        // If user is performing password recovery, direct them to reset-password
        if (next === "/auth/reset-password") {
          response.headers.set("Location", new URL("/auth/reset-password", url.origin).toString());
          return response;
        }

        const { data: profile } = await supabase
          .from("profiles")
          .select("role, onboarding_completed")
          .eq("id", user.id)
          .maybeSingle();

        // If newly created user landed on /dashboard without completing onboarding,
        // route them to role selection or onboarding wizard.
        if (profile && !profile.onboarding_completed) {
          if (next === "/dashboard") {
            next = "/auth/choose-role";
          }
        }
      }
    } catch {
      // Best-effort smart routing; fallback to sanitized next
    }

    response.headers.set("Location", new URL(next, url.origin).toString());
    return response;
  }

  return NextResponse.redirect(new URL(next, url.origin));
}
