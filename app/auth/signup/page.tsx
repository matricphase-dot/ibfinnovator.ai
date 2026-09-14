"use client";
import Link from "next/link";
import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
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
