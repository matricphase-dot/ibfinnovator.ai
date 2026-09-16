/**
 * Route-level loading UI. Rendered while a server segment streams in, so it
 * must stay cheap: no data fetching, no client JS beyond the CSS animation.
 */
export default function Loading() {
  return (
    <div className="max-w-6xl mx-auto p-5 md:p-8" aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading</span>
      <div className="h-3 w-40 rounded-full bg-white/[.07] animate-pulse" />
      <div className="h-9 w-72 rounded-xl bg-white/[.07] animate-pulse mt-4" />
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
        {[0, 1, 2, 3].map((key) => (
          <div
            key={key}
            className="bg-white border border-slate-200 rounded-2xl p-5"
          >
            <div className="h-10 w-10 rounded-xl bg-white/[.07] animate-pulse" />
            <div className="h-3 w-20 rounded-full bg-white/[.07] animate-pulse mt-5" />
            <div className="h-7 w-14 rounded-lg bg-white/[.07] animate-pulse mt-3" />
          </div>
        ))}
      </div>
      <div className="grid lg:grid-cols-[1fr_320px] gap-5 mt-6">
        <div className="bg-white border border-slate-200 rounded-2xl p-6 h-80" />
        <div className="bg-white border border-slate-200 rounded-2xl p-6 h-80" />
      </div>
    </div>
  );
}
