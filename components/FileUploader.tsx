"use client";
import {
  FileText,
  Image as ImageIcon,
  Loader2,
  UploadCloud,
  X,
} from "lucide-react";
import { useRef, useState } from "react";
import { useSupabaseBrowser } from "@/lib/supabase/browser";
import { allowedTypes, uploadFile, type UploadBucket } from "@/lib/upload";
export type UploadedFile = {
  url: string;
  path: string;
  name: string;
  size: number;
  type: string;
};
type Props = {
  bucket: UploadBucket;
  folderKey: string;
  multiple?: boolean;
  maxMB?: number;
  onUploaded: (files: UploadedFile[]) => void;
  label?: string;
};
export default function FileUploader({
  bucket,
  folderKey,
  multiple = false,
  maxMB = 10,
  onUploaded,
  label = "Upload files",
}: Props) {
  const supabase = useSupabaseBrowser(),
    input = useRef<HTMLInputElement>(null),
    [busy, setBusy] = useState(false),
    [progress, setProgress] = useState(0),
    [error, setError] = useState(""),
    [previews, setPreviews] = useState<{ file: File; preview?: string }[]>([]);
  async function choose(list: FileList | null) {
    if (!list) return;
    const files = [...list];
    setError("");
    for (const f of files) {
      if (f.size > maxMB * 1024 * 1024)
        return setError(`Each file must be ${maxMB}MB or smaller`);
      if (!allowedTypes(bucket).includes(f.type))
        return setError(`Unsupported file: ${f.name}`);
    }
    setPreviews(
      files.map((file) => ({
        file,
        preview: file.type.startsWith("image/")
          ? URL.createObjectURL(file)
          : undefined,
      })),
    );
    setBusy(true);
    try {
      const results: UploadedFile[] = [];
      for (let i = 0; i < files.length; i++) {
        setProgress(Math.round((i / files.length) * 100));
        const result = await uploadFile(bucket, files[i], folderKey, supabase);
        results.push({
          ...result,
          name: files[i].name,
          size: files[i].size,
          type: files[i].type,
        });
        setProgress(Math.round(((i + 1) / files.length) * 100));
      }
      onUploaded(results);
    } catch (e: any) {
      setError(e.message || "Upload failed");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div>
      <button
        type="button"
        role="button"
        aria-label={label}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            input.current?.click();
          }
        }}
        onClick={() => input.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          choose(e.dataTransfer.files);
        }}
        className="w-full p-5 rounded-xl border border-dashed border-white/15 hover:border-cyan-300/40 bg-white/[.02] text-center"
      >
        <UploadCloud className="mx-auto text-cyan-300" />
        <b className="block text-sm mt-2">{label}</b>
        <span className="text-[10px] text-slate-500">
          Drag and drop or click · max {maxMB}MB
        </span>
      </button>
      <input
        ref={input}
        hidden
        type="file"
        multiple={multiple}
        accept={allowedTypes(bucket).join(",")}
        onChange={(e) => choose(e.target.files)}
      />
      {previews.length > 0 && (
        <div className="grid gap-2 mt-3">
          {previews.map(({ file, preview }) => (
            <div
              className="flex items-center p-2 rounded-lg bg-white/[.04]"
              key={`${file.name}-${file.size}`}
            >
              {preview ? (
                <img
                  src={preview}
                  className="w-10 h-10 object-cover rounded"
                  alt=""
                />
              ) : (
                <FileText className="text-cyan-300" />
              )}
              <span className="text-xs ml-3 truncate">
                {file.name}
                <small className="block text-slate-500">
                  {(file.size / 1024).toFixed(0)} KB
                </small>
              </span>
            </div>
          ))}
        </div>
      )}
      {busy && (
        <div className="mt-3">
          <div className="flex text-xs text-slate-500">
            <Loader2 size={13} className="animate-spin mr-2" />
            Uploading…<span className="ml-auto">{progress}%</span>
          </div>
          <div className="h-1 bg-white/10 rounded mt-2">
            <div
              className="h-full bg-cyan-300 rounded transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}
      {error && <p className="text-xs text-red-300 mt-2">{error}</p>}
    </div>
  );
}
