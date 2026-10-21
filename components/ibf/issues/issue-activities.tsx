"use client";

import React, { useState, useEffect } from "react";
import { IssueActivity } from "@/types/database.types";
import { History, Loader2, GitCommitHorizontal, CheckCircle2, AlertCircle } from "lucide-react";

interface IssueActivitiesProps {
  issueId: string;
}

const FIELD_LABELS: Record<string, string> = {
  state: "State",
  priority: "Priority",
  title: "Title",
  estimate_points: "Estimate Points",
  due_date: "Due Date",
  cycle_id: "Sprint Cycle",
  module_id: "Module",
  assignee_id: "Assignee",
};

function formatActivityValue(val: string | null | undefined): string {
  if (!val) return "none";
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val)) {
    return "(selected)";
  }
  return val;
}

export function IssueActivities({ issueId }: IssueActivitiesProps) {
  const [activities, setActivities] = useState<IssueActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;
    async function fetchActivities() {
      setLoading(true);
      try {
        const res = await fetch(`/api/issues/${issueId}/activities`);
        if (!res.ok) throw new Error("Failed to load activities");
        const data = await res.json();
        if (isMounted) setActivities(data || []);
      } catch (err: any) {
        if (isMounted) setError(err.message || "Failed to load audit history");
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    if (issueId) fetchActivities();
    return () => {
      isMounted = false;
    };
  }, [issueId]);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
        <History size={14} className="text-cyan-400" />
        <span>Activity History ({activities.length})</span>
      </div>

      {loading ? (
        <div className="py-6 flex items-center justify-center gap-2 text-xs text-slate-500">
          <Loader2 size={14} className="animate-spin text-cyan-400" />
          Loading audit log...
        </div>
      ) : activities.length === 0 ? (
        <div className="py-8 px-4 text-center rounded-xl bg-white/[0.02] border border-white/[0.05]">
          <p className="text-xs text-slate-400">No activity logged yet.</p>
          <p className="text-[11px] text-slate-600 mt-0.5">Changes to state, priority, or assignee will appear here.</p>
        </div>
      ) : (
        <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-[1px] before:bg-white/10">
          {activities.map((act) => {
            const actorName = act.actor?.full_name || act.actor?.name || "System / User";
            const dateStr = new Date(act.created_at).toLocaleString(undefined, {
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            });

            const fieldLabel = FIELD_LABELS[act.field] || act.field;
            const oldValFormatted = formatActivityValue(act.old_value);
            const newValFormatted = formatActivityValue(act.new_value);

            return (
              <div key={act.id} className="relative flex flex-col gap-1 text-xs">
                {/* Node icon */}
                <div className="absolute -left-6 top-0.5 w-3 h-3 rounded-full bg-[#0a0f1d] border-2 border-cyan-400" />

                <div className="flex items-center gap-2 flex-wrap text-slate-400">
                  <span className="font-semibold text-white">{actorName}</span>
                  <span>changed</span>
                  <span className="font-mono text-cyan-300 font-medium px-1.5 py-0.5 rounded bg-cyan-400/10 text-[11px]">
                    {fieldLabel}
                  </span>
                  {act.old_value && (
                    <>
                      <span>from</span>
                      <span className="line-through text-slate-500 font-mono text-[11px]">{oldValFormatted}</span>
                    </>
                  )}
                  <span>to</span>
                  <span className="font-semibold text-slate-200 font-mono text-[11px]">{newValFormatted}</span>
                </div>
                <span className="text-[10px] text-slate-500 font-mono">{dateStr}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
