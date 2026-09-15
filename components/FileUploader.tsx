"use client";

import { AlertCircle, Check, FileText, ImageIcon, Loader2, Upload, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  BUCKET_RULES,
  isUploadError,
  uploadFile,
  validateFile,
  type UploadBucket,
  type UploadedFile,
} from "@/lib/upload";
import { formatBytes } from "@/lib/messages";

/**
 * Drag-and-drop / click file picker with per-file progress.
 *
 * Files upload immediately on selection; `onChange` receives the files that are
 * already stored (each with `url`, `name`, `size`, `type`, `path`). Invalid
 * files are rejected before any network call and reported inline.
 */

interface UploaderItem {
  id: string;
  name: string;
  size: number;
  type: string;
  progress: number;
  status: "uploading" | "done" | "error";
  error?: string;
  previewUrl?: string;
  result?: UploadedFile;
}

export interface FileUploaderProps {
  bucket: UploadBucket;
  folderKey?: string;
  maxFiles?: number;
  accept?: string;
  label?: string;
  hint?: string;
  onChange?: (files: UploadedFile[]) => void;
  className?: string;
}

export default function FileUploader({
  bucket,
  folderKey,
  maxFiles,
  accept,
  label,
  hint,
  onChange,
  className = "",
}: FileUploaderProps) {
  const rule = BUCKET_RULES[bucket];
  const limit = maxFiles ?? rule?.maxFiles ?? 1;
  const [items, setItems] = useState<UploaderItem[]>([]);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const objectUrls = useRef<string[]>([]);

  // Release object URLs on unmount so thumbnails do not leak memory.
  useEffect(
    () => () => {
      objectUrls.current.forEach((url) => URL.revokeObjectURL(url));
      objectUrls.current = [];
    },
    [],
  );

  const emit = useCallback(
    (next: UploaderItem[]) => {
      onChange?.(
        next.filter((item) => item.status === "done" && item.result).map((item) => item.result!),
      );
    },
    [onChange],
  );

  const handleFiles = useCallback(
    async (fileList: FileList | null) => {
      if (!fileList?.length) return;
      const chosen = Array.from(fileList).slice(0, Math.max(0, limit));

      const prepared: UploaderItem[] = chosen.map((file) => {
        const isImage = file.type.startsWith("image/");
        let previewUrl: string | undefined;
        if (isImage) {
          previewUrl = URL.createObjectURL(file);
          objectUrls.current.push(previewUrl);
        }
        return {
          id: `${file.name}-${file.size}-${Math.random().toString(36).slice(2, 8)}`,
          name: file.name,
          size: file.size,
          type: file.type,
          progress: 0,
          status: "uploading" as const,
          previewUrl,
        };
      });

      // Pre-flight validation: never spend a request on a file we know is wrong.
      prepared.forEach((item, index) => {
        try {
          validateFile(chosen[index], bucket);
        } catch (error) {
          item.status = "error";
          item.error = isUploadError(error) ? error.message : "That file cannot be uploaded.";
        }
      });

      setItems((prev) => [...prev, ...prepared]);
      if (inputRef.current) inputRef.current.value = "";

      await Promise.all(
        prepared.map(async (item, index) => {
          if (item.status === "error") return;
          try {
            const result = await uploadFile(bucket, chosen[index], folderKey, {
              onProgress: (percent) =>
                setItems((prev) =>
                  prev.map((row) => (row.id === item.id ? { ...row, progress: percent } : row)),
                ),
            });
            setItems((prev) => {
              const next = prev.map((row) =>
                row.id === item.id
                  ? { ...row, status: "done" as const, progress: 100, result }
                  : row,
              );
              emit(next);
              return next;
            });
          } catch (error) {
            const message = isUploadError(error) ? error.message : "Upload failed.";
            setItems((prev) => {
              const next = prev.map((row) =>
                row.id === item.id
                  ? { ...row, status: "error" as const, error: message }
                  : row,
              );
              emit(next);
              return next;
            });
          }
        }),
      );
    },
    [bucket, folderKey, limit, emit],
  );

  const remove = (id: string) => {
    setItems((prev) => {
      const next = prev.filter((row) => row.id !== id);
      emit(next);
      return next;
    });
  };

  const openPicker = () => inputRef.current?.click();

  return (
    <div className={className}>
      <div
        role="button"
        tabIndex={0}
        aria-label={label ? `${label} — choose files` : "Choose files to upload"}
        aria-disabled={items.length >= limit}
        onClick={() => items.length < limit && openPicker()}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            if (items.length < limit) openPicker();
          }
        }}
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          if (items.length < limit) void handleFiles(event.dataTransfer.files);
        }}
        className={`rounded-2xl border-2 border-dashed p-5 text-center cursor-pointer transition ${
          dragging
            ? "border-[#00f5d4] bg-[#00f5d4]/5"
            : "border-white/15 hover:border-[#00f5d4]/60 hover:bg-white/[.02]"
        }`}
      >
        <Upload className="mx-auto text-cyan-300" size={22} />
        <p className="text-sm font-bold mt-2">
          {label || "Drag files here or click to browse"}
        </p>
        <p className="text-xs text-slate-500 mt-1">
          {hint || rule?.label} · up to {limit} file{limit === 1 ? "" : "s"}
        </p>
        <input
          ref={inputRef}
          type="file"
          multiple={limit > 1}
          accept={accept || rule?.mime.join(",")}
          className="hidden"
          onChange={(event) => void handleFiles(event.target.files)}
          aria-hidden="true"
          tabIndex={-1}
        />
      </div>

      {items.length > 0 && (
        <ul className="mt-3 space-y-2">
          {items.map((item) => (
            <li
              key={item.id}
              className="flex items-center gap-3 rounded-xl border border-white/10 bg-[#0d1526] p-2.5"
            >
              {item.previewUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={item.previewUrl}
                  alt={item.name}
                  className="w-10 h-10 rounded-lg object-cover"
                />
              ) : (
                <span className="w-10 h-10 rounded-lg bg-white/5 grid place-items-center text-slate-400">
                  {item.type.startsWith("image/") ? <ImageIcon size={17} /> : <FileText size={17} />}
                </span>
              )}

              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold truncate">{item.name}</p>
                <p className="text-[11px] text-slate-500">
                  {formatBytes(item.size)}
                  {item.status === "uploading" && ` · ${item.progress}%`}
                  {item.status === "error" && item.error ? ` · ${item.error}` : ""}
                </p>
                {item.status === "uploading" && (
                  <div
                    className="h-1 mt-1.5 rounded-full bg-white/10 overflow-hidden"
                    role="progressbar"
                    aria-label={`Uploading ${item.name}`}
                    aria-valuenow={item.progress}
                    aria-valuemin={0}
                    aria-valuemax={100}
                  >
                    <div
                      className="h-full bg-[#00f5d4] transition-all"
                      style={{ width: `${item.progress}%` }}
                    />
                  </div>
                )}
              </div>

              <span className="shrink-0 grid place-items-center w-6 h-6">
                {item.status === "uploading" && (
                  <Loader2 size={15} className="animate-spin text-cyan-300" />
                )}
                {item.status === "done" && <Check size={15} className="text-emerald-400" />}
                {item.status === "error" && <AlertCircle size={15} className="text-rose-400" />}
              </span>

              <button
                type="button"
                onClick={() => remove(item.id)}
                aria-label={`Remove ${item.name}`}
                className="shrink-0 text-slate-500 hover:text-rose-400 transition"
              >
                <X size={15} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
