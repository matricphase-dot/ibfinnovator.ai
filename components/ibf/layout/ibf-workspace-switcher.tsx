"use client";

import React, { useState, useRef, useEffect } from "react";
import { Check, ChevronDown, ChevronsUpDown, Plus, Sparkles, Building2 } from "lucide-react";

export interface IbfWorkspaceSwitcherProps {
  currentWorkspace: {
    id: string;
    name: string;
    slug: string;
    logo_url?: string;
  };
  workspaces?: Array<{
    id: string;
    name: string;
    slug: string;
    logo_url?: string;
  }>;
  onSelectWorkspace?: (workspaceId: string) => void;
  onCreateWorkspace?: () => void;
  isCollapsed?: boolean;
}

export function IbfWorkspaceSwitcher({
  currentWorkspace,
  workspaces = [],
  onSelectWorkspace,
  onCreateWorkspace,
  isCollapsed = false,
}: IbfWorkspaceSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const initials = (currentWorkspace?.name || "IBF")
    .split(" ")
    .map((s) => s[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`w-full flex items-center gap-2.5 p-2 rounded-xl text-left transition hover:bg-slate-100 border border-transparent hover:border-slate-200 group ${
          isOpen ? "bg-slate-100 border-slate-200" : ""
        } ${isCollapsed ? "justify-center px-1" : ""}`}
        title={currentWorkspace?.name || "Workspace"}
      >
        {/* Monogram Box */}
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400/20 via-cyan-400/10 to-transparent border border-cyan-400/30 flex items-center justify-center flex-shrink-0 text-cyan-300 shadow-[0_0_15px_rgba(0,245,212,0.12)] group-hover:border-cyan-300 transition">
          {currentWorkspace?.logo_url ? (
            <img
              src={currentWorkspace.logo_url}
              alt={currentWorkspace.name}
              className="w-full h-full rounded-lg object-cover"
            />
          ) : (
            <span className="font-mono font-bold text-xs tracking-wider text-cyan-300">
              {initials}
            </span>
          )}
        </div>

        {!isCollapsed && (
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-slate-900 tracking-tight truncate">
                {currentWorkspace?.name || "Workspace"}
              </span>
            </div>
            <p className="text-[10px] font-mono text-slate-500 truncate tracking-wide">
              {currentWorkspace?.slug || "workspace"}
            </p>
          </div>
        )}

        {!isCollapsed && (
          <ChevronsUpDown
            size={14}
            className="text-slate-500 group-hover:text-slate-300 flex-shrink-0 transition"
          />
        )}
      </button>

      {/* Popover Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-1.5 w-64 bg-white border border-slate-200 rounded-xl shadow-xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
          <div className="px-2.5 py-1.5 text-[10px] font-mono uppercase tracking-wider text-slate-500 font-semibold border-b border-slate-100 mb-1">
            Workspaces
          </div>

          <div className="max-h-56 overflow-y-auto space-y-0.5">
            {workspaces.map((ws) => {
              const isSelected = ws.id === currentWorkspace?.id;
              const wsInitials = (ws.name || "WS")
                .split(" ")
                .map((s) => s[0])
                .join("")
                .slice(0, 2)
                .toUpperCase();

              return (
                <button
                  key={ws.id}
                  type="button"
                  onClick={() => {
                    onSelectWorkspace?.(ws.id);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left text-xs font-semibold transition ${
                    isSelected
                      ? "bg-cyan-50 text-cyan-700 border border-cyan-200"
                      : "text-slate-700 hover:text-slate-900 hover:bg-slate-100"
                  }`}
                >
                  <div className="w-6 h-6 rounded-md bg-slate-100 border border-slate-200 flex items-center justify-center flex-shrink-0 text-[10px] font-mono text-slate-700">
                    {wsInitials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="truncate leading-tight font-bold">{ws.name}</p>
                    <p className="text-[10px] font-mono text-slate-500 truncate">
                      {ws.slug}
                    </p>
                  </div>
                  {isSelected && <Check size={14} className="text-cyan-600 flex-shrink-0" />}
                </button>
              );
            })}
          </div>

          <div className="mt-1 pt-1 border-t border-slate-100">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                onCreateWorkspace?.();
              }}
              className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-semibold text-cyan-700 hover:bg-cyan-50 transition"
            >
              <Plus size={14} />
              Create New Workspace
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
