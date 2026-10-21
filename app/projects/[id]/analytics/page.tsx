"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import AppShell from "@/components/AppShell";
import {
  BarChart3,
  CheckCircle2,
  Clock,
  Layers,
  RotateCw,
  TrendingUp,
  AlertCircle,
  Loader2,
} from "lucide-react";

export default function ProjectAnalyticsPage() {
  const params = useParams();
  const projectId = params?.id as string;

  const [project, setProject] = useState<any>(null);
  const [issues, setIssues] = useState<any[]>([]);
  const [cycles, setCycles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      if (!projectId) return;
      setLoading(true);
      try {
        const [projRes, issuesRes, cyclesRes] = await Promise.all([
          fetch(`/api/projects/${projectId}`).catch(() => null),
          fetch(`/api/projects/${projectId}/issues`).catch(() => null),
          fetch(`/api/projects/${projectId}/cycles`).catch(() => null),
        ]);

        if (projRes && projRes.ok) {
          setProject(await projRes.json());
        }
        if (issuesRes && issuesRes.ok) {
          setIssues(await issuesRes.json());
        }
        if (cyclesRes && cyclesRes.ok) {
          setCycles(await cyclesRes.json());
        }
      } catch (err) {
        console.error("Failed to load project analytics data:", err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [projectId]);

  // Compute Metrics
  const totalIssues = issues.length;
  const doneIssues = issues.filter((i) => i.state === "done").length;
  const inProgressIssues = issues.filter((i) => i.state === "in_progress").length;
  const todoIssues = issues.filter((i) => i.state === "todo").length;
  const backlogIssues = issues.filter((i) => i.state === "backlog").length;
  const canceledIssues = issues.filter((i) => i.state === "canceled").length;

  const completionRate = totalIssues > 0 ? Math.round((doneIssues / totalIssues) * 100) : 0;

  const urgentIssues = issues.filter((i) => i.priority === "urgent").length;
  const highIssues = issues.filter((i) => i.priority === "high").length;
  const mediumIssues = issues.filter((i) => i.priority === "medium").length;
  const lowIssues = issues.filter((i) => i.priority === "low").length;

  const activeCycles = cycles.filter(
    (c) => c.status === "current" || c.status === "in_progress" || c.status === "active"
  ).length;

  return (
    <AppShell activeView="analytics" showTabs={true}>
      <div className="max-w-6xl mx-auto p-6 md:p-8 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between pb-5 border-b border-white/[0.06]">
          <div>
            <div className="flex items-center gap-2 text-cyan-300 font-mono text-[10px] uppercase tracking-wider font-bold">
              <BarChart3 size={14} />
              Venture Metrics & Velocity
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight mt-1">
              {project ? (project.name || project.title) : "Project Analytics"}
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Issue completion rates, sprint velocity, and priority allocation.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="py-20 flex items-center justify-center gap-2 text-xs text-slate-400">
            <Loader2 size={16} className="animate-spin text-cyan-300" />
            Analyzing project telemetry…
          </div>
        ) : (
          <div className="space-y-6">
            {/* 4 Summary Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-[#0d1424] border border-white/[0.08] rounded-2xl p-5 shadow-xl">
                <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider font-semibold">
                  Total Issues
                </span>
                <div className="text-3xl font-black text-white mt-2 flex items-baseline gap-2">
                  {totalIssues}
                  <span className="text-xs text-cyan-300 font-mono font-normal">
                    tracked
                  </span>
                </div>
              </div>

              <div className="bg-[#0d1424] border border-white/[0.08] rounded-2xl p-5 shadow-xl">
                <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider font-semibold">
                  Completed Issues
                </span>
                <div className="text-3xl font-black text-emerald-400 mt-2 flex items-baseline gap-2">
                  {doneIssues}
                  <span className="text-xs text-slate-400 font-mono font-normal">
                    of {totalIssues}
                  </span>
                </div>
              </div>

              <div className="bg-[#0d1424] border border-white/[0.08] rounded-2xl p-5 shadow-xl">
                <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider font-semibold">
                  Completion Rate
                </span>
                <div className="text-3xl font-black text-cyan-300 mt-2 flex items-baseline gap-2">
                  {completionRate}%
                  <TrendingUp size={18} className="text-cyan-300" />
                </div>
              </div>

              <div className="bg-[#0d1424] border border-white/[0.08] rounded-2xl p-5 shadow-xl">
                <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider font-semibold">
                  Active Sprints
                </span>
                <div className="text-3xl font-black text-white mt-2 flex items-baseline gap-2">
                  {activeCycles}
                  <span className="text-xs text-slate-400 font-mono font-normal">
                    {cycles.length} total
                  </span>
                </div>
              </div>
            </div>

            {/* State Distribution & Priority Allocation */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* State Distribution */}
              <div className="bg-[#0d1424] border border-white/[0.08] rounded-2xl p-6 shadow-xl space-y-4">
                <h2 className="text-sm font-bold text-white tracking-tight border-b border-white/[0.06] pb-3 flex items-center justify-between">
                  <span>Issue State Distribution</span>
                  <span className="text-xs font-mono text-slate-500 font-normal">
                    {totalIssues} items
                  </span>
                </h2>

                <div className="space-y-3 pt-1">
                  {[
                    { label: "Done", count: doneIssues, color: "bg-emerald-400", text: "text-emerald-400" },
                    { label: "In Progress", count: inProgressIssues, color: "bg-amber-400", text: "text-amber-400" },
                    { label: "To Do", count: todoIssues, color: "bg-blue-400", text: "text-blue-400" },
                    { label: "Backlog", count: backlogIssues, color: "bg-slate-400", text: "text-slate-400" },
                    { label: "Canceled", count: canceledIssues, color: "bg-rose-400", text: "text-rose-400" },
                  ].map((row) => {
                    const pct = totalIssues > 0 ? Math.round((row.count / totalIssues) * 100) : 0;
                    return (
                      <div key={row.label} className="space-y-1">
                        <div className="flex justify-between text-xs font-semibold">
                          <span className={row.text}>{row.label}</span>
                          <span className="text-slate-400 font-mono">
                            {row.count} ({pct}%)
                          </span>
                        </div>
                        <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${row.color} rounded-full transition-all duration-500`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Priority Allocation */}
              <div className="bg-[#0d1424] border border-white/[0.08] rounded-2xl p-6 shadow-xl space-y-4">
                <h2 className="text-sm font-bold text-white tracking-tight border-b border-white/[0.06] pb-3 flex items-center justify-between">
                  <span>Priority Allocation</span>
                  <span className="text-xs font-mono text-slate-500 font-normal">
                    Risk Breakdown
                  </span>
                </h2>

                <div className="space-y-3 pt-1">
                  {[
                    { label: "Urgent", count: urgentIssues, color: "bg-rose-500", text: "text-rose-400" },
                    { label: "High", count: highIssues, color: "bg-orange-500", text: "text-orange-400" },
                    { label: "Medium", count: mediumIssues, color: "bg-amber-400", text: "text-amber-300" },
                    { label: "Low", count: lowIssues, color: "bg-cyan-400", text: "text-cyan-300" },
                  ].map((row) => {
                    const pct = totalIssues > 0 ? Math.round((row.count / totalIssues) * 100) : 0;
                    return (
                      <div key={row.label} className="space-y-1">
                        <div className="flex justify-between text-xs font-semibold">
                          <span className={row.text}>{row.label}</span>
                          <span className="text-slate-400 font-mono">
                            {row.count} ({pct}%)
                          </span>
                        </div>
                        <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${row.color} rounded-full transition-all duration-500`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
