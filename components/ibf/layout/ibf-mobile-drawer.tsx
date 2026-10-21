"use client";

import React, { useEffect } from "react";
import { X } from "lucide-react";
import { IbfSidebar, IbfSidebarProps } from "./ibf-sidebar";

export interface IbfMobileDrawerProps extends IbfSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function IbfMobileDrawer({
  isOpen,
  onClose,
  ...sidebarProps
}: IbfMobileDrawerProps) {
  // Lock background scroll and close on Escape key
  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
      }
    }

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      {/* Dark backdrop blur */}
      <div
        className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity duration-200 animate-in fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Off-canvas sliding panel */}
      <div className="fixed inset-y-0 left-0 max-w-[300px] w-full bg-[#0d121f] border-r border-white/[0.08] shadow-2xl flex flex-col z-50 animate-in slide-in-from-left duration-250">
        {/* Drawer Header Close Button */}
        <div className="flex items-center justify-between p-3 border-b border-white/[0.06] bg-[#0a0e19]">
          <span className="text-xs font-mono font-bold tracking-wider text-slate-400 uppercase">
            Navigation
          </span>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition"
            title="Close navigation"
          >
            <X size={16} />
          </button>
        </div>

        {/* Sidebar Content inside Drawer */}
        <div className="flex-1 overflow-hidden" onClick={(e) => {
          // If clicked a link in the sidebar, close the drawer
          if ((e.target as HTMLElement).closest("a")) {
            onClose();
          }
        }}>
          <IbfSidebar
            {...sidebarProps}
            isCollapsed={false}
            onToggleCollapse={onClose}
          />
        </div>
      </div>
    </div>
  );
}
