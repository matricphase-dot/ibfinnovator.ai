import Link from "next/link";
import { Sparkles } from "lucide-react";
import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <div className="p-6 md:p-12 flex flex-col">
        <Link href="/" className="flex gap-2 items-center font-black text-xl">
          <span className="w-9 h-9 rounded-lg bg-cyan-300 text-slate-950 grid place-items-center">
            <Sparkles size={18} />
          </span>
          IBF
        </Link>
        <div className="w-full max-w-md m-auto py-10">
          <p className="text-[10px] uppercase tracking-[.2em] text-cyan-300 font-bold">
            Secure workspace access
          </p>
          <h1 className="text-3xl font-black mt-2">Welcome back</h1>
          <p className="text-slate-500 mt-2">
            Sign in to continue building with your team.
          </p>
          <div className="mt-7 rounded-2xl bg-white p-2 sm:p-4 shadow-2xl">
            <SignIn
              signUpUrl="/auth/signup"
              fallbackRedirectUrl="/dashboard"
              appearance={{
                variables: {
                  colorPrimary: "#0891b2",
                  borderRadius: "0.75rem",
                },
              }}
            />
          </div>
        </div>
      </div>
      <div className="hidden lg:flex dark-bg p-14 text-white items-end">
        <div className="max-w-lg">
          <span className="text-7xl text-cyan-300">&ldquo;</span>
          <blockquote className="text-3xl font-bold leading-snug">
            IBF helped me find a team that cared as much about the problem as I
            did.
          </blockquote>
          <p className="mt-6 text-cyan-300/70">Maya · Product designer</p>
        </div>
      </div>
    </div>
  );
}
