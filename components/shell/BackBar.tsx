"use client";

import Link from "next/link";
import { ChevronLeft } from "lucide-react";

interface BackBarProps {
  label: string;
  href: string;
  title?: string;
}

export function BackBar({ label, href, title }: BackBarProps) {
  return (
    <div
      className="flex items-center gap-3 px-5 h-10 border-b shrink-0"
      style={{ background: "var(--surface)", borderColor: "var(--line)" }}
    >
      <Link
        href={href}
        className="flex items-center gap-1 text-xs font-medium transition-colors hover:opacity-70"
        style={{ color: "var(--ink-4)" }}
      >
        <ChevronLeft size={13} />
        {label}
      </Link>
      {title && (
        <>
          <span style={{ color: "var(--line)" }}>/</span>
          <span className="text-xs font-semibold" style={{ color: "var(--ink-2)" }}>{title}</span>
        </>
      )}
    </div>
  );
}
