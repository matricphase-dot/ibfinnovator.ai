import { Compass, Search } from "lucide-react";
import Link from "next/link";

/**
 * 404 page. Server component, so it also covers URLs that never reach a route.
 * Offers the three places a lost visitor actually wants, rather than a single
 * "back" link.
 */
export default function NotFound() {
  return (
    <div className="max-w-2xl mx-auto px-6 py-24 text-center">
      <span className="h-14 w-14 rounded-2xl bg-cyan-300/10 text-cyan-300 grid place-items-center mx-auto">
        <Compass size={26} />
      </span>
      <p className="text-[10px] tracking-[.2em] text-cyan-300 font-bold mt-7">
        ERROR 404
      </p>
      <h1 className="text-3xl font-black mt-2">We could not find that page</h1>
      <p className="text-slate-500 mt-3">
        The link may be old, or the page may have moved. Here is where most
        people are heading:
      </p>

      <div className="flex flex-wrap gap-3 justify-center mt-8">
        <Link href="/dashboard" className="btn btn-primary">
          Go to dashboard
        </Link>
        <Link href="/marketplace" className="btn btn-secondary">
          <Search size={15} />
          Browse services
        </Link>
        <Link href="/projects" className="btn btn-secondary">
          Find projects
        </Link>
      </div>
    </div>
  );
}
