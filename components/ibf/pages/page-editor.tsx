"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { IBFPage } from "@/types/database.types";
import { PageToolbar } from "./page-toolbar";
import { PageIssueEmbed, IssueAutocompleteDropdown, EmbeddedIssueData } from "./page-issue-embed";
import {
  ArrowLeft,
  Star,
  Cloud,
  Loader2,
  Maximize2,
  Minimize2,
  Share2,
  Edit3,
  Columns,
  Eye,
  Copy,
  Check,
  CheckSquare,
  Square,
  AlertCircle,
} from "lucide-react";
import toast from "react-hot-toast";

interface PageEditorProps {
  page: IBFPage;
  projectId: string;
  onBack: () => void;
  onPageUpdated?: (updated: IBFPage) => void;
  onOpenIssue?: (issueId: string) => void;
}

type ViewMode = "edit" | "split" | "preview";

export function PageEditor({
  page,
  projectId,
  onBack,
  onPageUpdated,
  onOpenIssue,
}: PageEditorProps) {
  const [title, setTitle] = useState(page.title || "Untitled Document");
  const [content, setContent] = useState(page.content_markdown || "");
  const [isFavorite, setIsFavorite] = useState(page.is_favorite || false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date>(new Date(page.updated_at || Date.now()));
  const [viewMode, setViewMode] = useState<ViewMode>("split");
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Issue Autocomplete state
  const [autocompleteOpen, setAutocompleteOpen] = useState(false);
  const [autocompleteQuery, setAutocompleteQuery] = useState("");
  const [cursorPosition, setCursorPosition] = useState<number | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-Save implementation: debounced 1,500ms
  const triggerAutoSave = useCallback(
    (newTitle: string, newContent: string, newFav: boolean) => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

      setIsSaving(true);
      saveTimeoutRef.current = setTimeout(async () => {
        try {
          const res = await fetch(`/api/pages/${page.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              title: newTitle,
              content_markdown: newContent,
              is_favorite: newFav,
            }),
          });

          if (!res.ok) throw new Error("Auto-save failed");
          const updated = await res.json();
          setLastSaved(new Date());
          onPageUpdated?.(updated);
        } catch (err) {
          console.error("Auto-save error:", err);
          toast.error("Auto-save failed, check network", { id: "autosave-error" });
        } finally {
          setIsSaving(false);
        }
      }, 1500);
    },
    [page.id, onPageUpdated]
  );

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, []);

  function handleTitleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    setTitle(val);
    triggerAutoSave(val, content, isFavorite);
  }

  function handleContentChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const val = e.target.value;
    const pos = e.target.selectionStart;
    setContent(val);
    triggerAutoSave(title, val, isFavorite);

    // Detect if user typed '#'
    const textBeforeCursor = val.slice(0, pos);
    const match = textBeforeCursor.match(/#([a-zA-Z0-9_-]*)$/);
    if (match) {
      setAutocompleteQuery(match[0]);
      setCursorPosition(pos);
      setAutocompleteOpen(true);
    } else {
      setAutocompleteOpen(false);
    }
  }

  function handleToggleFavorite() {
    const nextFav = !isFavorite;
    setIsFavorite(nextFav);
    triggerAutoSave(title, content, nextFav);
    toast.success(nextFav ? "Added to pinned docs" : "Removed from pinned docs");
  }

  function handleCopyShareLink() {
    const url = `${window.location.origin}/projects/${projectId}/pages?pageId=${page.id}`;
    navigator.clipboard.writeText(url).then(() => {
      toast.success("Document link copied to clipboard");
    });
  }

  // Insert formatting from Toolbar
  function handleInsertFormatting(prefix: string, suffix: string = "", defaultText: string = "") {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = content.substring(start, end);
    const textToInsert = selected || defaultText;
    const replacement = `${prefix}${textToInsert}${suffix}`;
    const nextContent = content.substring(0, start) + replacement + content.substring(end);

    setContent(nextContent);
    triggerAutoSave(title, nextContent, isFavorite);

    setTimeout(() => {
      textarea.focus();
      const newCursor = start + prefix.length + textToInsert.length;
      textarea.setSelectionRange(newCursor, newCursor);
    }, 10);
  }

  // Insert Issue from Autocomplete or Toolbar button
  function handleSelectIssue(issue: EmbeddedIssueData) {
    const ident = issue.project?.identifier
      ? `${issue.project.identifier}-${issue.sequence_id}`
      : `#${issue.sequence_id}`;
    const issueTag = `#${ident} `;

    const textarea = textareaRef.current;
    if (textarea && cursorPosition !== null) {
      const textBefore = content.slice(0, cursorPosition);
      const hashIndex = textBefore.lastIndexOf("#");
      if (hashIndex !== -1) {
        const nextContent =
          content.slice(0, hashIndex) + issueTag + content.slice(cursorPosition);
        setContent(nextContent);
        triggerAutoSave(title, nextContent, isFavorite);
      }
    } else {
      handleInsertFormatting(issueTag);
    }

    setAutocompleteOpen(false);
  }

  // Interactive task list toggle in preview
  function handleToggleTask(lineIndex: number) {
    const lines = content.split("\n");
    if (lines[lineIndex] !== undefined) {
      if (lines[lineIndex].includes("- [ ]")) {
        lines[lineIndex] = lines[lineIndex].replace("- [ ]", "- [x]");
      } else if (lines[lineIndex].includes("- [x]")) {
        lines[lineIndex] = lines[lineIndex].replace("- [x]", "- [ ]");
      }
      const nextContent = lines.join("\n");
      setContent(nextContent);
      triggerAutoSave(title, nextContent, isFavorite);
    }
  }

  // Keyboard shortcut listener inside editor
  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "b") {
      e.preventDefault();
      handleInsertFormatting("**", "**", "bold text");
    } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "i") {
      e.preventDefault();
      handleInsertFormatting("*", "*", "italic text");
    } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "e") {
      e.preventDefault();
      handleInsertFormatting("`", "`", "code");
    }
  }

  return (
    <div
      className={`flex flex-col bg-[#080c14] text-slate-100 transition-all ${
        isFullscreen
          ? "fixed inset-0 z-50 rounded-none h-screen w-screen"
          : "h-full min-h-[680px] rounded-2xl border border-white/[0.08] overflow-hidden"
      }`}
    >
      {/* 1. Header Toolbar */}
      <div className="px-5 py-3 border-b border-white/[0.06] flex items-center justify-between bg-[#0b101c]/90 backdrop-blur-md select-none shrink-0">
        {/* Left: Back to Docs + Title breadcrumb + Star */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06] transition text-xs font-semibold shrink-0"
          >
            <ArrowLeft size={14} />
            <span className="hidden sm:inline">Back to Docs</span>
          </button>

          <div className="h-4 w-[1px] bg-white/10 shrink-0" />

          <button
            type="button"
            onClick={handleToggleFavorite}
            className={`p-1.5 rounded-lg transition shrink-0 ${
              isFavorite
                ? "text-amber-400 bg-amber-400/10 border border-amber-400/20"
                : "text-slate-400 hover:text-white hover:bg-white/5"
            }`}
            title={isFavorite ? "Unpin document" : "Pin document"}
          >
            <Star size={14} fill={isFavorite ? "currentColor" : "none"} />
          </button>

          <span className="text-xs text-slate-400 font-medium truncate max-w-[200px] md:max-w-xs">
            {title || "Untitled Document"}
          </span>
        </div>

        {/* Right: Cloud Status + View Switcher + Fullscreen + Share */}
        <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
          {/* Cloud Auto-save Status */}
          <div className="flex items-center gap-1.5 text-[11px] font-mono text-slate-400">
            {isSaving ? (
              <>
                <Loader2 size={13} className="animate-spin text-cyan-400" />
                <span className="text-cyan-300 hidden sm:inline">Saving...</span>
              </>
            ) : (
              <>
                <Cloud size={13} className="text-emerald-400" />
                <span className="text-slate-400 hidden sm:inline">
                  Saved {lastSaved.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
              </>
            )}
          </div>

          <div className="h-4 w-[1px] bg-white/10 hidden sm:block" />

          {/* View Mode Switcher (Edit / Split / Preview) */}
          <div className="flex items-center p-0.5 rounded-lg bg-white/5 border border-white/5 text-xs">
            <button
              type="button"
              onClick={() => setViewMode("edit")}
              className={`p-1.5 rounded-md transition ${
                viewMode === "edit"
                  ? "bg-cyan-400 text-slate-950 font-bold"
                  : "text-slate-400 hover:text-white"
              }`}
              title="Edit Mode"
            >
              <Edit3 size={13} />
            </button>
            <button
              type="button"
              onClick={() => setViewMode("split")}
              className={`hidden md:block p-1.5 rounded-md transition ${
                viewMode === "split"
                  ? "bg-cyan-400 text-slate-950 font-bold"
                  : "text-slate-400 hover:text-white"
              }`}
              title="Split View (Side-by-Side)"
            >
              <Columns size={13} />
            </button>
            <button
              type="button"
              onClick={() => setViewMode("preview")}
              className={`p-1.5 rounded-md transition ${
                viewMode === "preview"
                  ? "bg-cyan-400 text-slate-950 font-bold"
                  : "text-slate-400 hover:text-white"
              }`}
              title="Preview Mode"
            >
              <Eye size={13} />
            </button>
          </div>

          {/* Share Link */}
          <button
            type="button"
            onClick={handleCopyShareLink}
            title="Copy share link"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition"
          >
            <Share2 size={14} />
          </button>

          {/* Fullscreen Toggle */}
          <button
            type="button"
            onClick={() => setIsFullscreen(!isFullscreen)}
            title={isFullscreen ? "Exit Fullscreen (Esc)" : "Fullscreen Mode"}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition"
          >
            {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
          </button>
        </div>
      </div>

      {/* 2. Formatting Ribbon (visible when editing) */}
      {viewMode !== "preview" && (
        <PageToolbar
          onInsert={handleInsertFormatting}
          onOpenIssueEmbed={() => setAutocompleteOpen(true)}
        />
      )}

      {/* 3. Main Document Body */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left / Main Editor Pane */}
        {(viewMode === "edit" || viewMode === "split") && (
          <div
            className={`flex flex-col h-full overflow-y-auto p-6 md:p-8 ${
              viewMode === "split" ? "w-1/2 border-r border-white/[0.06]" : "w-full max-w-4xl mx-auto"
            }`}
          >
            {/* Title Input */}
            <input
              type="text"
              value={title}
              onChange={handleTitleChange}
              placeholder="Untitled Document"
              className="text-2xl md:text-3xl font-extrabold text-white bg-transparent border-none focus:outline-none placeholder-slate-600 mb-6 font-display"
            />

            {/* Markdown Textarea */}
            <div className="relative flex-1 flex flex-col min-h-[420px]">
              <textarea
                ref={textareaRef}
                value={content}
                onChange={handleContentChange}
                onKeyDown={handleKeyDown}
                placeholder="Write your technical documentation, PRD specifications, or meeting notes here... (type # to link issues)"
                className="w-full flex-1 bg-transparent border-none text-slate-200 text-sm leading-relaxed focus:outline-none resize-none placeholder-slate-600 font-mono"
              />

              {/* Autocomplete Dropdown */}
              {autocompleteOpen && (
                <div className="absolute left-0 bottom-12">
                  <IssueAutocompleteDropdown
                    projectId={projectId}
                    query={autocompleteQuery}
                    onSelect={handleSelectIssue}
                    onClose={() => setAutocompleteOpen(false)}
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Right / Preview Pane */}
        {(viewMode === "preview" || viewMode === "split") && (
          <div
            className={`flex flex-col h-full overflow-y-auto p-6 md:p-8 bg-[#090d18]/50 ${
              viewMode === "split" ? "w-1/2" : "w-full max-w-4xl mx-auto"
            }`}
          >
            {/* Rendered Document Header */}
            <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight font-display mb-6 border-b border-white/[0.08] pb-4">
              {title || "Untitled Document"}
            </h1>

            {/* Rendered Markdown Body */}
            <MarkdownRenderer
              markdown={content}
              projectId={projectId}
              onToggleTask={handleToggleTask}
              onOpenIssue={onOpenIssue}
            />
          </div>
        )}
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// Notion-Grade GitHub Flavored Markdown Renderer
// -------------------------------------------------------------
interface MarkdownRendererProps {
  markdown: string;
  projectId: string;
  onToggleTask?: (lineIndex: number) => void;
  onOpenIssue?: (issueId: string) => void;
}

function MarkdownRenderer({
  markdown,
  projectId,
  onToggleTask,
  onOpenIssue,
}: MarkdownRendererProps) {
  if (!markdown || !markdown.trim()) {
    return (
      <div className="py-12 text-center text-slate-600 text-sm italic">
        No content written yet. Switch to Edit mode to write your document.
      </div>
    );
  }

  const lines = markdown.split("\n");
  const renderedElements: React.ReactNode[] = [];

  let inCodeBlock = false;
  let codeBlockLang = "";
  let codeBlockLines: string[] = [];

  let inTable = false;
  let tableHeader: string[] = [];
  let tableRows: string[][] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // 1. Code Block Fence (```)
    if (line.startsWith("```")) {
      if (inCodeBlock) {
        // Close code block
        const codeText = codeBlockLines.join("\n");
        renderedElements.push(
          <CodeBlockView
            key={`code-${i}`}
            code={codeText}
            language={codeBlockLang || "text"}
          />
        );
        inCodeBlock = false;
        codeBlockLang = "";
        codeBlockLines = [];
      } else {
        // Open code block
        inCodeBlock = true;
        codeBlockLang = line.slice(3).trim();
      }
      continue;
    }

    if (inCodeBlock) {
      codeBlockLines.push(line);
      continue;
    }

    // 2. Table handling (| ... |)
    if (line.trim().startsWith("|") && line.trim().endsWith("|")) {
      const cells = line
        .split("|")
        .slice(1, -1)
        .map((c) => c.trim());

      // If divider row (:--- | ---:)
      if (cells.every((c) => /^[:-]+$/.test(c))) {
        continue;
      }

      if (!inTable) {
        inTable = true;
        tableHeader = cells;
        tableRows = [];
      } else {
        tableRows.push(cells);
      }
      continue;
    } else if (inTable) {
      // Close table
      renderedElements.push(
        <div key={`table-${i}`} className="my-4 overflow-x-auto rounded-xl border border-white/[0.08]">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#0e1628] border-b border-white/[0.08] text-slate-300 font-bold font-mono">
                {tableHeader.map((th, hIdx) => (
                  <th key={hIdx} className="px-4 py-2.5">
                    {th}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04] text-slate-300">
              {tableRows.map((row, rIdx) => (
                <tr key={rIdx} className="hover:bg-white/[0.02]">
                  {row.map((cell, cIdx) => (
                    <td key={cIdx} className="px-4 py-2 font-mono">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      inTable = false;
      tableHeader = [];
      tableRows = [];
    }

    // 3. Horizontal Rule
    if (/^---+$|^\*\*\*+$/.test(line.trim())) {
      renderedElements.push(
        <hr key={`hr-${i}`} className="border-t border-white/[0.08] my-6" />
      );
      continue;
    }

    // 4. Heading 1 (# ...)
    if (line.startsWith("# ")) {
      renderedElements.push(
        <h1
          key={`h1-${i}`}
          className="text-xl md:text-2xl font-extrabold text-white font-display mt-6 mb-3 tracking-tight"
        >
          {parseInlineFormatting(line.slice(2), projectId, onOpenIssue)}
        </h1>
      );
      continue;
    }

    // 5. Heading 2 (## ...)
    if (line.startsWith("## ")) {
      renderedElements.push(
        <h2
          key={`h2-${i}`}
          className="text-lg md:text-xl font-bold text-white font-display mt-5 mb-2.5 tracking-tight border-b border-white/[0.04] pb-1.5"
        >
          {parseInlineFormatting(line.slice(3), projectId, onOpenIssue)}
        </h2>
      );
      continue;
    }

    // 6. Heading 3 (### ...)
    if (line.startsWith("### ")) {
      renderedElements.push(
        <h3
          key={`h3-${i}`}
          className="text-base font-bold text-cyan-300 font-display mt-4 mb-2 tracking-tight"
        >
          {parseInlineFormatting(line.slice(4), projectId, onOpenIssue)}
        </h3>
      );
      continue;
    }

    // 7. Interactive Task List (- [ ] or - [x])
    const taskMatch = line.match(/^[-*]\s+\[([ xX])\]\s+(.*)$/);
    if (taskMatch) {
      const isChecked = taskMatch[1].toLowerCase() === "x";
      const taskText = taskMatch[2];
      const lineIdx = i;

      renderedElements.push(
        <div
          key={`task-${i}`}
          onClick={() => onToggleTask?.(lineIdx)}
          className="flex items-start gap-2.5 py-1 text-xs md:text-sm text-slate-200 cursor-pointer group select-none hover:text-white transition"
        >
          <div className="mt-0.5 shrink-0 text-cyan-400 group-hover:scale-110 transition">
            {isChecked ? (
              <CheckSquare size={16} className="text-cyan-400 fill-cyan-400/20" />
            ) : (
              <Square size={16} className="text-slate-500" />
            )}
          </div>
          <span className={isChecked ? "line-through text-slate-500" : ""}>
            {parseInlineFormatting(taskText, projectId, onOpenIssue)}
          </span>
        </div>
      );
      continue;
    }

    // 8. Bullet List (- or *)
    if (line.match(/^[-*]\s+(.*)$/)) {
      const bulletText = line.replace(/^[-*]\s+/, "");
      renderedElements.push(
        <div key={`bullet-${i}`} className="flex items-start gap-2 py-0.5 text-xs md:text-sm text-slate-300 pl-2">
          <span className="text-cyan-400 font-bold shrink-0">•</span>
          <span>{parseInlineFormatting(bulletText, projectId, onOpenIssue)}</span>
        </div>
      );
      continue;
    }

    // 9. Blockquote (> ...)
    if (line.startsWith("> ")) {
      renderedElements.push(
        <blockquote
          key={`quote-${i}`}
          className="pl-4 py-1.5 my-3 border-l-2 border-cyan-400/80 bg-cyan-400/[0.04] rounded-r-lg text-slate-300 text-xs md:text-sm italic"
        >
          {parseInlineFormatting(line.slice(2), projectId, onOpenIssue)}
        </blockquote>
      );
      continue;
    }

    // 10. Empty lines / Paragraphs
    if (!line.trim()) {
      renderedElements.push(<div key={`empty-${i}`} className="h-3" />);
    } else {
      renderedElements.push(
        <p key={`p-${i}`} className="text-xs md:text-sm text-slate-300 leading-relaxed my-1 font-sans">
          {parseInlineFormatting(line, projectId, onOpenIssue)}
        </p>
      );
    }
  }

  return <div className="space-y-1">{renderedElements}</div>;
}

// -------------------------------------------------------------
// Code Block with Copy to Clipboard
// -------------------------------------------------------------
function CodeBlockView({ code, language }: { code: string; language: string }) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="relative my-4 rounded-xl bg-[#070b13] border border-white/[0.08] overflow-hidden group">
      <div className="px-4 py-2 border-b border-white/[0.06] bg-[#0a0f1d] flex items-center justify-between text-[11px] font-mono text-slate-400">
        <span className="uppercase text-cyan-400">{language || "text"}</span>
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1 px-2 py-0.5 rounded hover:bg-white/5 text-slate-400 hover:text-white transition"
        >
          {copied ? (
            <>
              <Check size={12} className="text-emerald-400" />
              <span className="text-emerald-400">Copied</span>
            </>
          ) : (
            <>
              <Copy size={12} />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <pre className="p-4 text-xs font-mono text-slate-200 overflow-x-auto leading-relaxed">
        <code>{code}</code>
      </pre>
    </div>
  );
}

// -------------------------------------------------------------
// Parse Inline Formatting: Bold, Italic, Code, Issue Embeds
// -------------------------------------------------------------
function parseInlineFormatting(
  text: string,
  projectId: string,
  onOpenIssue?: (id: string) => void
): React.ReactNode {
  // Regex to match:
  // 1. Issue embeds: #([A-Z0-9]+-\d+) or #(\d+)
  // 2. Inline code: `([^`]+)`
  // 3. Bold: \*\*([^*]+)\*\*
  // 4. Italic: \*([^*]+)\*
  // 5. Links: \[([^\]]+)\]\(([^)]+)\)
  const regex = /(#([a-zA-Z0-9]+-\d+|\d+))|(`[^`]+`)|(\*\*[^*]+\*\*)|(\*[^*]+\*)|(\[[^\]]+\]\([^)]+\))/g;

  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }

    const matchedStr = match[0];

    // Issue Embed: #INN-42
    if (matchedStr.startsWith("#")) {
      const issueIdent = matchedStr.slice(1);
      parts.push(
        <PageIssueEmbed
          key={match.index}
          identifier={issueIdent}
          projectId={projectId}
          onOpenIssue={onOpenIssue}
        />
      );
    }
    // Inline code: `code`
    else if (matchedStr.startsWith("`") && matchedStr.endsWith("`")) {
      parts.push(
        <code
          key={match.index}
          className="px-1.5 py-0.5 rounded bg-white/[0.08] text-cyan-300 font-mono text-xs border border-white/5"
        >
          {matchedStr.slice(1, -1)}
        </code>
      );
    }
    // Bold: **text**
    else if (matchedStr.startsWith("**") && matchedStr.endsWith("**")) {
      parts.push(
        <strong key={match.index} className="font-bold text-white">
          {matchedStr.slice(2, -2)}
        </strong>
      );
    }
    // Italic: *text*
    else if (matchedStr.startsWith("*") && matchedStr.endsWith("*")) {
      parts.push(
        <em key={match.index} className="italic text-slate-300">
          {matchedStr.slice(1, -1)}
        </em>
      );
    }
    // Link: [title](url)
    else if (matchedStr.startsWith("[")) {
      const linkMatch = matchedStr.match(/^\[(.*)\]\((.*)\)$/);
      if (linkMatch) {
        parts.push(
          <a
            key={match.index}
            href={linkMatch[2]}
            target="_blank"
            rel="noopener noreferrer"
            className="text-cyan-400 hover:text-cyan-300 underline underline-offset-2 transition"
          >
            {linkMatch[1]}
          </a>
        );
      }
    }

    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  return parts.length > 0 ? parts : text;
}
