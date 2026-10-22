"use client";

import React from "react";
import {
  Heading1,
  Heading2,
  Heading3,
  Bold,
  Italic,
  Strikethrough,
  Code,
  FileCode,
  List,
  ListOrdered,
  CheckSquare,
  Quote,
  Link as LinkIcon,
  Table,
  Hash,
  Minus,
} from "lucide-react";

export interface PageToolbarProps {
  onInsert: (prefix: string, suffix?: string, defaultText?: string) => void;
  onOpenIssueEmbed?: () => void;
  disabled?: boolean;
}

export function PageToolbar({
  onInsert,
  onOpenIssueEmbed,
  disabled = false,
}: PageToolbarProps) {
  const tools = [
    {
      group: "headings",
      items: [
        {
          label: "Heading 1",
          icon: Heading1,
          action: () => onInsert("# ", "", "Main Heading"),
          shortcut: "H1",
        },
        {
          label: "Heading 2",
          icon: Heading2,
          action: () => onInsert("## ", "", "Section Heading"),
          shortcut: "H2",
        },
        {
          label: "Heading 3",
          icon: Heading3,
          action: () => onInsert("### ", "", "Subheading"),
          shortcut: "H3",
        },
      ],
    },
    {
      group: "formatting",
      items: [
        {
          label: "Bold",
          icon: Bold,
          action: () => onInsert("**", "**", "bold text"),
          shortcut: "⌘B",
        },
        {
          label: "Italic",
          icon: Italic,
          action: () => onInsert("*", "*", "italic text"),
          shortcut: "⌘I",
        },
        {
          label: "Strikethrough",
          icon: Strikethrough,
          action: () => onInsert("~~", "~~", "strikethrough"),
          shortcut: "",
        },
      ],
    },
    {
      group: "code",
      items: [
        {
          label: "Inline Code",
          icon: Code,
          action: () => onInsert("`", "`", "code"),
          shortcut: "⌘E",
        },
        {
          label: "Code Block",
          icon: FileCode,
          action: () => onInsert("```typescript\n", "\n```", "export function example() {\n  return true;\n}"),
          shortcut: "",
        },
      ],
    },
    {
      group: "lists",
      items: [
        {
          label: "Task List",
          icon: CheckSquare,
          action: () => onInsert("- [ ] ", "", "Task item"),
          shortcut: "TODO",
        },
        {
          label: "Bullet List",
          icon: List,
          action: () => onInsert("- ", "", "Bullet point"),
          shortcut: "",
        },
        {
          label: "Numbered List",
          icon: ListOrdered,
          action: () => onInsert("1. ", "", "List item"),
          shortcut: "",
        },
        {
          label: "Blockquote",
          icon: Quote,
          action: () => onInsert("> ", "", "Important quote or notice"),
          shortcut: "",
        },
      ],
    },
    {
      group: "inserts",
      items: [
        {
          label: "Insert Link",
          icon: LinkIcon,
          action: () => {
            const url = prompt("Enter URL:", "https://");
            if (url) {
              onInsert("[", `](${url})`, "Link text");
            }
          },
          shortcut: "⌘K",
        },
        {
          label: "Insert Table",
          icon: Table,
          action: () =>
            onInsert(
              "| Column 1 | Column 2 | Column 3 |\n| :--- | :--- | :--- |\n| Data A | Data B | Data C |\n| Data D | Data E | Data F |\n\n"
            ),
          shortcut: "",
        },
        {
          label: "Divider",
          icon: Minus,
          action: () => onInsert("\n---\n\n"),
          shortcut: "",
        },
      ],
    },
  ];

  return (
    <div className="flex items-center gap-1 px-4 py-2 bg-[#090e18] border-b border-white/[0.06] overflow-x-auto select-none scrollbar-none text-slate-300">
      {tools.map((group, gIdx) => (
        <React.Fragment key={group.group}>
          {gIdx > 0 && <div className="h-4 w-[1px] bg-white/[0.08] mx-1 shrink-0" />}
          <div className="flex items-center gap-0.5 shrink-0">
            {group.items.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.label}
                  type="button"
                  disabled={disabled}
                  onClick={item.action}
                  title={`${item.label} ${item.shortcut ? `(${item.shortcut})` : ""}`}
                  className="p-1.5 rounded-md hover:bg-white/[0.08] hover:text-white transition active:scale-95 text-slate-400 hover:text-cyan-300 disabled:opacity-40 disabled:pointer-events-none"
                >
                  <Icon size={14} />
                </button>
              );
            })}
          </div>
        </React.Fragment>
      ))}

      {/* # Issue Embed Summoner Button */}
      {onOpenIssueEmbed && (
        <>
          <div className="h-4 w-[1px] bg-white/[0.08] mx-1 shrink-0" />
          <button
            type="button"
            disabled={disabled}
            onClick={onOpenIssueEmbed}
            title="Embed Issue Reference (or type # anywhere)"
            className="flex items-center gap-1 px-2 py-1 rounded-md bg-cyan-400/10 hover:bg-cyan-400/20 text-cyan-300 border border-cyan-400/20 text-xs font-mono font-semibold transition active:scale-95 shrink-0"
          >
            <Hash size={12} />
            <span>Embed Issue</span>
          </button>
        </>
      )}
    </div>
  );
}
