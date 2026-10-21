"use client";

import React, { useState, useEffect } from "react";
import { Issue } from "@/components/pm/issue-card";
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
  ExternalLink,
  Sparkles,
} from "lucide-react";

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
  const [estimatePoints, setEstimatePoints] = useState<number | null>(null);
  const [dueDate, setDueDate] = useState<string>("");
  const [labels, setLabels] = useState<Label[]>([]);
  const [allLabels, setAllLabels] = useState<Label[]>([]);
  const [allModules, setAllModules] = useState<Module[]>([]);

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
      setEstimatePoints(issue.estimate_points ?? null);
      setDueDate(issue.due_date || "");
      setLabels(issue.labels || []);
    }
  }, [issue]);

  // Fetch available project labels & modules
  useEffect(() => {
    if (!isOpen || !projectId) return;

    async function loadMeta() {
      try {
        const [labelsRes, modulesRes] = await Promise.all([
          fetch(`/api/projects/${projectId}/labels`),
          fetch(`/api/projects/${projectId}/modules`),
        ]);
        if (labelsRes.ok) {
          const lData = await labelsRes.json();
          setAllLabels(lData || []);
        }
        if (modulesRes.ok) {
          const mData = await modulesRes.json();
          setAllModules(mData || []);
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
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      {/* Click outside to close backdrop */}
      <div className="flex-1" onClick={onClose} />

      {/* 720px Side-Peek Drawer */}
      <div className="w-full max-w-[760px] h-full bg-[#080c14] border-l border-white/[0.08] shadow-2xl flex flex-col z-10 animate-in slide-in-from-right duration-200 overflow-hidden text-slate-100">
        {/* Top Navigation Bar */}
        <div className="px-6 py-3.5 border-b border-white/[0.06] flex items-center justify-between bg-[#0b101c]/80 backdrop-blur-md">
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

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyLink}
              title="Copy issue link"
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition flex items-center gap-1 text-xs"
            >
              {copied ? (
                <>
                  <Check size={14} className="text-emerald-400" />
                  <span className="text-emerald-400">Copied</span>
                </>
              ) : (
                <Copy size={14} />
              )}
            </button>

            <button
              onClick={handleDelete}
              disabled={isDeleting}
              title="Delete issue"
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition"
            >
              <Trash2 size={14} />
            </button>

            <div className="h-4 w-[1px] bg-white/10 mx-1" />

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Drawer Body: 2-Column Split View */}
        <div className="flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-12 divide-y md:divide-y-0 md:divide-x divide-white/[0.06]">
          {/* LEFT PANEL: Title, Description, Subtasks, Comments & Activity (65% width) */}
          <div className="md:col-span-8 p-6 flex flex-col gap-6 overflow-y-auto">
            {/* Title Input */}
            <div>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={() => updateField({ title })}
                placeholder="Issue title..."
                className="w-full text-lg font-bold text-white bg-transparent border-none focus:outline-none focus:ring-0 placeholder-slate-600 leading-tight"
              />
            </div>

            {/* Description Editor */}
            <div className="flex flex-col gap-2">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                onBlur={() => updateField({ description })}
                placeholder="Add a detailed description or technical specifications (Markdown supported)..."
                rows={5}
                className="w-full p-3.5 rounded-xl bg-[#0b101c] border border-white/[0.08] text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-400/50 resize-y leading-relaxed transition"
              />
            </div>

            {/* Subtasks Checklist */}
            <div className="pt-2 border-t border-white/[0.06]">
              <IssueSubtasks
                parentIssueId={issue.id}
                projectId={projectId}
                projectIdentifier={projectIdentifier}
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

          {/* RIGHT PANEL: Metadata Sidebar (35% width) */}
          <div className="md:col-span-4 p-5 bg-[#070b12] flex flex-col gap-5 text-xs">
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
                className="w-full px-3 py-2 bg-[#0e1626] border border-white/[0.08] rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-cyan-300"
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
          </div>
        </div>
      </div>
    </div>
  );
}
