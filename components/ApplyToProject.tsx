"use client";
import { FileText, Send, X } from "lucide-react";
import { FormEvent, useState } from "react";
import toast from "react-hot-toast";
import FileUploader from "./FileUploader";
export default function ApplyToProject({ projectId }: { projectId: string }) {
  const [open, setOpen] = useState(false),
    [loading, setLoading] = useState(false),
    [profileId, setProfileId] = useState(""),
    [resume, setResume] = useState("");
  async function show() {
    setOpen(true);
    if (!profileId) {
      const r = await fetch("/api/profile");
      if (r.ok) setProfileId((await r.json()).id);
    }
  }
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const f = new FormData(e.currentTarget),
      r = await fetch("/api/applications", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          project_id: projectId,
          cover_letter: f.get("cover_letter"),
          resume_url: resume || undefined,
        }),
      }),
      d = await r.json();
    setLoading(false);
    if (r.ok) {
      toast.success("Application submitted");
      setOpen(false);
    } else toast.error(d.error || "Unable to apply");
  }
  return (
    <>
      <button onClick={show} className="btn btn-primary w-full">
        <FileText size={16} />
        Apply to this project
      </button>
      {open && (
        <div className="fixed inset-0 z-[100] bg-black/75 backdrop-blur-sm grid place-items-center p-4">
          <form
            onSubmit={submit}
            className="w-full max-w-lg bg-[#111827] border border-white/10 rounded-2xl p-6 text-left"
          >
            <div className="flex">
              <div>
                <p className="text-[9px] tracking-widest text-cyan-300 font-bold">
                  EXPRESS INTEREST
                </p>
                <h2 className="text-xl font-black mt-1">Introduce yourself</h2>
              </div>
              <button
                aria-label="Close application"
                type="button"
                onClick={() => setOpen(false)}
                className="ml-auto"
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
            {profileId && (
              <div className="mt-4">
                <FileUploader
                  bucket="resumes"
                  folderKey={profileId}
                  maxMB={10}
                  onUploaded={(files) => setResume(files[0]?.url || "")}
                  label="Upload PDF resume"
                />
              </div>
            )}
            {resume && (
              <p className="text-xs text-cyan-300 mt-2">
                Resume uploaded securely.
              </p>
            )}
            <button disabled={loading} className="btn btn-primary w-full mt-6">
              <Send size={16} />
              {loading ? "Submitting…" : "Submit application"}
            </button>
          </form>
        </div>
      )}
    </>
  );
}
