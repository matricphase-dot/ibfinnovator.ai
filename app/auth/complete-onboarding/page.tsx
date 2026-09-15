// TODO(batch 4): rebuild 5-step onboarding here.
// Old field capture is in git history at commit 2ae0a27 (app/auth/signup/page.tsx).
// See docs/CLERK_MIGRATION.md for the plan.

"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function CompleteOnboarding() {
  const router = useRouter();
  useEffect(() => {
    // Placeholder — will be replaced in a later batch with the full wizard
    router.replace("/dashboard");
  }, [router]);
  return (
    <div className="min-h-screen flex items-center justify-center text-slate-400">
      Redirecting…
    </div>
  );
}
