"use client";

import {
  Award,
  Code,
  Palette,
  Rocket,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";
import { useState } from "react";

/**
 * Badge grid for a member's earned badges.
 *
 * `badge_definitions.icon` stores a lucide icon *name* (seeded as code, palette,
 * trending-up, rocket), so it is mapped through a whitelist rather than
 * rendered as markup or an arbitrary dynamic import. Clicking a card expands
 * the full evidence text.
 */

const ICONS: Record<string, LucideIcon> = {
  code: Code,
  palette: Palette,
  "trending-up": TrendingUp,
  rocket: Rocket,
};

export interface EarnedBadge {
  id: string;
  evidence?: string | null;
  created_at?: string;
  badge?: { name?: string; description?: string; icon?: string; color?: string } | null;
  project?: { id?: string; title?: string } | null;
  awarder?: { id?: string; name?: string } | null;
}

export default function BadgeGrid({
  badges,
  className = "",
}: {
  badges: EarnedBadge[];
  className?: string;
}) {
  const [open, setOpen] = useState<string | null>(null);

  if (!badges?.length) {
    return (
      <div
        className={`py-10 border border-dashed border-white/10 rounded-2xl text-center ${className}`}
      >
        <Award className="mx-auto text-slate-600" size={30} />
        <p className="text-sm text-slate-500 mt-3">No badges earned yet.</p>
      </div>
    );
  }

  return (
    <div className={`grid sm:grid-cols-2 lg:grid-cols-4 gap-4 ${className}`}>
      {badges.map((entry) => {
        const Icon = ICONS[entry.badge?.icon ?? ""] ?? Award;
        const color = entry.badge?.color || "#00f5d4";
        const isOpen = open === entry.id;
        const evidence = entry.evidence ?? "";

        return (
          <article
            key={entry.id}
            className="project-cyber-card text-center"
            style={{ borderColor: `${color}33` }}
          >
            <span
              className="h-14 w-14 mx-auto rounded-2xl grid place-items-center"
              style={{ backgroundColor: `${color}1a`, color }}
            >
              <Icon size={27} aria-hidden="true" />
            </span>
            <h3 className="font-bold mt-4">{entry.badge?.name ?? "Badge"}</h3>
            <p className="text-xs text-slate-500 mt-2">
              {entry.project?.title ?? "Project"}
            </p>

            {evidence && (
              <>
                <p
                  className={`text-xs text-slate-400 mt-3 ${isOpen ? "" : "line-clamp-3"}`}
                >
                  {evidence}
                </p>
                {evidence.length > 90 && (
                  <button
                    type="button"
                    onClick={() => setOpen(isOpen ? null : entry.id)}
                    aria-expanded={isOpen}
                    className="text-[11px] text-cyan-300 font-bold mt-2"
                  >
                    {isOpen ? "Show less" : "Read full evidence"}
                  </button>
                )}
              </>
            )}

            <p className="text-[10px] text-slate-600 mt-3">
              {entry.awarder?.name ? `Awarded by ${entry.awarder.name} · ` : ""}
              {entry.created_at ? new Date(entry.created_at).toLocaleDateString() : ""}
            </p>
          </article>
        );
      })}
    </div>
  );
}
