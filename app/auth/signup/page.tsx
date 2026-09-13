import { SignUp } from "@clerk/nextjs";
import Link from "next/link";
export default function SignUpPage() {
  return (
    <main className="min-h-screen bg-[#0a0f1e] grid place-items-center p-6">
      <div className="w-full max-w-md">
        <div className="mb-5">
          <p className="text-[10px] tracking-[.2em] text-cyan-300 font-bold">
            ACCOUNT · STEP 1 OF 5
          </p>
          <h1 className="text-3xl font-black mt-2">Create your IBF account</h1>
          <p className="text-sm text-slate-500 mt-2">
            Clerk securely handles your email, password, verification, Google
            and GitHub login. Your role-specific profile follows next.
          </p>
        </div>
        <SignUp
          routing="path"
          path="/auth/signup"
          signInUrl="/auth/signin"
          fallbackRedirectUrl="/auth/choose-role"
        />
        <p className="text-center text-sm text-slate-500 mt-5">
          Already have an account?{" "}
          <Link href="/auth/signin" className="text-cyan-300 font-bold">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
