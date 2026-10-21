"use client";

import React, { useState } from "react";
import { X, Loader2, Building2, ArrowRight } from "lucide-react";
import toast from "react-hot-toast";

export interface IbfCreateWorkspaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onWorkspaceCreated?: (workspace: any) => void;
}

export function IbfCreateWorkspaceModal({
  isOpen,
  onClose,
  onWorkspaceCreated,
}: IbfCreateWorkspaceModalProps) {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    setSubmitting(true);
    try {
      const generatedSlug = (slug.trim() || name.trim())
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");

      const res = await fetch("/api/workspaces", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          slug: generatedSlug,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to create workspace");
      }

      const { workspace } = await res.json();
      toast.success(`Workspace "${workspace.name}" created!`);
      onWorkspaceCreated?.(workspace);
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Failed to create workspace");
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
              <Building2 size={16} />
            </span>
            <h2 className="text-base font-bold text-white tracking-tight">Create Workspace</h2>
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
              Workspace Name
            </label>
            <input
              type="text"
              required
              autoFocus
              placeholder="e.g. Acme Ventures"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (!slug) {
                  setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-"));
                }
              }}
              className="w-full px-3.5 py-2.5 bg-[#080d18] border border-white/[0.1] rounded-xl text-sm text-white placeholder-slate-600 focus:outline-none focus:border-cyan-300 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-mono font-bold uppercase tracking-wider text-slate-300 mb-1.5">
              Workspace URL Slug
            </label>
            <div className="flex items-center bg-[#080d18] border border-white/[0.1] rounded-xl px-3.5 py-2 focus-within:border-cyan-300 transition">
              <span className="text-xs font-mono text-slate-500 mr-1 select-none">
                app.ibf/
              </span>
              <input
                type="text"
                placeholder="acme-ventures"
                value={slug}
                onChange={(e) =>
                  setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))
                }
                className="w-full bg-transparent text-sm font-mono text-cyan-300 placeholder-slate-600 focus:outline-none"
              />
            </div>
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
              disabled={submitting || !name.trim()}
              className="flex items-center gap-2 px-5 py-2.5 bg-cyan-300 hover:bg-cyan-200 text-slate-950 font-bold text-xs rounded-xl transition disabled:opacity-50 shadow-md"
            >
              {submitting ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Creating Workspace…
                </>
              ) : (
                <>
                  Create Workspace <ArrowRight size={14} />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
