import { ExternalLink, Link2 } from "lucide-react";
export default function LinkPreview({ text }: { text: string }) {
  const raw = text.match(/https?:\/\/[^\s<]+/i)?.[0];
  if (!raw) return null;
  try {
    const url = new URL(raw);
    return (
      <a
        href={url.href}
        target="_blank"
        rel="noreferrer nofollow"
        className="mt-3 p-3 rounded-lg border border-white/10 bg-white/[.03] flex items-center gap-3"
      >
        <span className="w-8 h-8 rounded-lg bg-cyan-300/10 text-cyan-300 grid place-items-center">
          <Link2 size={15} />
        </span>
        <span className="min-w-0">
          <b className="block text-xs truncate">{url.hostname}</b>
          <small className="block text-slate-500 truncate">{url.href}</small>
        </span>
        <ExternalLink className="ml-auto shrink-0" size={13} />
      </a>
    );
  } catch {
    return null;
  }
}
