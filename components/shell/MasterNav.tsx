"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Plus } from "lucide-react";

const NAV_ITEMS = [
  { label: "Overview",        href: "/" },
  { label: "Traffic",         href: "/traffic" },
  { label: "Visible-for",     href: "/visible/1" },
  { label: "GEO",             href: "/geo" },
  { label: "Recommendations", href: "/recommendations" },
] as const;

export function MasterNav() {
  const pathname = usePathname();

  return (
    <div
      className="shrink-0"
      style={{
        borderBottom: "1px solid var(--line-2)",
        background: "rgba(255,255,255,.6)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
      }}
    >
      <nav
        className="mx-auto flex items-center gap-1"
        style={{ maxWidth: 1480, padding: "8px 32px" }}
      >
        {NAV_ITEMS.map(({ label, href }) => {
          const isActive =
            href === "/" ? pathname === "/" : pathname.startsWith(href);

          return (
            <Link
              key={href}
              href={href}
              className="relative inline-flex items-center gap-2"
              style={{
                padding: "9px 16px",
                borderRadius: 11,
                fontSize: 13,
                fontWeight: 600,
                color: isActive ? "var(--ink)" : "var(--ink-4)",
                background: isActive ? "var(--surface)" : "transparent",
                border: isActive ? "1px solid var(--line)" : "1px solid transparent",
                boxShadow: isActive ? "var(--sh-1)" : "none",
                transition: "all .2s cubic-bezier(.34,1.56,.64,1)",
                textDecoration: "none",
              }}
            >
              {label}
              {isActive && (
                <span
                  style={{
                    position: "absolute",
                    left: 14,
                    right: 14,
                    bottom: -9,
                    height: 2,
                    borderRadius: 2,
                    background: "linear-gradient(90deg, var(--indigo), var(--purple))",
                    pointerEvents: "none",
                  }}
                />
              )}
            </Link>
          );
        })}

        <div style={{ flex: 1 }} />

        <Link
          href="/discover"
          className="inline-flex items-center gap-1.5"
          style={{
            padding: "7px 13px",
            background: "var(--ink)",
            borderRadius: 9,
            fontSize: 12,
            fontWeight: 600,
            color: "#fff",
            textDecoration: "none",
            transition: "opacity .15s ease",
          }}
        >
          <Plus size={12} />
          New Project
        </Link>
      </nav>
    </div>
  );
}
