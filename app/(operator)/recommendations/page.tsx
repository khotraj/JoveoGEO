import { createClient } from "@/lib/db/server";
import { RecsClient } from "@/components/recommendations/RecsClient";

const BANFIELD_PROJECT_ID = "a0000000-0000-0000-0000-000000000001";

interface RecType {
  id: string;
  title: string;
  wave_number: 1 | 2 | 3;
  kind: string;
  status: "open" | "scheduled" | "in_progress" | "done" | "wontfix";
  impact_score: number;
  effort: "XS" | "S" | "M" | "L";
  page_url: string | null;
}

export default async function RecommendationsPage() {
  const supabase = await createClient();

  const { data: recsRaw } = await supabase
    .from("recommendations")
    .select("id, title, wave_number, kind, status, impact_score, effort, page_url")
    .eq("project_id", BANFIELD_PROJECT_ID)
    .order("impact_score", { ascending: false });

  const recs = (recsRaw as RecType[] | null) ?? [];

  const w1 = recs.filter((r) => r.wave_number === 1).length;
  const w2 = recs.filter((r) => r.wave_number === 2).length;
  const w3 = recs.filter((r) => r.wave_number === 3).length;

  return (
    <div className="p-6 space-y-4">
      <div>
        <h1 className="text-2xl font-bold mb-1" style={{ color: "var(--ink)" }}>
          Recommendations
        </h1>
        <p className="text-sm" style={{ color: "var(--ink-4)" }}>
          Banfield Pet Hospital · all waves
        </p>
      </div>

      <div
        className="px-4 py-3 rounded-[var(--r-lg)] text-xs font-mono"
        style={{ background: "var(--bg-2)", color: "var(--ink-4)" }}
      >
        {recs.length} total · {w1} Wave 1 · {w2} Wave 2 · {w3} Wave 3
      </div>

      <div
        className="rounded-[var(--r-xl)] p-4"
        style={{ background: "var(--surface)", boxShadow: "var(--sh-1)" }}
      >
        <RecsClient recs={recs} />
      </div>
    </div>
  );
}
