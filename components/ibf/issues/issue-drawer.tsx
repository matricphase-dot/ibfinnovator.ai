"use client";

import React, { useState, useEffect } from "react";
import { Issue } from "../board/issue-card";
import { IssueState, StateSelect } from "@/components/pm/state-select";
import { Priority, PrioritySelect } from "@/components/pm/priority-select";
import { Cycle } from "@/components/pm/cycles/cycles-view";
import { Label, Module } from "@/types/database.types";
import { IssueComments } from "./issue-comments";
import { IssueActivities } from "./issue-activities";
import { IssueSubtasks } from "./issue-subtasks";
import {
  X,
  Copy,
  Check,
  Calendar,
  Layers,
  Tag,
  Hash,
  Loader2,
  Trash2,
  Maximize2,
  Minimize2,
  User,
  Eye,
  Edit3,
  CheckSquare,
  Square,
  Clock,
} from "lucide-react";

interface Member {
  id: string;
  name?: string | null;
  full_name?: string | null;
  username?: string | null;
  avatar_url?: string | null;
}

interface IssueDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  issue: Issue | null;
  projectId: string;
  projectIdentifier?: string;
  cycles?: Cycle[];
  onIssueUpdated?: (updated: Issue) => void;
  onIssueDeleted?: (issueId: string) => void;
}

// Lightweight, XSS-safe Markdown Preview Component
function MarkdownPreview({ content }: { content: string }) {
  if (!content.trim()) {
    return (
      <p className="text-xs text-slate-500 italic py-2">
        No description provided yet. Click "Write" to add details.
      </p>
    );
  }

  const lines = content.split("\n");
  const renderedElements: React.ReactNode[] = [];
  let inCodeBlock = false;
  let codeBlockLines: string[] = [];

  lines.forEach((line, index) => {
    // Fenced Code Block
    if (line.trim().startsWith("```")) {
      if (inCodeBlock) {
        renderedElements.push(
          <pre
            key={`code-${index}`}
            className="p-3 bg-[#060a12] border border-white/[0.08] rounded-xl text-xs font-mono text-cyan-300 overflow-x-auto my-2"
          >
            <code>{codeBlockLines.join("\n")}</code>
          </pre>
        );
        codeBlockLines = [];
        inCodeBlock = false;
      } else {
        inCodeBlock = true;
      }
      return;
    }

    if (inCodeBlock) {
      codeBlockLines.push(line);
      return;
    }

    // Headers
    if (line.startsWith("### ")) {
      renderedElements.push(
        <h4 key={index} className="text-xs font-bold text-slate-200 mt-3 mb-1">
          {line.replace("### ", "")}
        </h4>
      );
      return;
    }
    if (line.startsWith("## ")) {
      renderedElements.push(
        <h3 key={index} className="text-sm font-bold text-white mt-3.5 mb-1.5">
          {line.replace("## ", "")}
        </h3>
      );
      return;
    }
    if (line.startsWith("# ")) {
      renderedElements.push(
        <h2 key={index} className="text-base font-bold text-white mt-4 mb-2">
          {line.replace("# ", "")}
        </h2>
      );
      return;
    }

    // Checkboxes (- [ ] or - [x])
    if (/^-\s*\[([ xX])\]\s+(.*)/.test(line)) {
      const match = line.match(/^-\s*\[([ xX])\]\s+(.*)/);
      const isChecked = match?.[1].toLowerCase() === "x";
      const text = match?.[2] || "";
      renderedElements.push(
        <div key={index} className="flex items-center gap-2 text-xs py-0.5">
          {isChecked ? (
            <CheckSquare size={13} className="text-emerald-400 shrink-0" />
          ) : (
            <Square size={13} className="text-slate-500 shrink-0" />
          )}
          <span className={isChecked ? "line-through text-slate-500" : "text-slate-300"}>
            {text}
          </span>
        </div>
      );
      return;
    }

    // Bullet Lists (- or *)
    if (line.startsWith("- ") || line.startsWith("* ")) {
      renderedElements.push(
        <li key={index} className="text-xs text-slate-300 ml-4 list-disc py-0.5">
          {line.substring(2)}
        </li>
      );
      return;
    }

    // Blockquotes (> )
    if (line.startsWith("> ")) {
      renderedElements.push(
        <blockquote
          key={index}
          className="border-l-2 border-cyan-400/60 pl-3 py-1 my-1.5 text-xs italic text-slate-400 bg-white/[0.01] rounded-r"
        >
          {line.replace("> ", "")}
        </blockquote>
      );
      return;
    }

    // Standard Paragraph
    if (line.trim().length > 0) {
      renderedElements.push(
        <p key={index} className="text-xs text-slate-300 leading-relaxed my-1">
          {line}
        </p>
      );
    } else {
      renderedElements.push(<div key={index} className="h-1.5" />);
    }
  });

  return <div className="space-y-0.5">{renderedElements}</div>;
}

export function IssueDrawer({
  isOpen,
  onClose,
  issue,
  projectId,
  projectIdentifier = "INN",
  cycles = [],
  onIssueUpdated,
  onIssueDeleted,
}: IssueDrawerProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [state, setState] = useState<IssueState>("todo");
  const [priority, setPriority] = useState<Priority>("none");
  const [cycleId, setCycleId] = useState<string>("");
  const [moduleId, setModuleId] = useState<string>("");
  const [assigneeId, setAssigneeId] = useState<string>("");
  const [estimatePoints, setEstimatePoints] = useState<number | null>(null);
  const [dueDate, setDueDate] = useState<string>("");
  const [labels, setLabels] = useState<Label[]>([]);

  // Metadata caches
  const [allLabels, setAllLabels] = useState<Label[]>([]);
  const [allModules, setAllModules] = useState<Module[]>([]);
  const [allMembers, setAllMembers] = useState<Member[]>([]);

  // UI state
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [descMode, setDescMode] = useState<"write" | "preview">("write");
  const [activeTab, setActiveTab] = useState<"comments" | "activity">("comments");
  const [copied, setCopied] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Sync state with incoming issue
  useEffect(() => {
    if (issue) {
      setTitle(issue.title || "");
      setDescription(issue.description || "");
      setState(issue.state || "todo");
      setPriority(issue.priority || "none");
      setCycleId(issue.cycle_id || "");
      setModuleId(issue.module_id || "");
      setAssigneeId(issue.assignee?.id || "");
      setEstimatePoints(issue.estimate_points ?? null);
      setDueDate(issue.due_date || "");
      setLabels(issue.labels || []);
    }
  }, [issue]);

  // Fetch available labels, modules & assignable members
  useEffect(() => {
    if (!isOpen || !projectId) return;

    async function loadMeta() {
      try {
        const [labelsRes, modulesRes, membersRes] = await Promise.all([
          fetch(`/api/projects/${projectId}/labels`),
          fetch(`/api/projects/${projectId}/modules`),
          fetch(`/api/projects/${projectId}/members`),
        ]);

        if (labelsRes.ok) {
          const lData = await labelsRes.json();
          setAllLabels(lData || []);
        }
        if (modulesRes.ok) {
          const mData = await modulesRes.json();
          setAllModules(mData || []);
        }
        if (membersRes.ok) {
          const memData = await membersRes.json();
          setAllMembers(memData || []);
        }
      } catch (err) {
        console.error("Failed to load metadata", err);
      }
    }

    loadMeta();
  }, [isOpen, projectId]);

  // Keyboard shortcut: Escape to close
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !issue) return null;

  async function updateField(fields: Partial<any>) {
    setIsSaving(true);
    try {
      const res = await fetch(`/api/issues/${issue!.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fields),
      });

      if (!res.ok) throw new Error("Failed to update issue");
      const updated = await res.json();
      if (onIssueUpdated) onIssueUpdated(updated);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  }

  function handleCopyLink() {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  async function handleDelete() {
    if (!window.confirm("Are you sure you want to permanently delete this issue?")) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/issues/${issue!.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete issue");
      if (onIssueDeleted) onIssueDeleted(issue!.id);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsDeleting(false);
    }
  }

  function toggleLabel(label: Label) {
    const exists = labels.some((l) => l.id === label.id);
    const newLabels = exists
      ? labels.filter((l) => l.id !== label.id)
      : [...labels, label];

    setLabels(newLabels);
    updateField({ label_ids: newLabels.map((l) => l.id) });
  }

  const drawerWidthClass = isFullScreen
    ? "w-full max-w-full"
    : "w-full max-w-[720px]";

  const createdAtFormatted = issue.created_at
    ? new Date(issue.created_at).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/65 backdrop-blur-xs animate-in fade-in duration-200">
      {/* Click outside to close backdrop (only active when not fullscreen) */}
      {!isFullScreen && <div className="flex-1" onClick={onClose} />}

      {/* Side-Peek Issue Drawer Container */}
      <div
        className={`${drawerWidthClass} h-full bg-[#080c14] border-l border-white/[0.08] shadow-2xl flex flex-col z-10 transition-all duration-200 overflow-hidden text-slate-100`}
      >
        {/* Top Header: ID + FullScreen + Copy + Close */}
        <div className="px-6 py-3 border-b border-white/[0.06] flex items-center justify-between bg-[#0b101c]/80 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-cyan-400/10 text-cyan-300 border border-cyan-400/20">
              {projectIdentifier}-{issue.sequence_id}
            </span>
            {isSaving && (
              <span className="flex items-center gap-1.5 text-[11px] text-cyan-400 font-medium">
                <Loader2 size={12} className="animate-spin" />
                Saving...
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            {/* Full Screen Toggle */}
            <button
              onClick={() => setIsFullScreen((prev) => !prev)}
              title={isFullScreen ? "Restore side drawer" : "Full screen modal"}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition"
            >
              {isFullScreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
            </button>

            {/* Copy Link Button */}
            <button
              onClick={handleCopyLink}
              title="Copy issue link"
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition flex items-center gap-1 text-xs"
            >
              {copied ? (
                <>
                  <Check size={14} className="text-emerald-400" />
                  <span className="text-emerald-400 font-mono text-[11px]">Copied</span>
                </>
              ) : (
                <Copy size={14} />
              )}
            </button>

            {/* Delete Button */}
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              title="Delete issue"
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition"
            >
              <Trash2 size={14} />
            </button>

            <div className="h-4 w-[1px] bg-white/10 mx-1" />

            {/* Close Button */}
            <button
              onClick={onClose}
              title="Close drawer (Esc)"
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* 2-Column Split: Content & Discussions (60%) vs Metadata (40%) */}
        <div className="flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-12 divide-y md:divide-y-0 md:divide-x divide-white/[0.06]">
          {/* LEFT PANEL: 60% Width */}
          <div className="md:col-span-7 lg:col-span-7 p-6 flex flex-col gap-6 overflow-y-auto">
            {/* Title Input with Auto-Save */}
            <div>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={() => {
                  const trimmed = title.trim();
                  if (!trimmed) {
                    setTitle(issue.title);
                    return;
                  }
                  if (trimmed !== issue.title) {
                    updateField({ title: trimmed });
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    (e.target as HTMLInputElement).blur();
                  }
                }}
                placeholder="Issue title..."
                className="w-full text-lg font-bold text-white bg-transparent border-none focus:outline-none focus:ring-0 placeholder-slate-600 leading-tight"
              />
            </div>

            {/* Rich Markdown Description Editor */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Description
                </label>
                <div className="flex items-center gap-1 p-0.5 bg-[#0e1626] border border-white/[0.06] rounded-lg text-[11px]">
                  <button
                    type="button"
                    onClick={() => setDescMode("write")}
                    className={`px-2 py-0.5 rounded flex items-center gap-1 transition ${
                      descMode === "write"
                        ? "bg-cyan-400/20 text-cyan-300 font-bold"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    <Edit3 size={11} />
                    Write
                  </button>
                  <button
                    type="button"
                    onClick={() => setDescMode("preview")}
                    className={`px-2 py-0.5 rounded flex items-center gap-1 transition ${
                      descMode === "preview"
                        ? "bg-cyan-400/20 text-cyan-300 font-bold"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    <Eye size={11} />
                    Preview
                  </button>
                </div>
              </div>

              {descMode === "write" ? (
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  onBlur={() => updateField({ description })}
                  placeholder="Add a detailed description, checklist items (- [ ]), or code blocks (Markdown supported)..."
                  rows={6}
                  className="w-full p-3.5 rounded-xl bg-[#0b101c] border border-white/[0.08] text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-400/50 resize-y leading-relaxed transition font-mono"
                />
              ) : (
                <div className="w-full p-3.5 rounded-xl bg-[#0b101c] border border-white/[0.08] min-h-[140px]">
                  <MarkdownPreview content={description} />
                </div>
              )}
            </div>

            {/* Subtasks Checklist */}
            <div className="pt-2 border-t border-white/[0.06]">
              <IssueSubtasks
                parentIssueId={issue.id}
                projectId={projectId}
                projectIdentifier={projectIdentifier}
                initialSubtasks={issue.subtasks || []}
              />
            </div>

            {/* Discussions & Activity Switcher Tabs */}
            <div className="pt-4 border-t border-white/[0.06] flex flex-col gap-4">
              <div className="flex items-center gap-2 border-b border-white/[0.06] pb-2">
                <button
                  onClick={() => setActiveTab("comments")}
                  className={`px-3 py-1 text-xs font-semibold rounded-lg transition ${
                    activeTab === "comments"
                      ? "bg-cyan-400/10 text-cyan-300 font-bold"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  Discussions
                </button>
                <button
                  onClick={() => setActiveTab("activity")}
                  className={`px-3 py-1 text-xs font-semibold rounded-lg transition ${
                    activeTab === "activity"
                      ? "bg-cyan-400/10 text-cyan-300 font-bold"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  Activity Audit
                </button>
              </div>

              {activeTab === "comments" ? (
                <IssueComments issueId={issue.id} />
              ) : (
                <IssueActivities issueId={issue.id} />
              )}
            </div>
          </div>

          {/* RIGHT PANEL: Metadata Inspector (40% Width) */}
          <div className="md:col-span-5 lg:col-span-5 p-5 bg-[#070b12] flex flex-col gap-5 text-xs">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Properties
            </span>

            {/* State */}
            <div className="flex flex-col gap-1.5">
              <label className="text-slate-400 text-[11px]">State</label>
              <StateSelect
                value={state}
                onChange={(s) => {
                  setState(s);
                  updateField({ state: s });
                }}
              />
            </div>

            {/* Priority */}
            <div className="flex flex-col gap-1.5">
              <label className="text-slate-400 text-[11px]">Priority</label>
              <PrioritySelect
                value={priority}
                onChange={(p) => {
                  setPriority(p);
                  updateField({ priority: p });
                }}
              />
            </div>

            {/* Assignee */}
            <div className="flex flex-col gap-1.5">
              <label className="text-slate-400 text-[11px] flex items-center gap-1">
                <User size={12} className="text-cyan-400" />
                Assignee
              </label>
              <select
                value={assigneeId}
                onChange={(e) => {
                  const val = e.target.value || null;
                  setAssigneeId(val || "");
                  updateField({ assignee_id: val });
                }}
                className="w-full px-3 py-2 bg-[#0e1626] border border-white/[0.08] rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-cyan-300 cursor-pointer"
              >
                <option value="">Unassigned</option>
                {allMembers.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.full_name || m.name || m.username || m.id}
                  </option>
                ))}
              </select>
            </div>

            {/* Sprint (Cycle) */}
            <div className="flex flex-col gap-1.5">
              <label className="text-slate-400 text-[11px]">Cycle / Sprint</label>
              <select
                value={cycleId}
                onChange={(e) => {
                  const val = e.target.value || null;
                  setCycleId(val || "");
                  updateField({ cycle_id: val });
                }}
                className="w-full px-3 py-2 bg-[#0e1626] border border-white/[0.08] rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-cyan-300 cursor-pointer"
              >
                <option value="">No Cycle (Backlog)</option>
                {cycles.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.status})
                  </option>
                ))}
              </select>
            </div>

            {/* Module (Epic) */}
            <div className="flex flex-col gap-1.5">
              <label className="text-slate-400 text-[11px] flex items-center gap-1">
                <Layers size={12} className="text-cyan-400" />
                Module / Epic
              </label>
              <select
                value={moduleId}
                onChange={(e) => {
                  const val = e.target.value || null;
                  setModuleId(val || "");
                  updateField({ module_id: val });
                }}
                className="w-full px-3 py-2 bg-[#0e1626] border border-white/[0.08] rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-cyan-300 cursor-pointer"
              >
                <option value="">No Module</option>
                {allModules.map((m) => (
                  <option key={m.id} value={m.id}>
                    ⊡ {m.name} ({m.status})
                  </option>
                ))}
              </select>
            </div>

            {/* Story Points (Estimate) */}
            <div className="flex flex-col gap-1.5">
              <label className="text-slate-400 text-[11px] flex items-center gap-1">
                <Hash size={12} className="text-cyan-400" />
                Estimate Points
              </label>
              <div className="flex items-center gap-1.5 flex-wrap">
                {[1, 2, 3, 5, 8, 13].map((pts) => (
                  <button
                    key={pts}
                    type="button"
                    onClick={() => {
                      const newPts = estimatePoints === pts ? null : pts;
                      setEstimatePoints(newPts);
                      updateField({ estimate_points: newPts });
                    }}
                    className={`px-2.5 py-1 rounded-lg font-mono text-xs font-semibold transition ${
                      estimatePoints === pts
                        ? "bg-cyan-400 text-slate-950 font-bold"
                        : "bg-white/5 text-slate-300 hover:bg-white/10 border border-white/5"
                    }`}
                  >
                    {pts}
                  </button>
                ))}
              </div>
            </div>

            {/* Due Date */}
            <div className="flex flex-col gap-1.5">
              <label className="text-slate-400 text-[11px] flex items-center gap-1">
                <Calendar size={12} className="text-cyan-400" />
                Due Date
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => {
                  setDueDate(e.target.value);
                  updateField({ due_date: e.target.value || null });
                }}
                className="w-full px-3 py-2 bg-[#0e1626] border border-white/[0.08] rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-cyan-300 cursor-pointer"
              />
            </div>

            {/* Labels */}
            <div className="flex flex-col gap-2 pt-2 border-t border-white/[0.06]">
              <label className="text-slate-400 text-[11px] flex items-center gap-1">
                <Tag size={12} className="text-cyan-400" />
                Labels
              </label>
              <div className="flex items-center gap-1.5 flex-wrap">
                {allLabels.length === 0 ? (
                  <span className="text-[11px] text-slate-500">No labels created yet.</span>
                ) : (
                  allLabels.map((lbl) => {
                    const active = labels.some((l) => l.id === lbl.id);
                    return (
                      <button
                        key={lbl.id}
                        type="button"
                        onClick={() => toggleLabel(lbl)}
                        className={`text-[11px] font-medium px-2 py-0.5 rounded-md border transition ${
                          active ? "opacity-100 ring-1 ring-white/30" : "opacity-50 hover:opacity-80"
                        }`}
                        style={{
                          backgroundColor: `${lbl.color}20`,
                          borderColor: `${lbl.color}50`,
                          color: lbl.color,
                        }}
                      >
                        {lbl.name} {active && "✓"}
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            {/* Audit / Stamp Info */}
            <div className="pt-3 mt-auto border-t border-white/[0.06] flex flex-col gap-1 text-[11px] text-slate-500 font-mono">
              {createdAtFormatted && (
                <div className="flex items-center gap-1">
                  <Clock size={11} className="text-slate-600" />
                  <span>Created: {createdAtFormatted}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
