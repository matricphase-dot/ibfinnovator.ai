export default function Loading() {
  return (
    <main className="p-6" aria-busy="true" aria-label="Loading dashboard">
      <div className="grid gap-3 animate-pulse">
        <div className="h-8 w-48 rounded bg-white/10" />
        <div className="grid grid-cols-3 gap-3">
          <div className="h-20 rounded-xl bg-white/5" />
          <div className="h-20 rounded-xl bg-white/5" />
          <div className="h-20 rounded-xl bg-white/5" />
        </div>
        <div className="h-40 rounded-xl bg-white/5" />
      </div>
    </main>
  );
}
