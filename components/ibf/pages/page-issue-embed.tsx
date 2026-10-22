"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  CheckCircle2,
  Circle,
  Clock,
  AlertCircle,
  XCircle,
  ExternalLink,
  Search,
  Loader2,
  Layers,
} from "lucide-react";

export interface EmbeddedIssueData {
  id: string;
  sequence_id: number;
  title: string;
  state: string;
  priority?: string | null;
  project?: {
    identifier?: string;
    name?: string;
  } | null;
}

interface PageIssueEmbedProps {
  identifier: string; // e.g. "INN-42" or "#INN-42" or "42"
  projectId?: string;
  initialIssue?: EmbeddedIssueData;
  onOpenIssue?: (issueId: string) => void;
}

export function PageIssueEmbed({
  identifier,
  projectId,
  initialIssue,
  onOpenIssue,
}: PageIssueEmbedProps) {
  const cleanId = identifier.replace(/^#/, "").trim();
  const [issue, setIssue] = useState<EmbeddedIssueData | null>(initialIssue || null);
  const [loading, setLoading] = useState(!initialIssue);

  useEffect(() => {
    if (initialIssue) return;

    let isMounted = true;
    async function fetchIssue() {
      setLoading(true);
      try {
        const res = await fetch(`/api/issues?q=${encodeURIComponent(cleanId)}&limit=1`);
        if (res.ok) {
          const data = await res.json();
          if (isMounted && data.issues && data.issues.length > 0) {
            setIssue(data.issues[0]);
          }
        }
      } catch (err) {
        console.error("Failed to load embedded issue:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    if (cleanId) fetchIssue();
    return () => {
      isMounted = false;
    };
  }, [cleanId, initialIssue]);

  const stateColors: Record<string, { bg: string; text: string; border: string; icon: any }> = {
    done: {
      bg: "bg-emerald-500/10",
      text: "text-emerald-400",
      border: "border-emerald-500/30",
      icon: CheckCircle2,
    },
    in_progress: {
      bg: "bg-cyan-500/10",
      text: "text-cyan-400",
      border: "border-cyan-500/30",
      icon: Clock,
    },
    todo: {
      bg: "bg-slate-500/10",
      text: "text-slate-400",
      border: "border-slate-500/20",
      icon: Circle,
    },
    backlog: {
      bg: "bg-indigo-500/10",
      text: "text-indigo-400",
      border: "border-indigo-500/30",
      icon: Layers,
    },
    canceled: {
      bg: "bg-rose-500/10",
      text: "text-rose-400",
      border: "border-rose-500/30",
      icon: XCircle,
    },
  };

  const stateInfo = issue?.state && stateColors[issue.state]
    ? stateColors[issue.state]
    : {
        bg: "bg-slate-500/10",
        text: "text-slate-400",
        border: "border-slate-500/20",
        icon: Circle,
      };

  const StateIcon = stateInfo.icon;
  const displayIdentifier = issue?.project?.identifier
    ? `${issue.project.identifier}-${issue.sequence_id}`
    : cleanId;

  if (loading) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-[#111a2e] border border-white/10 text-xs text-slate-400 font-mono align-middle my-0.5">
        <Loader2 size={11} className="animate-spin text-cyan-400" />
        <span>#{cleanId}</span>
      </span>
    );
  }

  if (!issue) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-xs font-mono text-cyan-400 hover:underline align-middle my-0.5">
        #{cleanId}
      </span>
    );
  }

  return (
    <span
      onClick={() => onOpenIssue?.(issue.id)}
      className="inline-flex items-center gap-2 px-2.5 py-1 rounded-lg bg-[#0e172a] hover:bg-[#131f38] border border-white/[0.12] hover:border-cyan-400/40 text-xs transition cursor-pointer group shadow-sm align-middle my-0.5 select-none"
      title={`Issue: ${displayIdentifier} · ${issue.title} (${issue.state})`}
    >
      <span className="font-mono font-bold text-cyan-400 group-hover:text-cyan-300 transition">
        #{displayIdentifier}
      </span>

      <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold border ${stateInfo.bg} ${stateInfo.text} ${stateInfo.border}`}>
        <StateIcon size={10} />
        <span className="capitalize">{issue.state.replace("_", " ")}</span>
      </span>

      <span className="text-slate-200 group-hover:text-white truncate max-w-[200px] md:max-w-[280px]">
        {issue.title}
      </span>

      <ExternalLink size={11} className="text-slate-500 group-hover:text-cyan-300 opacity-0 group-hover:opacity-100 transition shrink-0" />
    </span>
  );
}

interface IssueAutocompleteProps {
  projectId?: string;
  query: string;
  onSelect: (issue: EmbeddedIssueData) => void;
  onClose: () => void;
}

export function IssueAutocompleteDropdown({
  projectId,
  query,
  onSelect,
  onClose,
}: IssueAutocompleteProps) {
  const [issues, setIssues] = useState<EmbeddedIssueData[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let isMounted = true;
    const clean = query.replace(/^#/, "").trim();

    async function searchIssues() {
      setLoading(true);
      try {
        const url = projectId
          ? `/api/projects/${projectId}/issues?limit=8`
          : `/api/issues?q=${encodeURIComponent(clean)}&limit=8`;
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          const items = Array.isArray(data) ? data : data.issues || [];
          if (isMounted) {
            setIssues(items);
            setSelectedIndex(0);
          }
        }
      } catch (err) {
        console.error("Autocomplete fetch error:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    const timer = setTimeout(searchIssues, 150);
    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [query, projectId]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % (issues.length || 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + (issues.length || 1)) % (issues.length || 1));
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (issues[selectedIndex]) {
          onSelect(issues[selectedIndex]);
        }
      } else if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [issues, selectedIndex, onSelect, onClose]);

  return (
    <div
      ref={dropdownRef}
      className="absolute z-50 mt-1 w-80 md:w-96 rounded-xl bg-[#0d1424] border border-cyan-500/30 shadow-2xl shadow-black/80 overflow-hidden animate-in fade-in duration-100"
    >
      <div className="px-3 py-2 border-b border-white/[0.08] bg-[#0a0f1d] flex items-center justify-between text-[11px] font-mono text-slate-400">
        <span className="flex items-center gap-1.5 text-cyan-400">
          <Search size={12} />
          Link an Issue ({query || "#"})
        </span>
        <span className="text-[10px] text-slate-500">↑↓ to navigate · ↵ select</span>
      </div>

      <div className="max-h-60 overflow-y-auto p-1.5 divide-y divide-white/[0.04]">
        {loading ? (
          <div className="py-6 flex items-center justify-center gap-2 text-xs text-slate-400">
            <Loader2 size={13} className="animate-spin text-cyan-400" />
            Searching issues...
          </div>
        ) : issues.length === 0 ? (
          <div className="py-6 text-center text-xs text-slate-500">
            No matching issues found
          </div>
        ) : (
          issues.map((item, idx) => {
            const isSelected = idx === selectedIndex;
            const ident = item.project?.identifier
              ? `${item.project.identifier}-${item.sequence_id}`
              : `#${item.sequence_id}`;

            return (
              <div
                key={item.id}
                onClick={() => onSelect(item)}
                onMouseEnter={() => setSelectedIndex(idx)}
                className={`flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition ${
                  isSelected
                    ? "bg-cyan-500/15 border border-cyan-400/30 text-white"
                    : "text-slate-300 hover:bg-white/[0.04]"
                }`}
              >
                <div className="min-w-0 pr-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-mono font-bold text-cyan-400">
                      #{ident}
                    </span>
                    <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 rounded bg-white/5 text-slate-400">
                      {item.state}
                    </span>
                  </div>
                  <p className="text-xs truncate font-medium mt-0.5 text-slate-200">
                    {item.title}
                  </p>
                </div>

                <div className="text-[10px] text-slate-500 font-mono shrink-0">
                  {item.priority || "Normal"}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
