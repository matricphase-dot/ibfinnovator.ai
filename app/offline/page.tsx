export default function Offline() {
  return (
    <main className="min-h-screen bg-[#0a0f1e] grid place-items-center p-6 text-center">
      <div>
        <p className="text-cyan-300 text-5xl">✦</p>
        <h1 className="text-3xl font-black mt-4">You’re offline</h1>
        <p className="text-slate-500 mt-3">
          Reconnect to continue using live IBF collaboration features.
        </p>
        <a href="/" className="btn btn-primary mt-6">
          Try again
        </a>
      </div>
    </main>
  );
}
