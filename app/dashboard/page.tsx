"use client";

import React, { useState } from "react";
import AppShell from "@/components/AppShell";
import { useWorkspace } from "@/components/ibf/layout/workspace-context";
import { ProjectManagementWorkspace } from "@/components/pm/pm-workspace";
import {
  FolderKanban,
  Plus,
  Loader2,
  ChevronDown,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";

function DashboardContent() {
  const {
    currentWorkspace,
    projects,
    activeProject,
    selectProject,
    loading,
    refreshData,
  } = useWorkspace();

  // New project modal state for empty accounts
  const [newTitle, setNewTitle] = useState("");
  const [newIdentifier, setNewIdentifier] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleCreateFirstProject(e: React.FormEvent) {
    e.preventDefault();
    if (!newTitle.trim()) return;

    setSubmitting(true);
    try {
      const ident = (newIdentifier.trim() || newTitle.slice(0, 3))
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, "");
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTitle.trim(),
          name: newTitle.trim(),
          description:
            newDescription.trim() ||
            `Core engineering workspace for ${newTitle.trim()}.`,
          required_skills: ["Engineering", "Architecture", "Design"],
          domain: "Technology",
          stage: "BUILDING",
          identifier: ident || "INN",
          workspace_id: currentWorkspace?.id,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to create project");
      }

      const createdProject = await res.json();
      toast.success("Project created! Launching Plane workspace…");

      // Seed starter Plane issues for the user
      try {
        await Promise.all([
          fetch(`/api/projects/${createdProject.id}/issues`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              title: "Welcome to Plane Workspace on Innovators.ai",
              description:
                "Explore Kanban boards, high-density List views, Sprint cycles, and real-time collaboration.",
              state: "in_progress",
              priority: "high",
            }),
          }),
          fetch(`/api/projects/${createdProject.id}/issues`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              title: "Define milestone deliverables & roadmap",
              description:
                "Break down the core venture milestones and invite team collaborators.",
              state: "todo",
              priority: "urgent",
            }),
          }),
          fetch(`/api/projects/${createdProject.id}/issues`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              title: "Configure team permissions & roles",
              description:
                "Review permissions and assign issues to builders across your team.",
              state: "backlog",
              priority: "medium",
            }),
          }),
        ]);
      } catch {}

      await refreshData();
      selectProject(createdProject.id, "board");
    } catch (err: any) {
      toast.error(err.message || "Failed to create project");
    } finally {
      setSubmitting(false);
    }
  }

  // 1. Shimmer Loading Skeleton
  if (loading) {
    return (
      <div className="p-6 flex flex-col gap-6">
        {/* Top Bar Skeleton */}
        <div className="h-14 bg-white border border-slate-200 rounded-2xl animate-pulse flex items-center px-6 justify-between shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-slate-100" />
            <div className="w-36 h-4 rounded-md bg-slate-100" />
          </div>
          <div className="flex items-center gap-2">
            <div className="w-24 h-8 rounded-xl bg-slate-100" />
            <div className="w-28 h-8 rounded-xl bg-slate-100" />
          </div>
        </div>

        {/* 5 Kanban Columns Skeleton */}
        <div className="grid grid-cols-5 gap-4 flex-1">
          {[1, 2, 3, 4, 5].map((col) => (
            <div
              key={col}
              className="bg-slate-100/70 border border-slate-200 rounded-2xl p-4 flex flex-col gap-3 min-h-[500px]"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <div className="w-20 h-4 rounded bg-slate-200/60" />
                <div className="w-6 h-4 rounded-full bg-slate-200/60" />
              </div>
              <div className="h-24 bg-white border border-slate-200 rounded-xl animate-pulse" />
              <div className="h-28 bg-white border border-slate-200 rounded-xl animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 2. Empty State: No Projects in this Workspace
  if (!activeProject || projects.length === 0) {
    return (
      <div className="flex items-center justify-center p-6 min-h-[600px]">
        <div className="max-w-md w-full bg-white border border-slate-200 rounded-2xl p-8 shadow-xl text-center">
          <div className="w-14 h-14 rounded-2xl bg-cyan-50 border border-cyan-200 text-cyan-600 grid place-items-center mx-auto mb-5 shadow-xs">
            <FolderKanban size={28} />
          </div>

          <h2 className="text-xl font-bold tracking-tight text-slate-900">
            Launch Your Plane Workspace
          </h2>
          <p className="text-sm text-slate-600 mt-2 leading-relaxed">
            Create your project in{" "}
            {currentWorkspace?.name || "your workspace"} to start tracking
            issues, sprint cycles, and milestone roadmaps.
          </p>

          <form
            onSubmit={handleCreateFirstProject}
            className="mt-6 text-left space-y-4"
          >
            <div>
              <label className="block text-xs font-mono font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Project Title
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Innovator Engine"
                value={newTitle}
                onChange={(e) => {
                  setNewTitle(e.target.value);
                  if (!newIdentifier) {
                    setNewIdentifier(
                      e.target.value.slice(0, 3).toUpperCase(),
                    );
                  }
                }}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-mono font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Identifier Prefix
              </label>
              <input
                type="text"
                required
                maxLength={5}
                placeholder="e.g. INN"
                value={newIdentifier}
                onChange={(e) =>
                  setNewIdentifier(
                    e.target.value
                      .toUpperCase()
                      .replace(/[^A-Z0-9]/g, ""),
                  )
                }
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono text-cyan-700 placeholder-slate-400 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition uppercase"
              />
            </div>

            <div>
              <label className="block text-xs font-mono font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Description
              </label>
              <textarea
                rows={2}
                placeholder="Briefly describe what your venture is building..."
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={submitting || !newTitle.trim()}
              className="w-full py-3 bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-sm rounded-xl transition flex items-center justify-center gap-2 mt-4 shadow-sm disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Initializing Workspace…
                </>
              ) : (
                <>
                  Create Project & Launch Board <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // 3. Active Plane Project Management Workspace
  return (
    <div className="flex flex-col min-h-full bg-slate-50">
      {/* Project Switcher Bar if workspace has multiple projects */}
      {projects.length > 1 && (
        <div className="px-6 py-2 bg-white border-b border-slate-200 flex items-center gap-3">
          <span className="text-[11px] font-mono text-slate-500 font-semibold">
            ACTIVE PROJECT:
          </span>
          <div className="relative inline-flex items-center">
            <select
              value={activeProject.id}
              onChange={(e) => selectProject(e.target.value, "board")}
              className="appearance-none pl-3 pr-8 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 hover:border-cyan-400 focus:outline-none cursor-pointer"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.identifier || "INN"})
                </option>
              ))}
            </select>
            <ChevronDown
              size={13}
              className="pointer-events-none absolute right-2 text-slate-400"
            />
          </div>
          <Link
            href="/projects/new"
            className="ml-auto text-[11px] font-semibold text-cyan-600 hover:text-cyan-700 hover:underline flex items-center gap-1"
          >
            <Plus size={12} /> New Project
          </Link>
        </div>
      )}

      {/* 1:1 Plane Workspace Engine */}
      <ProjectManagementWorkspace
        projectId={activeProject.id}
        projectName={activeProject.name || "Innovator Project"}
        projectIdentifier={activeProject.identifier || "INN"}
        initialTab="board"
        hideTopBar={true}
      />
    </div>
  );
}

export default function Dashboard() {
  return (
    <AppShell activeView="board" showTabs={true}>
      <DashboardContent />
    </AppShell>
  );
}
