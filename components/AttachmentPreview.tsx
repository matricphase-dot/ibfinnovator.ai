"use client";

import { Download, FileText, ExternalLink, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { formatBytes, type MessageAttachment } from "@/lib/messages";
import { parseStorageUrl } from "@/lib/realtime";

/**
 * Renders message/comment attachments.
 *
 * Images open in an in-page lightbox; everything else opens in a new tab.
 * Every attachment also gets its own download link. Keyboard accessible
 * throughout: thumbnails are real buttons and the lightbox closes on Escape.
 */

export interface AttachmentPreviewProps {
  files: MessageAttachment[];
  onRemove?: (index: number) => void;
  align?: "left" | "right";
  className?: string;
}

const isImage = (file: MessageAttachment) =>
  (file.type ?? "").startsWith("image/") || /\.(png|jpe?g|webp|gif)$/i.test(file.name ?? "");

const isPdf = (file: MessageAttachment) =>
  (file.type ?? "") === "application/pdf" || /\.pdf$/i.test(file.name ?? "");

export default function AttachmentPreview({
  files,
  onRemove,
  align = "left",
  className = "",
}: AttachmentPreviewProps) {
  const [lightbox, setLightbox] = useState<MessageAttachment | null>(null);
  // Signed URLs expire after an hour; re-sign on demand so old attachments keep working.
  const [refreshed, setRefreshed] = useState<Record<string, string>>({});
  const [refreshTried, setRefreshTried] = useState<string[]>([]);

  const heal = useCallback(
    async (file: MessageAttachment) => {
      if (refreshTried.includes(file.url)) return;
      setRefreshTried((prev) => [...prev, file.url]);
      const parsed = parseStorageUrl(file.url);
      if (!parsed) return;
      try {
        const response = await fetch("/api/storage/sign", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(parsed),
        });
        if (!response.ok) return;
        const data = await response.json();
        if (data?.url) setRefreshed((prev) => ({ ...prev, [file.url]: data.url }));
      } catch {
        // Offline or blocked: leave the original URL in place.
      }
    },
    [refreshTried],
  );

  const srcFor = (file: MessageAttachment) => refreshed[file.url] ?? file.url;

  useEffect(() => {
    if (!lightbox) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setLightbox(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightbox]);

  if (!files?.length) return null;
  const images = files.filter(isImage);
  const others = files.filter((file) => !isImage(file));

  return (
    <div className={`space-y-2 ${className}`}>
      {images.length > 0 && (
        <div className={`flex flex-wrap gap-2 ${align === "right" ? "justify-end" : ""}`}>
          {images.map((file, index) => (
            <div key={`${file.url}-${index}`} className="group relative">
              <button
                type="button"
                onClick={() => setLightbox(file)}
                aria-label={`Open ${file.name} in a larger view`}
                className="block overflow-hidden rounded-xl border border-white/10 hover:border-[#00f5d4]/60 transition"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={srcFor(file)}
                  alt={file.name}
                  loading="lazy"
                  onError={() => void heal(file)}
                  className="w-36 h-36 object-cover"
                />
              </button>
              <a
                href={srcFor(file)}
                download={file.name}
                target="_blank"
                rel="noreferrer noopener"
                aria-label={`Download ${file.name}`}
                className="absolute bottom-1.5 right-1.5 rounded-lg bg-black/70 p-1.5 text-white opacity-0 group-hover:opacity-100 focus:opacity-100 transition"
              >
                <Download size={13} />
              </a>
              {onRemove && (
                <button
                  type="button"
                  onClick={() => onRemove(files.indexOf(file))}
                  aria-label={`Remove ${file.name}`}
                  className="absolute top-1.5 right-1.5 rounded-lg bg-black/70 p-1.5 text-white opacity-0 group-hover:opacity-100 focus:opacity-100 transition hover:text-rose-400"
                >
                  <X size={13} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {others.map((file) => (
        <div
          key={`${file.url}-${file.name}`}
          className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[.03] px-3 py-2 max-w-sm"
        >
          <FileText size={16} className="shrink-0 text-cyan-300" />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold truncate">{file.name}</p>
            <p className="text-[11px] text-slate-500">
              {isPdf(file) ? "PDF" : (file.type || "File").replace("application/", "")}
              {file.size ? ` · ${formatBytes(file.size)}` : ""}
            </p>
          </div>
          <a
            href={srcFor(file)}
            target="_blank"
            rel="noreferrer noopener"
            aria-label={`Open ${file.name} in a new tab`}
            className="shrink-0 text-slate-400 hover:text-[#00f5d4] transition"
          >
            <ExternalLink size={15} />
          </a>
          <a
            href={srcFor(file)}
            download={file.name}
            target="_blank"
            rel="noreferrer noopener"
            aria-label={`Download ${file.name}`}
            className="shrink-0 text-slate-400 hover:text-[#00f5d4] transition"
          >
            <Download size={15} />
          </a>
          {onRemove && (
            <button
              type="button"
              onClick={() => onRemove(files.indexOf(file))}
              aria-label={`Remove ${file.name}`}
              className="shrink-0 text-slate-500 hover:text-rose-400 transition"
            >
              <X size={15} />
            </button>
          )}
        </div>
      ))}

      {lightbox && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={lightbox.name}
          onClick={() => setLightbox(null)}
          className="fixed inset-0 z-[200] bg-black/85 backdrop-blur-sm grid place-items-center p-4"
        >
          <div className="relative max-w-4xl max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={srcFor(lightbox)}
              alt={lightbox.name}
              onError={() => void heal(lightbox)}
              className="max-h-[85vh] max-w-full rounded-2xl object-contain"
            />
            <p className="text-center text-xs text-slate-400 mt-3">{lightbox.name}</p>
            <button
              type="button"
              onClick={() => setLightbox(null)}
              aria-label="Close preview"
              autoFocus
              className="absolute -top-3 -right-3 rounded-full bg-[#111827] border border-white/15 p-2 text-white hover:text-rose-400 transition"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
