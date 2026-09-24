export default function Loading() {
  return (
    <main className="p-6 animate-pulse" aria-busy="true" aria-label="Loading projects">
      <div className="grid gap-3">
        <div className="h-8 w-48 rounded bg-white/10" />
        <div className="h-32 rounded-xl bg-white/5" />
        <div className="h-32 rounded-xl bg-white/5" />
      </div>
    </main>
  );
}
