"use client";
import { Download, ExternalLink, FileText, X } from "lucide-react";
import { useState } from "react";
export default function AttachmentPreview({
  attachments = [],
}: {
  attachments?: string[];
}) {
  const [lightbox, setLightbox] = useState<string | null>(null);
  if (!attachments.length) return null;
  return (
    <>
      <div className="flex flex-wrap gap-2 mt-3">
        {attachments.map((url, i) => {
          const clean = url.split("?")[0],
            image = /\.(png|jpe?g|webp)$/i.test(clean);
          return image ? (
            <button
              type="button"
              onClick={() => setLightbox(url)}
              key={url}
              aria-label={`Open image ${i + 1}`}
            >
              <img
                src={url}
                alt={`Attachment ${i + 1}`}
                className="w-28 h-20 rounded-lg object-cover border border-white/10"
              />
            </button>
          ) : (
            <a
              href={url}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 p-2 rounded-lg border border-white/10 text-xs"
            >
              <FileText size={16} className="text-cyan-300" />
              Attachment {i + 1}
              <ExternalLink size={12} />
              <Download size={12} />
            </a>
          );
        })}
      </div>
      {lightbox && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setLightbox(null)}
          className="fixed inset-0 z-[120] bg-black/90 grid place-items-center p-6"
        >
          <button
            aria-label="Close image"
            className="absolute top-5 right-5"
            onClick={() => setLightbox(null)}
          >
            <X />
          </button>
          <img
            src={lightbox}
            alt="Attachment preview"
            className="max-h-[88vh] max-w-[92vw] object-contain"
          />
        </div>
      )}
    </>
  );
}
