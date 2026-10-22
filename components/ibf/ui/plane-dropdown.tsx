"use client";

import React, { useState, useRef, useEffect } from "react";
import { Check, ChevronDown, Search } from "lucide-react";

export interface PlaneDropdownItem<T = string> {
  id: T;
  label: string;
  subtitle?: string;
  icon?: any;
  iconColor?: string;
}

interface PlaneDropdownProps<T = string> {
  trigger: React.ReactNode;
  items: PlaneDropdownItem<T>[];
  selectedId?: T;
  onSelect: (item: PlaneDropdownItem<T>) => void;
  searchable?: boolean;
  searchPlaceholder?: string;
  align?: "left" | "right";
  className?: string;
}

export function PlaneDropdown<T = string>({
  trigger,
  items,
  selectedId,
  onSelect,
  searchable = false,
  searchPlaceholder = "Search...",
  align = "left",
  className = "",
}: PlaneDropdownProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      setTimeout(() => searchInputRef.current?.focus(), 30);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  // Filtered items
  const filtered = items.filter((item) =>
    item.label.toLowerCase().includes(search.toLowerCase().trim())
  );

  // Keyboard navigation
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (!isOpen) return;

      if (e.key === "Escape") {
        e.preventDefault();
        setIsOpen(false);
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIndex((prev) => (prev + 1) % (filtered.length || 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIndex((prev) => (prev - 1 + (filtered.length || 1)) % (filtered.length || 1));
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (filtered[activeIndex]) {
          onSelect(filtered[activeIndex]);
          setIsOpen(false);
        }
      }
    }

    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, filtered, activeIndex, onSelect]);

  return (
    <div ref={containerRef} className="relative inline-block text-left select-none">
      <div onClick={() => setIsOpen(!isOpen)}>{trigger}</div>

      {isOpen && (
        <div
          className={`absolute z-50 mt-1 min-w-[200px] max-w-[280px] rounded-xl bg-[#0f172a] border border-white/[0.14] shadow-2xl shadow-black/80 py-1.5 overflow-hidden animate-in fade-in zoom-in-95 duration-100 ${
            align === "right" ? "right-0" : "left-0"
          } ${className}`}
        >
          {searchable && (
            <div className="px-2.5 py-1.5 border-b border-white/[0.08] mb-1">
              <div className="relative flex items-center">
                <Search size={12} className="absolute left-2.5 text-slate-500 pointer-events-none" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setActiveIndex(0);
                  }}
                  placeholder={searchPlaceholder}
                  className="w-full bg-[#0a0f1d] text-xs text-slate-200 placeholder-slate-500 pl-8 pr-2.5 py-1 rounded-lg border border-white/10 focus:outline-none focus:ring-1 focus:ring-cyan-400"
                />
              </div>
            </div>
          )}

          <div className="max-h-60 overflow-y-auto px-1 space-y-0.5">
            {filtered.length === 0 ? (
              <div className="py-4 text-center text-xs text-slate-500">No options found</div>
            ) : (
              filtered.map((item, idx) => {
                const isSelected = item.id === selectedId;
                const isActive = idx === activeIndex;
                const Icon = item.icon;

                return (
                  <div
                    key={String(item.id)}
                    onClick={() => {
                      onSelect(item);
                      setIsOpen(false);
                    }}
                    onMouseEnter={() => setActiveIndex(idx)}
                    className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg cursor-pointer text-xs font-medium transition ${
                      isActive
                        ? "bg-white/[0.08] text-white"
                        : "text-slate-300 hover:bg-white/[0.04]"
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0 pr-2">
                      {Icon && (
                        <Icon size={14} className={item.iconColor || "text-slate-400"} />
                      )}
                      <div className="truncate">
                        <span className="truncate">{item.label}</span>
                        {item.subtitle && (
                          <span className="block text-[10px] text-slate-500 font-mono truncate">
                            {item.subtitle}
                          </span>
                        )}
                      </div>
                    </div>

                    {isSelected && (
                      <Check size={13} className="text-cyan-400 shrink-0 ml-1" />
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
