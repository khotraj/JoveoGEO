"use client";

import { ChevronDown, Download, Share2, Bell } from "lucide-react";

interface TopBarProps {
  projectName?: string;
  projectInitials?: string;
}

export function TopBar({ projectName = "Banfield Pet Hospital", projectInitials = "BA" }: TopBarProps) {
  return (
    <header
      className="flex items-center justify-between px-5 h-12 shrink-0 border-b"
      style={{
        background: "var(--surface)",
        borderColor: "var(--line)",
        boxShadow: "var(--sh-1)",
      }}
    >
      {/* Left: brand mark + project switcher */}
      <div className="flex items-center gap-3">
        <div
          className="w-7 h-7 rounded-[10px] flex items-center justify-center text-white text-xs font-black shrink-0"
          style={{ background: "linear-gradient(135deg, var(--indigo), var(--purple))" }}
        >
          {projectInitials}
        </div>
        <button
          className="flex items-center gap-1.5 text-sm font-semibold transition-colors hover:opacity-70"
          style={{ color: "var(--ink-2)" }}
        >
          {projectName}
          <ChevronDown size={13} style={{ color: "var(--ink-5)" }} />
        </button>
      </div>

      {/* Right: date range + actions */}
      <div className="flex items-center gap-2">
        <button
          className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-[var(--r-sm)] transition-colors hover:bg-[var(--bg-2)]"
          style={{ color: "var(--ink-3)", border: "1px solid var(--line)" }}
        >
          Last 30 days
          <ChevronDown size={11} style={{ color: "var(--ink-5)" }} />
        </button>

        <div className="w-px h-4" style={{ background: "var(--line)" }} />

        <button
          className="p-1.5 rounded-[var(--r-sm)] transition-colors hover:bg-[var(--bg-2)]"
          style={{ color: "var(--ink-4)" }}
          title="Notifications"
        >
          <Bell size={15} />
        </button>
        <button
          className="p-1.5 rounded-[var(--r-sm)] transition-colors hover:bg-[var(--bg-2)]"
          style={{ color: "var(--ink-4)" }}
          title="Export"
        >
          <Download size={15} />
        </button>
        <button
          className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-[var(--r-sm)] text-white transition-opacity hover:opacity-90"
          style={{ background: "linear-gradient(135deg, var(--indigo), var(--purple))" }}
        >
          <Share2 size={12} />
          Share
        </button>
      </div>
    </header>
  );
}
