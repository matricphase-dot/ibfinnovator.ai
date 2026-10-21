"use client";

import React, { useState, useEffect } from "react";
import { IBFPage } from "@/types/database.types";
import { PageEditor } from "./page-editor";
import {
  FileText,
  Plus,
  Star,
  Clock,
  Trash2,
  Loader2,
  ExternalLink,
} from "lucide-react";

interface PagesViewProps {
  projectId: string;
}

export function PagesView({ projectId }: PagesViewProps) {
  const [pages, setPages] = useState<IBFPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activePage, setActivePage] = useState<IBFPage | null>(null);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    async function loadPages() {
      setLoading(true);
      try {
        const res = await fetch(`/api/projects/${projectId}/pages`);
        if (!res.ok) throw new Error("Failed to load documents");
        const data = await res.json();
        setPages(data || []);
      } catch (err: any) {
        setError(err.message || "Failed to load documents");
      } finally {
        setLoading(false);
      }
    }

    if (projectId) loadPages();
  }, [projectId]);

  async function handleCreatePage() {
    setCreating(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/pages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "Untitled Document",
          content_markdown: "# New Document\n\nStart typing your technical specification or notes here...",
        }),
      });

      if (!res.ok) throw new Error("Failed to create document");
      const created = await res.json();
      setPages((prev) => [created, ...prev]);
      setActivePage(created);
    } catch (err: any) {
      console.error(err);
    } finally {
      setCreating(false);
    }
  }

  async function handleDeletePage(e: React.MouseEvent, pageId: string) {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this document?")) return;

    try {
      const res = await fetch(`/api/projects/${projectId}/pages/${pageId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete document");
      setPages((prev) => prev.filter((p) => p.id !== pageId));
      if (activePage?.id === pageId) setActivePage(null);
    } catch (err) {
      console.error(err);
    }
  }

  if (activePage) {
    return (
      <PageEditor
        page={activePage}
        projectId={projectId}
        onBack={() => setActivePage(null)}
        onPageUpdated={(updated) => {
          setActivePage(updated);
          setPages((prev) =>
            prev.map((p) => (p.id === updated.id ? updated : p))
          );
        }}
      />
    );
  }

  const favoritePages = pages.filter((p) => p.is_favorite);

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <FileText size={18} className="text-cyan-400" />
            Pages & Technical Docs
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Collaborative PRDs, system architecture specs, and team meeting notes.
          </p>
        </div>
        <button
          onClick={handleCreatePage}
          disabled={creating}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-cyan-300 hover:bg-cyan-200 text-slate-950 font-bold text-xs transition shadow-sm disabled:opacity-50"
        >
          {creating ? <Loader2 size={14} className="animate-spin" /> : <Plus size={15} />}
          New Page
        </button>
      </div>

      {loading ? (
        <div className="py-20 flex items-center justify-center gap-2 text-xs text-slate-400">
          <Loader2 size={16} className="animate-spin text-cyan-400" />
          Loading documents...
        </div>
      ) : error ? (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
          {error}
        </div>
      ) : pages.length === 0 ? (
        <div className="py-16 px-6 text-center rounded-2xl bg-[#090e18] border border-white/[0.08] flex flex-col items-center justify-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-cyan-400/10 text-cyan-300 grid place-items-center">
            <FileText size={24} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">No documents created yet</h3>
            <p className="text-xs text-slate-400 max-w-sm mt-1">
              Write Product Requirement Documents (PRDs), API specs, or RFCs right alongside your issues.
            </p>
          </div>
          <button
            onClick={handleCreatePage}
            disabled={creating}
            className="flex items-center gap-1.5 px-4 py-2 mt-2 rounded-xl bg-cyan-300 hover:bg-cyan-200 text-slate-950 font-bold text-xs transition"
          >
            <Plus size={14} />
            Create First Document
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {/* Pinned Documents Section */}
          {favoritePages.length > 0 && (
            <div className="flex flex-col gap-3">
              <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                <Star size={13} fill="currentColor" />
                Pinned Documents
              </span>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {favoritePages.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => setActivePage(p)}
                    className="p-4 rounded-xl bg-[#0a0f1d] hover:bg-[#0f172a] border border-amber-400/20 hover:border-amber-400/40 transition flex items-center justify-between cursor-pointer group"
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <FileText size={16} className="text-amber-400 shrink-0" />
                      <span className="text-xs font-semibold text-white group-hover:text-amber-300 transition truncate">
                        {p.title}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono shrink-0">
                      {new Date(p.updated_at).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* All Documents Table */}
          <div className="flex flex-col gap-3">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              All Documents ({pages.length})
            </span>
            <div className="rounded-2xl border border-white/[0.08] bg-[#0a0f1d] overflow-hidden">
              <div className="divide-y divide-white/[0.06]">
                {pages.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => setActivePage(p)}
                    className="px-5 py-3.5 flex items-center justify-between hover:bg-white/[0.02] transition cursor-pointer group"
                  >
                    <div className="flex items-center gap-3 truncate">
                      <FileText size={16} className="text-cyan-400 shrink-0" />
                      <div className="flex flex-col truncate">
                        <span className="text-xs font-semibold text-white group-hover:text-cyan-300 transition truncate">
                          {p.title}
                        </span>
                        <span className="text-[10px] text-slate-500 truncate">
                          Created by {p.author?.full_name || p.author?.name || "Team member"}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      {p.is_favorite && (
                        <Star size={13} className="text-amber-400" fill="currentColor" />
                      )}
                      <span className="text-[11px] text-slate-500 font-mono flex items-center gap-1">
                        <Clock size={12} />
                        {new Date(p.updated_at).toLocaleDateString()}
                      </span>
                      <button
                        onClick={(e) => handleDeletePage(e, p.id)}
                        className="opacity-0 group-hover:opacity-100 p-1 rounded-md text-slate-400 hover:text-rose-400 transition"
                        title="Delete Document"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
