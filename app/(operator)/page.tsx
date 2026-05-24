import { createClient } from "@/lib/db/server";
import { KpiStrip, type KpiData } from "@/components/overview/KpiStrip";

const BANFIELD_PROJECT_ID = "a0000000-0000-0000-0000-000000000001";
const BRANDED_TERM        = "banfield";
const DEFAULT_VET_CPC     = 4.5;

export default async function OverviewPage() {
  const supabase = await createClient();

  // Aggregate GSC clicks for last 30 days
  const { data: queryAggRaw } = await supabase
    .from("gsc_queries_daily")
    .select("query, clicks")
    .eq("project_id", BANFIELD_PROJECT_ID);

  const queryAgg = queryAggRaw as Array<{ query: string; clicks: number }> | null;
  const hasData = queryAgg && queryAgg.length > 0;

  let kpi: KpiData = {
    organicVisits:      0,
    aiVisibility:       null,
    brandedPct:         0,
    unbrandedPct:       0,
    paidEquivalentLeak: 0,
  };

  if (hasData) {
    let branded = 0, unbranded = 0;
    for (const row of queryAgg) {
      const clicks = row.clicks ?? 0;
      if (row.query?.toLowerCase().includes(BRANDED_TERM)) branded += clicks;
      else unbranded += clicks;
    }
    const total = branded + unbranded;
    kpi = {
      organicVisits:      total,
      aiVisibility:       null,
      brandedPct:         total > 0 ? (branded / total) * 100 : 0,
      unbrandedPct:       total > 0 ? (unbranded / total) * 100 : 0,
      paidEquivalentLeak: total * DEFAULT_VET_CPC,
    };
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold" style={{ color: "var(--ink)" }}>
          Overview
        </h1>
        <p className="text-sm mt-0.5" style={{ color: "var(--ink-4)" }}>
          Banfield Pet Hospital · jobs.banfield.com
        </p>
      </div>

      {hasData ? (
        <KpiStrip data={kpi} />
      ) : (
        <div
          className="rounded-[var(--r-xl)] p-8 text-center"
          style={{ background: "var(--surface)", boxShadow: "var(--sh-1)", border: "1px dashed var(--line-2)" }}
        >
          <span
            className="text-xs font-semibold uppercase tracking-widest"
            style={{ color: "var(--indigo)" }}
          >
            No GSC data yet
          </span>
          <p className="text-sm mt-2" style={{ color: "var(--ink-4)" }}>
            Connect Google Search Console in{" "}
            <a href="/settings/connections" style={{ color: "var(--indigo)" }}>
              Settings → Connections
            </a>{" "}
            and trigger a sync.
          </p>
        </div>
      )}

      <div
        className="rounded-[var(--r-xl)] p-5"
        style={{ background: "var(--surface)", boxShadow: "var(--sh-1)" }}
      >
        <p className="text-xs font-semibold mb-1" style={{ color: "var(--ink-3)" }}>
          Coming in Slice 3
        </p>
        <p className="text-xs" style={{ color: "var(--ink-5)" }}>
          Three abstraction cards (Traffic / Visible-for / GEO) with quick numbers + Snapshot column.
        </p>
      </div>
    </div>
  );
}
