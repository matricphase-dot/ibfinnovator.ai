"use client";

import React, { useState } from "react";
import { X, Loader2, FolderKanban, ArrowRight } from "lucide-react";
import toast from "react-hot-toast";

export interface IbfCreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  workspaceId?: string;
  onProjectCreated?: (project: any) => void;
}

export function IbfCreateProjectModal({
  isOpen,
  onClose,
  workspaceId,
  onProjectCreated,
}: IbfCreateProjectModalProps) {
  const [title, setTitle] = useState("");
  const [identifier, setIdentifier] = useState("");
  const [description, setDescription] = useState("");
  const [domain, setDomain] = useState("Technology");
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;

    setSubmitting(true);
    try {
      const ident = (identifier.trim() || title.slice(0, 3)).toUpperCase().replace(/[^A-Z0-9]/g, "") || "INN";

      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          name: title.trim(),
          identifier: ident,
          description: description.trim() || `Core engineering workspace for ${title.trim()}.`,
          domain,
          stage: "BUILDING",
          required_skills: ["Engineering", "Architecture"],
          workspace_id: workspaceId || null,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to create project");
      }

      const created = await res.json();
      toast.success(`Project ${created.title || created.name} created!`);
      onProjectCreated?.(created);
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Failed to create project");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-md bg-[#0d1424] border border-white/[0.1] rounded-2xl shadow-2xl p-6 z-50 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-lg bg-cyan-400/10 border border-cyan-400/20 text-cyan-300 flex items-center justify-center">
              <FolderKanban size={16} />
            </span>
            <h2 className="text-base font-bold text-white tracking-tight">Create Project</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label className="block text-xs font-mono font-bold uppercase tracking-wider text-slate-300 mb-1.5">
              Project Title
            </label>
            <input
              type="text"
              required
              autoFocus
              placeholder="e.g. Innovator Engine"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (!identifier) {
                  setIdentifier(e.target.value.slice(0, 3).toUpperCase());
                }
              }}
              className="w-full px-3.5 py-2.5 bg-[#080d18] border border-white/[0.1] rounded-xl text-sm text-white placeholder-slate-600 focus:outline-none focus:border-cyan-300 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-mono font-bold uppercase tracking-wider text-slate-300 mb-1.5">
              Identifier Prefix (1-5 chars)
            </label>
            <input
              type="text"
              required
              maxLength={5}
              placeholder="e.g. INN"
              value={identifier}
              onChange={(e) =>
                setIdentifier(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))
              }
              className="w-full px-3.5 py-2.5 bg-[#080d18] border border-white/[0.1] rounded-xl text-sm font-mono text-cyan-300 placeholder-slate-600 focus:outline-none focus:border-cyan-300 transition uppercase"
            />
          </div>

          <div>
            <label className="block text-xs font-mono font-bold uppercase tracking-wider text-slate-300 mb-1.5">
              Domain / Vertical
            </label>
            <select
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-[#080d18] border border-white/[0.1] rounded-xl text-sm text-white focus:outline-none focus:border-cyan-300 transition"
            >
              <option value="Technology">Technology & Software</option>
              <option value="AI & Machine Learning">AI & Machine Learning</option>
              <option value="BioTech & Health">BioTech & Health</option>
              <option value="CleanTech & Energy">CleanTech & Energy</option>
              <option value="FinTech">FinTech</option>
              <option value="Robotics & Hardware">Robotics & Hardware</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-mono font-bold uppercase tracking-wider text-slate-300 mb-1.5">
              Description (Optional)
            </label>
            <textarea
              rows={2}
              placeholder="Briefly describe what this project builds..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-[#080d18] border border-white/[0.1] rounded-xl text-sm text-white placeholder-slate-600 focus:outline-none focus:border-cyan-300 transition resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/[0.08]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !title.trim()}
              className="flex items-center gap-2 px-5 py-2.5 bg-cyan-300 hover:bg-cyan-200 text-slate-950 font-bold text-xs rounded-xl transition disabled:opacity-50 shadow-md"
            >
              {submitting ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Creating Project…
                </>
              ) : (
                <>
                  Create Project <ArrowRight size={14} />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
