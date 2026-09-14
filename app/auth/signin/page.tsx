"use client";
import Link from "next/link";
import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
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
