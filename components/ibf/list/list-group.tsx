"use client";

import React, { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";

interface ListGroupProps {
  title: string;
  count: number;
  icon?: React.ReactNode;
  defaultExpanded?: boolean;
  children: React.ReactNode;
}

export function ListGroup({
  title,
  count,
  icon,
  defaultExpanded = true,
  children,
}: ListGroupProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <>
      {/* Group Header Row */}
      <tr className="bg-white/[0.02] border-y border-white/[0.06] select-none">
        <td colSpan={6} className="py-2 px-4">
          <button
            type="button"
            onClick={() => setIsExpanded((prev) => !prev)}
            className="flex items-center gap-2 text-xs font-bold text-slate-300 hover:text-white transition w-full text-left"
          >
            <span className="text-slate-400">
              {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </span>
            {icon && <span className="flex items-center">{icon}</span>}
            <span className="tracking-tight">{title}</span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-white/5 text-slate-400 border border-white/5 font-semibold">
              {count}
            </span>
          </button>
        </td>
      </tr>

      {/* Group Content Rows */}
      {isExpanded && children}
    </>
  );
}
