"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import AppShell from "@/components/AppShell";
import {
  Settings,
  Tag,
  Save,
  Loader2,
  Trash2,
  Plus,
  ArrowLeft,
  FolderKanban,
  CheckCircle2,
} from "lucide-react";
import toast from "react-hot-toast";

export default function ProjectSettingsPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params?.id as string;

  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form fields
  const [title, setTitle] = useState("");
  const [identifier, setIdentifier] = useState("");
  const [description, setDescription] = useState("");
  const [domain, setDomain] = useState("Technology");
  const [stage, setStage] = useState("BUILDING");

  // Labels
  const [labels, setLabels] = useState<any[]>([]);
  const [newLabelName, setNewLabelName] = useState("");
  const [newLabelColor, setNewLabelColor] = useState("#00f5d4");
  const [addingLabel, setAddingLabel] = useState(false);

  useEffect(() => {
    async function loadProject() {
      if (!projectId) return;
      setLoading(true);
      try {
        const [projRes, labelsRes] = await Promise.all([
          fetch(`/api/projects/${projectId}`),
          fetch(`/api/projects/${projectId}/labels`).catch(() => null),
        ]);

        if (projRes.ok) {
          const data = await projRes.json();
          setProject(data);
          setTitle(data.name || data.title || "");
          setIdentifier(data.identifier || "INN");
          setDescription(data.description || "");
          setDomain(data.domain || "Technology");
          setStage(data.stage || "BUILDING");
        }

        if (labelsRes && labelsRes.ok) {
          const lData = await labelsRes.json();
          setLabels(lData || []);
        }
      } catch (err) {
        console.error("Failed to load project details:", err);
      } finally {
        setLoading(false);
      }
    }

    loadProject();
  }, [projectId]);

  async function handleSaveSettings(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;

    setSaving(true);
    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          name: title.trim(),
          identifier: identifier.trim().toUpperCase(),
          description: description.trim(),
          domain,
          stage,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to update settings");
      }

      toast.success("Project settings saved successfully!");
    } catch (err: any) {
      toast.error(err.message || "Failed to save project settings");
    } finally {
      setSaving(false);
    }
  }

  async function handleAddLabel(e: React.FormEvent) {
    e.preventDefault();
    if (!newLabelName.trim()) return;

    setAddingLabel(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/labels`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newLabelName.trim(),
          color: newLabelColor,
        }),
      });

      if (!res.ok) throw new Error("Failed to create label");
      const created = await res.json();
      setLabels((prev) => [...prev, created]);
      setNewLabelName("");
      toast.success("Label added");
    } catch (err: any) {
      toast.error(err.message || "Failed to add label");
    } finally {
      setAddingLabel(false);
    }
  }

  return (
    <AppShell activeView="settings" showTabs={true}>
      <div className="max-w-4xl mx-auto p-6 md:p-8 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between pb-5 border-b border-white/[0.06]">
          <div>
            <div className="flex items-center gap-2 text-cyan-300 font-mono text-[10px] uppercase tracking-wider font-bold">
              <Settings size={14} />
              Project Settings
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight mt-1">
              {project ? (project.name || project.title) : "Settings"}
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Configure project name, identifier code, venture stage, and team labels.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="py-20 flex items-center justify-center gap-2 text-xs text-slate-400">
            <Loader2 size={16} className="animate-spin text-cyan-300" />
            Loading project settings…
          </div>
        ) : (
          <div className="space-y-8">
            {/* General Project Settings Form */}
            <form onSubmit={handleSaveSettings} className="bg-[#0d1424] border border-white/[0.08] rounded-2xl p-6 shadow-xl space-y-5">
              <h2 className="text-sm font-bold text-white tracking-tight border-b border-white/[0.06] pb-3">
                General Information
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                    Project Title
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#080d18] border border-white/[0.1] rounded-xl text-sm text-white focus:outline-none focus:border-cyan-300 transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                    Identifier Prefix (e.g. INN)
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={5}
                    value={identifier}
                    onChange={(e) =>
                      setIdentifier(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))
                    }
                    className="w-full px-3.5 py-2.5 bg-[#080d18] border border-white/[0.1] rounded-xl text-sm font-mono text-cyan-300 focus:outline-none focus:border-cyan-300 transition uppercase"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#080d18] border border-white/[0.1] rounded-xl text-sm text-white focus:outline-none focus:border-cyan-300 transition resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                    Domain / Vertical
                  </label>
                  <select
                    value={domain}
                    onChange={(e) => setDomain(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#080d18] border border-white/[0.1] rounded-xl text-sm text-white focus:outline-none focus:border-cyan-300 transition"
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
                  <label className="block text-xs font-mono font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                    Venture Stage
                  </label>
                  <select
                    value={stage}
                    onChange={(e) => setStage(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#080d18] border border-white/[0.1] rounded-xl text-sm text-white focus:outline-none focus:border-cyan-300 transition"
                  >
                    <option value="IDEATION">Ideation & Planning</option>
                    <option value="BUILDING">Building (MVP In Progress)</option>
                    <option value="ALPHA">Alpha Testing</option>
                    <option value="BETA">Beta Launch</option>
                    <option value="GROWTH">Growth & Scaling</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={saving || !title.trim()}
                  className="flex items-center gap-2 px-5 py-2.5 bg-cyan-300 hover:bg-cyan-200 text-slate-950 font-bold text-xs rounded-xl transition disabled:opacity-50 shadow-md"
                >
                  {saving ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      Saving…
                    </>
                  ) : (
                    <>
                      <Save size={14} /> Save Changes
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* Labels Management */}
            <div className="bg-[#0d1424] border border-white/[0.08] rounded-2xl p-6 shadow-xl space-y-4">
              <h2 className="text-sm font-bold text-white tracking-tight border-b border-white/[0.06] pb-3 flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Tag size={16} className="text-cyan-300" />
                  Issue Labels
                </span>
                <span className="text-xs font-mono text-slate-500 font-normal">
                  {labels.length} labels configured
                </span>
              </h2>

              <div className="flex flex-wrap gap-2 py-2">
                {labels.length === 0 ? (
                  <p className="text-xs text-slate-500">No labels configured yet.</p>
                ) : (
                  labels.map((l) => (
                    <span
                      key={l.id}
                      style={{
                        backgroundColor: `${l.color}15`,
                        color: l.color,
                        borderColor: `${l.color}35`,
                      }}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border"
                    >
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: l.color }}
                      />
                      {l.name}
                    </span>
                  ))
                )}
              </div>

              {/* Add Label Form */}
              <form onSubmit={handleAddLabel} className="pt-3 border-t border-white/[0.04] flex flex-wrap items-center gap-2">
                <input
                  type="text"
                  placeholder="New label name (e.g. Bug, Feature)..."
                  value={newLabelName}
                  onChange={(e) => setNewLabelName(e.target.value)}
                  className="flex-1 min-w-[200px] px-3 py-1.5 bg-[#080d18] border border-white/[0.1] rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-300"
                />
                <input
                  type="color"
                  value={newLabelColor}
                  onChange={(e) => setNewLabelColor(e.target.value)}
                  className="w-9 h-8 bg-transparent border-0 cursor-pointer rounded"
                  title="Pick color"
                />
                <button
                  type="submit"
                  disabled={addingLabel || !newLabelName.trim()}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/15 text-white text-xs font-semibold rounded-xl transition disabled:opacity-50"
                >
                  <Plus size={14} /> Add Label
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
