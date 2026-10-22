"use client";

import React, { useState } from "react";

interface PlaneTooltipProps {
  content: string;
  shortcut?: string;
  children: React.ReactNode;
  position?: "top" | "bottom" | "left" | "right";
  delayMs?: number;
}

export function PlaneTooltip({
  content,
  shortcut,
  children,
  position = "top",
  delayMs = 150,
}: PlaneTooltipProps) {
  const [visible, setVisible] = useState(false);
  const [timer, setTimer] = useState<NodeJS.Timeout | null>(null);

  function handleMouseEnter() {
    const t = setTimeout(() => setVisible(true), delayMs);
    setTimer(t);
  }

  function handleMouseLeave() {
    if (timer) clearTimeout(timer);
    setVisible(false);
  }

  const positionClasses = {
    top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
    bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
    left: "right-full top-1/2 -translate-y-1/2 mr-2",
    right: "left-full top-1/2 -translate-y-1/2 ml-2",
  };

  return (
    <div
      className="relative inline-flex items-center"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleMouseEnter}
      onBlur={handleMouseLeave}
    >
      {children}

      {visible && (
        <div
          className={`absolute z-50 pointer-events-none whitespace-nowrap px-2 py-1 rounded-[6px] bg-[#070b13] border border-white/[0.14] text-[11px] font-medium text-slate-200 shadow-xl shadow-black/80 flex items-center gap-1.5 animate-in fade-in zoom-in-95 duration-100 ${positionClasses[position]}`}
        >
          <span>{content}</span>
          {shortcut && (
            <kbd className="font-mono text-[9px] px-1 py-0.2 rounded bg-white/[0.08] text-slate-400 border border-white/10 uppercase">
              {shortcut}
            </kbd>
          )}
        </div>
      )}
    </div>
  );
}
