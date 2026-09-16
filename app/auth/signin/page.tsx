import { redirect } from "next/navigation";
import Link from "next/link";
import { SignIn } from "@clerk/nextjs";
import { isClerkPublishableKeyConfigured } from "@/lib/clerk-keys";

// Read the Clerk key per request rather than baking the decision into a static
// page, so fixing the Vercel env var takes effect without a rebuild surprise.
export const dynamic = "force-dynamic";

export default function SignInPage() {
  // Clerk not configured (or key malformed): <SignIn /> would render a blank
  // widget, so send the user to the legacy Supabase sign-in form instead.
  if (!isClerkPublishableKeyConfigured()) redirect("/auth/legacy-signin");

  return (
    <div className="min-h-screen bg-[#0a0f1e] flex flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-md">
        <SignIn
          routing="hash"
          signUpUrl="/auth/signup"
          fallbackRedirectUrl="/dashboard"
        />
        <p className="text-center text-sm text-slate-500 mt-6">
          <Link href="/auth/legacy-signin" className="text-cyan-300 font-bold">
            Sign in with legacy account
          </Link>
        </p>
      </div>
    </div>
  );
}
