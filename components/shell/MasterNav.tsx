"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, TrendingUp, Eye, Brain, ListChecks, Compass } from "lucide-react";

const NAV_ITEMS = [
  { label: "Overview", href: "/", icon: LayoutDashboard },
  { label: "Traffic", href: "/traffic", icon: TrendingUp },
  { label: "Visible-for", href: "/visible/1", icon: Eye },
  { label: "GEO", href: "/geo", icon: Brain },
  { label: "Recommendations", href: "/recommendations", icon: ListChecks },
  { label: "Discover", href: "/discover", icon: Compass },
] as const;

export function MasterNav() {
  const pathname = usePathname();

  return (
    <nav
      className="flex items-center gap-0.5 px-4 h-10 border-b shrink-0"
      style={{ background: "var(--surface)", borderColor: "var(--line)" }}
    >
      {NAV_ITEMS.map(({ label, href, icon: Icon }) => {
        const isActive =
          href === "/" ? pathname === "/" : pathname.startsWith(href);

        return (
          <Link
            key={href}
            href={href}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--r-sm)] text-xs font-medium transition-all duration-[250ms]"
            style={{
              color: isActive ? "var(--indigo)" : "var(--ink-4)",
              background: isActive ? "var(--indigo-tint)" : "transparent",
              fontWeight: isActive ? 600 : 500,
            }}
          >
            <Icon size={13} />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
