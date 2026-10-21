"use client";

import React, { useState, useEffect, useRef } from "react";
import { IBFPage } from "@/types/database.types";
import {
  ArrowLeft,
  Star,
  Cloud,
  Check,
  Loader2,
  Heading1,
  Heading2,
  Bold,
  Italic,
  Code,
  List,
  Quote,
  Eye,
  Edit3,
} from "lucide-react";

interface PageEditorProps {
  page: IBFPage;
  projectId: string;
  onBack: () => void;
  onPageUpdated?: (updated: IBFPage) => void;
}

export function PageEditor({
  page,
  projectId,
  onBack,
  onPageUpdated,
}: PageEditorProps) {
  const [title, setTitle] = useState(page.title || "Untitled Document");
  const [content, setContent] = useState(page.content_markdown || "");
  const [isFavorite, setIsFavorite] = useState(page.is_favorite || false);
  const [isSaving, setIsSaving] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date>(new Date(page.updated_at));

  const saveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-save logic: debounced 1,500ms
  function triggerAutoSave(newTitle: string, newContent: string, newFav: boolean) {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);

    saveTimerRef.current = setTimeout(async () => {
      setIsSaving(true);
      try {
        const res = await fetch(`/api/projects/${projectId}/pages/${page.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: newTitle,
            content_markdown: newContent,
            is_favorite: newFav,
          }),
        });

        if (!res.ok) throw new Error("Failed to save document");
        const updated = await res.json();
        setLastSaved(new Date());
        if (onPageUpdated) onPageUpdated(updated);
      } catch (err) {
        console.error("Auto-save failed", err);
      } finally {
        setIsSaving(false);
      }
    }, 1500);
  }

  function handleTitleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    setTitle(val);
    triggerAutoSave(val, content, isFavorite);
  }

  function handleContentChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const val = e.target.value;
    setContent(val);
    triggerAutoSave(title, val, isFavorite);
  }

  function toggleFavorite() {
    const newFav = !isFavorite;
    setIsFavorite(newFav);
    triggerAutoSave(title, content, newFav);
  }

  function insertFormatting(prefix: string, suffix: string = "") {
    const textarea = document.getElementById("doc-editor-textarea") as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = content.substring(start, end);
    const replacement = `${prefix}${selected || "text"}${suffix}`;
    const nextContent = content.substring(0, start) + replacement + content.substring(end);

    setContent(nextContent);
    triggerAutoSave(title, nextContent, isFavorite);
  }

  return (
    <div className="flex flex-col h-full bg-[#080c14] text-slate-100 rounded-2xl border border-white/[0.08] overflow-hidden">
      {/* Top action toolbar */}
      <div className="px-6 py-3.5 border-b border-white/[0.06] flex items-center justify-between bg-[#0b101c]/80 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition flex items-center gap-1.5 text-xs font-semibold"
          >
            <ArrowLeft size={14} />
            Back to Docs
          </button>

          <div className="h-4 w-[1px] bg-white/10" />

          <button
            onClick={toggleFavorite}
            className={`p-1.5 rounded-lg transition ${
              isFavorite
                ? "text-amber-400 bg-amber-400/10"
                : "text-slate-400 hover:text-white hover:bg-white/5"
            }`}
            title={isFavorite ? "Unfavorite document" : "Star as favorite"}
          >
            <Star size={15} fill={isFavorite ? "currentColor" : "none"} />
          </button>
        </div>

        {/* Save Status & View Switcher */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-[11px] font-mono text-slate-400">
            {isSaving ? (
              <>
                <Loader2 size={13} className="animate-spin text-cyan-400" />
                <span className="text-cyan-300">Saving...</span>
              </>
            ) : (
              <>
                <Cloud size={13} className="text-emerald-400" />
                <span>Saved {lastSaved.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
              </>
            )}
          </div>

          <div className="flex items-center gap-1 p-0.5 rounded-lg bg-white/5 border border-white/5 text-xs">
            <button
              onClick={() => setPreviewMode(false)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition ${
                !previewMode
                  ? "bg-cyan-400 text-slate-950 font-bold"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Edit3 size={13} /> Edit
            </button>
            <button
              onClick={() => setPreviewMode(true)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition ${
                previewMode
                  ? "bg-cyan-400 text-slate-950 font-bold"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Eye size={13} /> Preview
            </button>
          </div>
        </div>
      </div>

      {/* Editor Formatting Ribbon (visible in Edit mode) */}
      {!previewMode && (
        <div className="px-6 py-2 border-b border-white/[0.04] bg-[#090e18] flex items-center gap-1 text-slate-400 text-xs overflow-x-auto">
          <button
            onClick={() => insertFormatting("# ")}
            className="p-1.5 rounded hover:bg-white/5 hover:text-white transition"
            title="Heading 1"
          >
            <Heading1 size={14} />
          </button>
          <button
            onClick={() => insertFormatting("## ")}
            className="p-1.5 rounded hover:bg-white/5 hover:text-white transition"
            title="Heading 2"
          >
            <Heading2 size={14} />
          </button>
          <div className="h-3 w-[1px] bg-white/10 mx-1" />
          <button
            onClick={() => insertFormatting("**", "**")}
            className="p-1.5 rounded hover:bg-white/5 hover:text-white transition"
            title="Bold"
          >
            <Bold size={14} />
          </button>
          <button
            onClick={() => insertFormatting("*", "*")}
            className="p-1.5 rounded hover:bg-white/5 hover:text-white transition"
            title="Italic"
          >
            <Italic size={14} />
          </button>
          <button
            onClick={() => insertFormatting("```\n", "\n```")}
            className="p-1.5 rounded hover:bg-white/5 hover:text-white transition"
            title="Code Block"
          >
            <Code size={14} />
          </button>
          <button
            onClick={() => insertFormatting("- [ ] ")}
            className="p-1.5 rounded hover:bg-white/5 hover:text-white transition"
            title="Task List"
          >
            <List size={14} />
          </button>
          <button
            onClick={() => insertFormatting("> ")}
            className="p-1.5 rounded hover:bg-white/5 hover:text-white transition"
            title="Blockquote"
          >
            <Quote size={14} />
          </button>
        </div>
      )}

      {/* Document Workspace Body */}
      <div className="flex-1 overflow-y-auto p-8 max-w-4xl w-full mx-auto flex flex-col gap-6">
        {/* Document Title Input */}
        <input
          type="text"
          value={title}
          onChange={handleTitleChange}
          placeholder="Untitled Document"
          className="text-2xl md:text-3xl font-extrabold text-white bg-transparent border-none focus:outline-none placeholder-slate-600"
        />

        {previewMode ? (
          <div className="prose prose-invert max-w-none text-slate-200 text-sm leading-relaxed whitespace-pre-wrap font-sans">
            {content || <span className="text-slate-500 italic">No content yet. Click Edit to begin writing.</span>}
          </div>
        ) : (
          <textarea
            id="doc-editor-textarea"
            value={content}
            onChange={handleContentChange}
            placeholder="Type your notes, architecture specs, or Markdown here..."
            rows={20}
            className="w-full flex-1 bg-transparent border-none text-slate-200 text-sm leading-relaxed focus:outline-none resize-none placeholder-slate-600 font-mono"
          />
        )}
      </div>
    </div>
  );
}
