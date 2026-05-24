"use client";

import { useState } from "react";
import { Plus, Sparkles, TrendingUp, Calendar, Users, Search } from "lucide-react";

interface Insight {
  id?:              string;
  category:         "seasonal" | "quick_win" | "competitor" | "content_gap";
  title:            string;
  body:             string;
  projected_impact?: string | null;
  added_to_tracker?: boolean;
}

const CATEGORY_META = {
  seasonal:     { label: "Seasonal",     color: "var(--cyan)",   icon: Calendar },
  quick_win:    { label: "Quick Win",    color: "var(--green)",  icon: TrendingUp },
  competitor:   { label: "Competitor",   color: "var(--amber)",  icon: Users },
  content_gap:  { label: "Content Gap",  color: "var(--indigo)", icon: Search },
} as const;

interface InsightCardProps {
  insight:    Insight;
  projectId:  string;
  onTracked:  (id: string) => void;
}

function InsightCard({ insight, projectId, onTracked }: InsightCardProps) {
  const [adding, setAdding] = useState(false);
  const meta = CATEGORY_META[insight.category];
  const Icon = meta.icon;

  async function addToTracker() {
    setAdding(true);
    try {
      const res = await fetch("/api/recommendations/from-insight", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ insight_id: insight.id, project_id: projectId }),
      });
      if (res.ok && insight.id) onTracked(insight.id);
    } finally {
      setAdding(false);
    }
  }

  return (
    <div
      className="flex-1 min-w-[240px] rounded-[var(--r-lg)] p-4 flex flex-col gap-3"
      style={{ background: "var(--surface)", boxShadow: "var(--sh-1)" }}
      data-testid="insight-card"
    >
      <div className="flex items-center gap-2">
        <div
          className="w-6 h-6 rounded-[var(--r-sm)] flex items-center justify-center shrink-0"
          style={{ background: meta.color + "18", color: meta.color }}
        >
          <Icon size={12} />
        </div>
        <span
          className="text-[10.5px] font-bold uppercase tracking-[.06em]"
          style={{ color: meta.color }}
        >
          {meta.label}
        </span>
      </div>

      <div>
        <p className="text-[13px] font-semibold leading-snug mb-1" style={{ color: "var(--ink)" }}>
          {insight.title}
        </p>
        <p className="text-xs leading-relaxed" style={{ color: "var(--ink-3)" }}>
          {insight.body}
        </p>
      </div>

      {insight.projected_impact && (
        <div
          className="text-xs font-medium px-2 py-1 rounded-[var(--r-sm)] self-start"
          style={{ background: "var(--green-tint)", color: "var(--green)" }}
        >
          {insight.projected_impact}
        </div>
      )}

      <div className="mt-auto">
        {insight.added_to_tracker ? (
          <span className="text-xs" style={{ color: "var(--ink-5)" }}>Added to tracker</span>
        ) : (
          <button
            onClick={addToTracker}
            disabled={adding}
            className="flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-[var(--r-sm)] transition-colors hover:bg-[var(--indigo-tint)]"
            style={{ color: "var(--indigo)", border: "1px solid var(--indigo-tint)" }}
          >
            <Plus size={11} />
            {adding ? "Adding…" : "Add to tracker"}
          </button>
        )}
      </div>
    </div>
  );
}

interface InsightsBandProps {
  projectId: string;
  insights:  Insight[];
}

export function InsightsBand({ projectId, insights: initialInsights }: InsightsBandProps) {
  const [insights, setInsights] = useState(initialInsights);

  function handleTracked(id: string) {
    setInsights((prev) =>
      prev.map((i) => (i.id === id ? { ...i, added_to_tracker: true } : i)),
    );
  }

  if (insights.length === 0) return null;

  return (
    <section>
      <div className="flex items-center gap-2 mb-3">
        <Sparkles size={13} style={{ color: "var(--indigo)" }} />
        <span className="label-sm">Insights</span>
        <span className="text-xs" style={{ color: "var(--ink-5)" }}>AI-generated from GSC · today</span>
      </div>
      <div className="flex gap-3 flex-wrap" data-testid="insights-band">
        {insights.map((insight, i) => (
          <InsightCard
            key={insight.id ?? i}
            insight={insight}
            projectId={projectId}
            onTracked={handleTracked}
          />
        ))}
      </div>
    </section>
  );
}
