"use client";

import React, { useState } from "react";
import { IBFPage } from "@/types/database.types";
import {
  FileText,
  Star,
  Copy,
  CopyCheck,
  Files,
  Trash2,
  Clock,
  MoreVertical,
  User,
  Loader2,
} from "lucide-react";
import toast from "react-hot-toast";

interface PageRowProps {
  page: IBFPage;
  projectId: string;
  onSelect: (page: IBFPage) => void;
  onToggleFavorite: (pageId: string, currentFav: boolean) => Promise<void>;
  onDuplicate: (pageId: string) => Promise<void>;
  onDelete: (pageId: string) => Promise<void>;
}

export function PageRow({
  page,
  projectId,
  onSelect,
  onToggleFavorite,
  onDuplicate,
  onDelete,
}: PageRowProps) {
  const [copying, setCopying] = useState(false);
  const [duplicating, setDuplicating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  // Author information
  const authorName = page.author?.full_name || page.author?.name || "Author";
  const authorAvatar = page.author?.avatar_url;
  const authorInitials = authorName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  // Relative or clean timestamp
  function formatRelativeTime(dateString: string) {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diffMins < 1) return "Just now";
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays === 1) return "Yesterday";
      if (diffDays < 7) return `${diffDays}d ago`;
      return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
    } catch {
      return "Recently";
    }
  }

  async function handleCopyLink(e: React.MouseEvent) {
    e.stopPropagation();
    try {
      setCopying(true);
      const shareUrl = `${window.location.origin}/projects/${projectId}/pages?pageId=${page.id}`;
      await navigator.clipboard.writeText(shareUrl);
      toast.success("Document link copied to clipboard");
      setTimeout(() => setCopying(false), 2000);
    } catch {
      toast.error("Failed to copy link");
      setCopying(false);
    }
  }

  async function handleToggleFav(e: React.MouseEvent) {
    e.stopPropagation();
    try {
      await onToggleFavorite(page.id, page.is_favorite);
    } catch {
      toast.error("Failed to update favorite");
    }
  }

  async function handleDuplicateClick(e: React.MouseEvent) {
    e.stopPropagation();
    setMenuOpen(false);
    setDuplicating(true);
    try {
      await onDuplicate(page.id);
      toast.success("Document duplicated");
    } catch {
      toast.error("Failed to duplicate document");
    } finally {
      setDuplicating(false);
    }
  }

  async function handleDeleteClick(e: React.MouseEvent) {
    e.stopPropagation();
    setMenuOpen(false);
    if (!window.confirm(`Delete "${page.title}"? This action cannot be undone.`)) {
      return;
    }

    setDeleting(true);
    try {
      await onDelete(page.id);
      toast.success("Document deleted");
    } catch {
      toast.error("Failed to delete document");
      setDeleting(false);
    }
  }

  return (
    <div
      onClick={() => onSelect(page)}
      className="group relative px-4 py-3 md:px-5 md:py-3.5 flex items-center justify-between hover:bg-white/[0.03] transition cursor-pointer select-none border-b border-white/[0.04] last:border-b-0"
    >
      {/* Left: Star + Document Icon + Title */}
      <div className="flex items-center gap-3 min-w-0 pr-4">
        {/* Star Button */}
        <button
          type="button"
          onClick={handleToggleFav}
          className={`p-1 rounded-md transition ${
            page.is_favorite
              ? "text-amber-400 hover:text-amber-300"
              : "text-slate-600 hover:text-slate-400 group-hover:text-slate-500"
          }`}
          title={page.is_favorite ? "Unpin document" : "Pin to favorites"}
        >
          <Star
            size={14}
            fill={page.is_favorite ? "currentColor" : "none"}
            className="transition transform active:scale-90"
          />
        </button>

        {/* File Icon */}
        <div className="p-1.5 rounded-lg bg-cyan-400/10 text-cyan-400 border border-cyan-400/20 shrink-0">
          <FileText size={15} />
        </div>

        {/* Title */}
        <div className="flex flex-col min-w-0">
          <span className="text-xs md:text-sm font-semibold text-slate-100 group-hover:text-cyan-300 transition truncate">
            {page.title || "Untitled Document"}
          </span>
          <span className="text-[11px] text-slate-500 truncate md:hidden">
            Updated {formatRelativeTime(page.updated_at)} by {authorName}
          </span>
        </div>
      </div>

      {/* Center & Right: Author Avatar + Timestamp + Quick Actions */}
      <div className="flex items-center gap-4 shrink-0">
        {/* Author (visible md+) */}
        <div className="hidden md:flex items-center gap-2 max-w-[140px] truncate text-slate-400">
          {authorAvatar ? (
            <img
              src={authorAvatar}
              alt={authorName}
              className="w-5 h-5 rounded-full object-cover border border-white/10 shrink-0"
            />
          ) : (
            <div className="w-5 h-5 rounded-full bg-slate-800 text-[9px] font-mono font-bold text-slate-300 grid place-items-center border border-white/10 shrink-0">
              {authorInitials || <User size={10} />}
            </div>
          )}
          <span className="text-xs truncate text-slate-400">{authorName}</span>
        </div>

        {/* Timestamp */}
        <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-500 font-mono min-w-[70px]">
          <Clock size={12} className="text-slate-600" />
          <span>{formatRelativeTime(page.updated_at)}</span>
        </div>

        {/* Quick Actions Cluster */}
        <div className="flex items-center gap-1">
          {/* Copy Link */}
          <button
            type="button"
            onClick={handleCopyLink}
            title="Copy document link"
            className="p-1.5 rounded-md text-slate-500 hover:text-white hover:bg-white/5 transition opacity-0 group-hover:opacity-100 focus:opacity-100"
          >
            {copying ? <CopyCheck size={14} className="text-emerald-400" /> : <Copy size={14} />}
          </button>

          {/* Duplicate */}
          <button
            type="button"
            onClick={handleDuplicateClick}
            disabled={duplicating}
            title="Duplicate document"
            className="p-1.5 rounded-md text-slate-500 hover:text-white hover:bg-white/5 transition opacity-0 group-hover:opacity-100 focus:opacity-100 disabled:opacity-50"
          >
            {duplicating ? (
              <Loader2 size={14} className="animate-spin text-cyan-400" />
            ) : (
              <Files size={14} />
            )}
          </button>

          {/* Delete */}
          <button
            type="button"
            onClick={handleDeleteClick}
            disabled={deleting}
            title="Delete document"
            className="p-1.5 rounded-md text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition opacity-0 group-hover:opacity-100 focus:opacity-100 disabled:opacity-50"
          >
            {deleting ? (
              <Loader2 size={14} className="animate-spin text-rose-400" />
            ) : (
              <Trash2 size={14} />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
