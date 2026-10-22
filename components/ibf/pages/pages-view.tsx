"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { IBFPage } from "@/types/database.types";
import { PageRow } from "./page-row";
import { PageEditor } from "./page-editor";
import {
  FileText,
  Plus,
  Star,
  Search,
  Loader2,
  Clock,
  Sparkles,
  Filter,
  CheckCircle2,
} from "lucide-react";
import toast from "react-hot-toast";

interface PagesViewProps {
  projectId: string;
  onOpenIssue?: (issueId: string) => void;
}

export function PagesView({ projectId, onOpenIssue }: PagesViewProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [pages, setPages] = useState<IBFPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activePage, setActivePage] = useState<IBFPage | null>(null);
  const [creating, setCreating] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterMode, setFilterMode] = useState<"all" | "favorites">("all");

  // Load pages from API
  const loadPages = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/pages`);
      if (!res.ok) throw new Error("Failed to load documents");
      const data = await res.json();
      const list = Array.isArray(data) ? data : [];
      setPages(list);

      // Check URL query param for pageId
      const targetPageId = searchParams.get("pageId");
      if (targetPageId) {
        const found = list.find((p: IBFPage) => p.id === targetPageId);
        if (found) {
          setActivePage(found);
        }
      }
    } catch (err: any) {
      setError(err.message || "Failed to load documents");
    } finally {
      setLoading(false);
    }
  }, [projectId, searchParams]);

  useEffect(() => {
    if (projectId) {
      loadPages();
    }
  }, [projectId, loadPages]);

  // Navigate to editor and sync URL
  function handleSelectPage(page: IBFPage) {
    setActivePage(page);
    const params = new URLSearchParams(window.location.search);
    params.set("pageId", page.id);
    window.history.pushState(null, "", `${pathname}?${params.toString()}`);
  }

  // Back to Docs catalog
  function handleBackToCatalog() {
    setActivePage(null);
    const params = new URLSearchParams(window.location.search);
    params.delete("pageId");
    const query = params.toString();
    window.history.pushState(null, "", query ? `${pathname}?${query}` : pathname);
  }

  // Create new page
  async function handleCreatePage() {
    setCreating(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/pages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "Untitled Document",
          content_markdown: "# New Technical Specification\n\nStart typing your Product Requirement Document (PRD), architecture specs, or RFC notes here...\n\n- [ ] Define system requirements\n- [ ] Link relevant issues using #\n",
        }),
      });

      if (!res.ok) throw new Error("Failed to create document");
      const created: IBFPage = await res.json();
      setPages((prev) => [created, ...prev]);
      handleSelectPage(created);
      toast.success("New page created");
    } catch (err: any) {
      console.error(err);
      toast.error("Failed to create page");
    } finally {
      setCreating(false);
    }
  }

  // Toggle favorite
  async function handleToggleFavorite(pageId: string, currentFav: boolean) {
    const nextFav = !currentFav;
    // Optimistic local update
    setPages((prev) =>
      prev.map((p) => (p.id === pageId ? { ...p, is_favorite: nextFav } : p))
    );

    const res = await fetch(`/api/pages/${pageId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_favorite: nextFav }),
    });

    if (!res.ok) {
      // Revert if failed
      setPages((prev) =>
        prev.map((p) => (p.id === pageId ? { ...p, is_favorite: currentFav } : p))
      );
      throw new Error("Failed to toggle favorite");
    }
  }

  // Duplicate page
  async function handleDuplicate(pageId: string) {
    const res = await fetch(`/api/projects/${projectId}/pages/${pageId}/duplicate`, {
      method: "POST",
    });

    if (!res.ok) throw new Error("Failed to duplicate page");
    const duplicated: IBFPage = await res.json();
    setPages((prev) => [duplicated, ...prev]);
  }

  // Delete page
  async function handleDelete(pageId: string) {
    const res = await fetch(`/api/pages/${pageId}`, {
      method: "DELETE",
    });

    if (!res.ok) throw new Error("Failed to delete page");
    setPages((prev) => prev.filter((p) => p.id !== pageId));
    if (activePage?.id === pageId) {
      handleBackToCatalog();
    }
  }

  // Filtered pages
  const filteredPages = useMemo(() => {
    let result = pages;
    if (filterMode === "favorites") {
      result = result.filter((p) => p.is_favorite);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.title?.toLowerCase().includes(q) ||
          p.content_markdown?.toLowerCase().includes(q)
      );
    }
    return result;
  }, [pages, filterMode, searchQuery]);

  const favoritePages = useMemo(() => pages.filter((p) => p.is_favorite), [pages]);

  // If a page is actively being edited, render the Notion Editor
  if (activePage) {
    return (
      <PageEditor
        page={activePage}
        projectId={projectId}
        onBack={handleBackToCatalog}
        onPageUpdated={(updated) => {
          setActivePage(updated);
          setPages((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
        }}
        onOpenIssue={onOpenIssue}
      />
    );
  }

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto pb-12 select-none">
      {/* 1. Header Bar with Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-cyan-400/10 text-cyan-400 border border-cyan-400/20">
              <FileText size={18} />
            </div>
            <h1 className="text-lg md:text-xl font-extrabold text-white font-display tracking-tight">
              Pages & Documentation
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Collaborative technical specifications, PRDs, architecture guides, and team RFCs.
          </p>
        </div>

        <button
          type="button"
          onClick={handleCreatePage}
          disabled={creating}
          className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-300 hover:bg-cyan-200 text-slate-950 font-bold text-xs transition shadow-md hover:shadow-cyan-400/20 active:scale-95 disabled:opacity-50 shrink-0"
        >
          {creating ? (
            <>
              <Loader2 size={14} className="animate-spin text-slate-950" />
              <span>Creating...</span>
            </>
          ) : (
            <>
              <Plus size={15} />
              <span>New Page</span>
            </>
          )}
        </button>
      </div>

      {loading ? (
        <div className="py-24 flex flex-col items-center justify-center gap-3 text-xs text-slate-400">
          <Loader2 size={24} className="animate-spin text-cyan-400" />
          <p className="font-mono">Loading documentation catalog...</p>
        </div>
      ) : error ? (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center justify-between">
          <span>{error}</span>
          <button
            type="button"
            onClick={loadPages}
            className="underline hover:text-white font-mono"
          >
            Retry
          </button>
        </div>
      ) : pages.length === 0 ? (
        /* Empty State */
        <div className="py-20 px-6 text-center rounded-2xl bg-[#090e18] border border-white/[0.08] flex flex-col items-center justify-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-cyan-400/10 text-cyan-300 border border-cyan-400/20 grid place-items-center shadow-lg shadow-cyan-500/10">
            <FileText size={28} />
          </div>
          <div className="max-w-md">
            <h3 className="text-base font-bold text-white font-display">
              No technical documents yet
            </h3>
            <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
              Create Product Requirement Documents (PRDs), RFCs, and architecture specifications
              with Notion-grade Markdown, auto-save, and inline live issue tracking.
            </p>
          </div>
          <button
            type="button"
            onClick={handleCreatePage}
            disabled={creating}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-cyan-300 hover:bg-cyan-200 text-slate-950 font-bold text-xs transition shadow-md active:scale-95"
          >
            <Plus size={15} />
            <span>Create First Document</span>
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {/* 2. Pinned / Favorite Documents Carousel */}
          {favoritePages.length > 0 && (
            <div className="flex flex-col gap-3">
              <span className="text-[11px] font-bold text-amber-400 uppercase font-mono tracking-wider flex items-center gap-1.5">
                <Star size={13} fill="currentColor" />
                Pinned Documents ({favoritePages.length})
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {favoritePages.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => handleSelectPage(p)}
                    className="p-4 rounded-xl bg-[#0a0f1d] hover:bg-[#0f172a] border border-amber-400/20 hover:border-amber-400/50 transition cursor-pointer group flex flex-col justify-between gap-3 shadow-sm hover:shadow-amber-400/10"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5 truncate">
                        <FileText size={16} className="text-amber-400 shrink-0" />
                        <span className="text-xs font-bold text-slate-100 group-hover:text-amber-300 transition truncate">
                          {p.title || "Untitled Document"}
                        </span>
                      </div>
                      <Star size={13} className="text-amber-400 shrink-0" fill="currentColor" />
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono pt-2 border-t border-white/[0.04]">
                      <span className="truncate">
                        {p.author?.full_name || p.author?.name || "Team member"}
                      </span>
                      <span className="shrink-0 flex items-center gap-1">
                        <Clock size={11} />
                        {new Date(p.updated_at).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 3. Search & Filter Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-2 rounded-xl bg-[#090e18] border border-white/[0.06]">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search documents by title or markdown content..."
                className="w-full bg-transparent pl-9 pr-4 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none"
              />
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1 p-0.5 rounded-lg bg-white/5 border border-white/5 text-xs shrink-0 self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setFilterMode("all")}
                className={`px-3 py-1 rounded-md transition font-medium ${
                  filterMode === "all"
                    ? "bg-cyan-400 text-slate-950 font-bold"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                All Docs ({pages.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterMode("favorites")}
                className={`flex items-center gap-1 px-3 py-1 rounded-md transition font-medium ${
                  filterMode === "favorites"
                    ? "bg-amber-400 text-slate-950 font-bold"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <Star size={12} fill={filterMode === "favorites" ? "currentColor" : "none"} />
                Pinned ({favoritePages.length})
              </button>
            </div>
          </div>

          {/* 4. Document Table */}
          <div className="rounded-2xl border border-white/[0.08] bg-[#0a0f1d] overflow-hidden shadow-xl shadow-black/40">
            {/* Table Header */}
            <div className="px-5 py-2.5 border-b border-white/[0.06] bg-[#0c1324] flex items-center justify-between text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400">
              <div className="flex items-center gap-3">
                <span className="w-5 text-center">★</span>
                <span>Document Title</span>
              </div>
              <div className="flex items-center gap-12 pr-12 hidden md:flex">
                <span>Author</span>
                <span>Last Modified</span>
              </div>
            </div>

            {/* Table Rows */}
            {filteredPages.length === 0 ? (
              <div className="py-16 text-center text-xs text-slate-500">
                No documents match the current filter or search criteria.
              </div>
            ) : (
              <div className="divide-y divide-white/[0.04]">
                {filteredPages.map((p) => (
                  <PageRow
                    key={p.id}
                    page={p}
                    projectId={projectId}
                    onSelect={handleSelectPage}
                    onToggleFavorite={handleToggleFavorite}
                    onDuplicate={handleDuplicate}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
