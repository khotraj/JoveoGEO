"use client";

import { ChevronDown, Download, Share2, Calendar } from "lucide-react";

export function TopBar() {
  return (
    <header
      className="sticky top-0 z-[60] shrink-0"
      style={{
        background: "rgba(255,255,255,.85)",
        backdropFilter: "saturate(180%) blur(14px)",
        WebkitBackdropFilter: "saturate(180%) blur(14px)",
        borderBottom: "1px solid var(--line-2)",
      }}
    >
      <div
        className="mx-auto flex items-center gap-4 px-8"
        style={{ maxWidth: 1480, padding: "11px 32px" }}
      >
        {/* Brand */}
        <div className="flex items-center gap-[11px]">
          <div
            className="flex items-center justify-center text-white font-black shrink-0"
            style={{
              width: 30,
              height: 30,
              borderRadius: 9,
              background: "linear-gradient(135deg,#5B5BD6,#7C3AED)",
              boxShadow: "0 4px 12px rgba(91,91,214,.32), inset 0 1px 0 rgba(255,255,255,.2)",
              fontSize: 13,
            }}
          >
            J
          </div>
          <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.15 }}>
            <strong style={{ fontWeight: 700, fontSize: 13.5, letterSpacing: "-0.01em", color: "var(--ink)" }}>
              Career Site Cockpit
            </strong>
            <small style={{ fontSize: 10.5, fontWeight: 500, letterSpacing: "0.04em", textTransform: "uppercase", marginTop: 1, color: "var(--ink-4)" }}>
              by Joveo
            </small>
          </div>
        </div>

        {/* Site pill */}
        <div
          className="inline-flex items-center gap-[7px]"
          style={{
            padding: "5px 10px 5px 8px",
            background: "var(--indigo-tint)",
            border: "1px solid #DBE0FF",
            color: "var(--indigo-2)",
            borderRadius: 999,
            fontSize: 11.5,
            fontWeight: 600,
          }}
        >
          <span className="live-dot" />
          jobs.banfield.com
        </div>

        <div style={{ flex: 1 }} />

        {/* Controls */}
        <div className="flex items-center gap-[7px]">
          <button
            className="inline-flex items-center gap-1.5"
            style={{
              padding: "6.5px 11px",
              background: "transparent",
              border: "1px solid transparent",
              borderRadius: 9,
              fontSize: 12,
              fontWeight: 500,
              color: "var(--ink-3)",
              cursor: "pointer",
            }}
          >
            <Calendar size={13} style={{ color: "var(--ink-5)" }} />
            Last 30 days
          </button>
          <button
            className="inline-flex items-center gap-1.5"
            style={{
              padding: "6.5px 11px",
              background: "var(--surface)",
              border: "1px solid var(--line)",
              borderRadius: 9,
              fontSize: 12,
              fontWeight: 500,
              color: "var(--ink-2)",
              cursor: "pointer",
            }}
          >
            <Download size={13} />
            Export
          </button>
          <button
            className="inline-flex items-center gap-1.5"
            style={{
              padding: "6.5px 11px",
              background: "var(--ink)",
              border: "1px solid var(--ink)",
              borderRadius: 9,
              fontSize: 12,
              fontWeight: 600,
              color: "#fff",
              cursor: "pointer",
            }}
          >
            <Share2 size={12} />
            Share Report
          </button>
        </div>
      </div>

      <style>{`
        .live-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--green);
          box-shadow: 0 0 0 3px rgba(34,197,94,.18);
          animation: livepulse 2.4s cubic-bezier(.4,0,.2,1) infinite;
          flex-shrink: 0;
        }
        @keyframes livepulse {
          0%,100% { box-shadow: 0 0 0 3px rgba(34,197,94,.18); }
          50%      { box-shadow: 0 0 0 6px rgba(34,197,94,0);   }
        }
      `}</style>
    </header>
  );
}
