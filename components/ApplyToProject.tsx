"use client";

import { FileText, Loader2, Send, X } from "lucide-react";
import { FormEvent, useState } from "react";
import toast from "react-hot-toast";
import FileUploader from "@/components/FileUploader";
import type { UploadedFile } from "@/lib/upload";

/**
 * Apply-to-project dialog.
 *
 * The resume is uploaded to the private `resumes` bucket (10 MB PDF limit) and
 * the resulting URL is submitted as `resume_url`. The upload route scopes the
 * file to the applicant's own profile folder, and the storage policy lets a
 * founder read it only when it belongs to an applicant of one of their own
 * projects.
 */

export default function ApplyToProject({ projectId }: { projectId: string }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resume, setResume] = useState<UploadedFile[]>([]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    const data = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/applications", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          project_id: projectId,
          cover_letter: data.get("cover_letter"),
          resume_url: resume[0]?.url,
        }),
      });
      const payload = await response.json();
      if (response.ok) {
        toast.success("Application submitted");
        setOpen(false);
        setResume([]);
      } else {
        toast.error(payload.error || "Unable to apply");
      }
    } catch {
      toast.error("Unable to reach the server");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className="btn btn-primary w-full">
        <FileText size={16} />
        Apply to this project
      </button>

      {open && (
        <div className="fixed inset-0 z-[100] bg-black/75 backdrop-blur-sm grid place-items-center p-4">
          <form
            onSubmit={submit}
            className="w-full max-w-lg bg-[#111827] border border-white/10 rounded-2xl p-6 text-left max-h-[90vh] overflow-auto"
          >
            <div className="flex">
              <div>
                <p className="text-[9px] tracking-widest text-cyan-300 font-bold">
                  EXPRESS INTEREST
                </p>
                <h2 className="text-xl font-black mt-1">Introduce yourself</h2>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close application form"
                className="ml-auto text-slate-400 hover:text-white"
              >
                <X />
              </button>
            </div>

            <label className="block text-sm font-bold mt-6">
              Why are you a strong fit? *
              <textarea
                required
                minLength={30}
                maxLength={3000}
                name="cover_letter"
                className="field mt-2 min-h-36"
                placeholder="Explain your relevant skills, motivation, availability and what you can contribute."
              />
            </label>

            <div className="mt-4">
              <p className="text-sm font-bold">Resume (optional)</p>
              <p className="text-xs text-slate-500 mt-1">
                PDF only, up to 10 MB. Only founders you apply to can read it.
              </p>
              <FileUploader
                className="mt-2"
                bucket="resumes"
                maxFiles={1}
                accept="application/pdf"
                label="Upload your resume"
                onChange={setResume}
              />
            </div>

            <button disabled={loading} className="btn btn-primary w-full mt-6">
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              {loading ? "Submitting…" : "Submit application"}
            </button>
          </form>
        </div>
      )}
    </>
  );
}
