export default function Loading() {
  return (
    <main className="p-6 animate-pulse" aria-busy="true" aria-label="Loading chat">
      <div className="grid gap-2">
        <div className="h-12 rounded-xl bg-white/5" />
        <div className="h-12 rounded-xl bg-white/5" />
        <div className="h-12 rounded-xl bg-white/5" />
      </div>
    </main>
  );
}
