import Link from "next/link";
import { SignUp } from "@clerk/nextjs";
import { isClerkPublishableKeyConfigured } from "@/lib/clerk-keys";

// Read the Clerk key per request rather than baking the decision into a static
// page, so fixing the Vercel env var takes effect without a rebuild surprise.
export const dynamic = "force-dynamic";

export default function SignUpPage() {
  // Clerk not configured (or key malformed): <SignUp /> would render a blank
  // widget, which looks like a broken site. Say so plainly instead — and note
  // there is no legacy self-serve signup route to fall back to.
  if (!isClerkPublishableKeyConfigured()) {
    return (
      <div className="min-h-screen bg-[#0a0f1e] flex flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-md rounded-2xl border border-amber-500/40 bg-amber-500/5 p-8 text-center">
          <h1 className="text-xl font-black text-amber-200">
            Sign-up is temporarily unavailable
          </h1>
          <p className="mt-3 text-sm text-slate-300 leading-relaxed">
            This deployment is not configured for new account creation. If you
            already have an account, you can still sign in.
          </p>
          <p className="mt-6">
            <Link
              href="/auth/legacy-signin"
              className="inline-block rounded-lg bg-cyan-400 px-5 py-2.5 font-bold text-[#0a0f1e]"
            >
              Go to sign in
            </Link>
          </p>
          <p className="mt-5 text-xs text-slate-500">
            Administrator: set NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY and
            CLERK_SECRET_KEY in the deployment environment, then redeploy.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0f1e] flex flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-md">
        <SignUp
          routing="hash"
          signInUrl="/auth/signin"
          fallbackRedirectUrl="/auth/choose-role"
        />
        <p className="text-center text-sm text-slate-500 mt-6">
          Already have an account?{" "}
          <Link href="/auth/signin" className="text-cyan-300 font-bold">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
