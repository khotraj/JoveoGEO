"use client";

import { useState } from "react";
import { FilterBar } from "./FilterBar";
import { RecRow } from "./RecRow";

interface Rec {
  id: string;
  title: string;
  wave_number: 1 | 2 | 3;
  kind: string;
  status: "open" | "scheduled" | "in_progress" | "done" | "wontfix";
  impact_score: number;
  effort: "XS" | "S" | "M" | "L";
  page_url: string | null;
}

interface RecsClientProps {
  recs: Rec[];
}

export function RecsClient({ recs }: RecsClientProps) {
  const [wave, setWave] = useState("all");
  const [status, setStatus] = useState("all");

  const filtered = recs
    .filter((r) => wave === "all" || r.wave_number === Number(wave))
    .filter((r) => status === "all" || r.status === status)
    .sort((a, b) => b.impact_score - a.impact_score);

  const n = filtered.length;

  return (
    <div>
      <FilterBar wave={wave} status={status} onWave={setWave} onStatus={setStatus} />

      <p className="text-xs my-2" style={{ color: "var(--ink-4)" }}>
        {n} recommendation{n !== 1 ? "s" : ""}
      </p>

      {filtered.length === 0 ? (
        <div className="text-xs py-4" style={{ color: "var(--ink-4)" }}>
          No recommendations match your filters.
        </div>
      ) : (
        <div className="flex flex-col">
          {filtered.map((rec) => (
            <RecRow
              key={rec.id}
              id={rec.id}
              title={rec.title}
              waveNumber={rec.wave_number}
              kind={rec.kind}
              status={rec.status}
              impactScore={rec.impact_score}
              effort={rec.effort}
              pageUrl={rec.page_url}
              href={`/recommendations/${rec.id}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
