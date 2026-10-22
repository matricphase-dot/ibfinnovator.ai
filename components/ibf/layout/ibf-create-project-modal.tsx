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
      <div className="relative w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-2xl p-6 z-50 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-lg bg-cyan-50 border border-cyan-200 text-cyan-600 flex items-center justify-center">
              <FolderKanban size={16} />
            </span>
            <h2 className="text-base font-bold text-slate-900 tracking-tight">Create Project</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label className="block text-xs font-mono font-bold uppercase tracking-wider text-slate-700 mb-1.5">
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
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-mono font-bold uppercase tracking-wider text-slate-700 mb-1.5">
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
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono text-cyan-700 placeholder-slate-400 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition uppercase"
            />
          </div>

          <div>
            <label className="block text-xs font-mono font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Domain / Vertical
            </label>
            <select
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition"
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
            <label className="block text-xs font-mono font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Description (Optional)
            </label>
            <textarea
              rows={2}
              placeholder="Briefly describe what this project builds..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !title.trim()}
              className="flex items-center gap-2 px-5 py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs rounded-xl transition disabled:opacity-50 shadow-xs"
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
