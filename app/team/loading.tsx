export default function Loading() {
  return (
    <main className="p-6 animate-pulse" aria-busy="true" aria-label="Loading team">
      <div className="h-8 w-56 rounded bg-white/10" />
      <div className="h-64 rounded-xl bg-white/5 mt-4" />
    </main>
  );
}
