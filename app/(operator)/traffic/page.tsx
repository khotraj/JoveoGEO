import { createClient } from "@/lib/db/server";
import { HumanLane, BotLane } from "@/components/traffic/TwoLaneTraffic";
import { InsightsBand } from "@/components/traffic/InsightsBand";

const BANFIELD_PROJECT_ID = "a0000000-0000-0000-0000-000000000001";

type QueryRow   = { query: string; clicks: number; impressions: number; position: number };
type PageRow    = { page: string; clicks: number; impressions: number; position: number };
type DeviceRow  = { device: string; clicks: number };
type InsightRow = {
  id: string;
  category: string;
  title: string;
  body: string;
  projected_impact: string | null;
  added_to_tracker: boolean;
};

export default async function TrafficPage() {
  const supabase = await createClient();

  const [{ data: queriesRaw }, { data: pagesRaw }, { data: devicesRaw }, { data: insightsRaw }] =
    await Promise.all([
      supabase
        .from("gsc_queries_daily")
        .select("query, clicks, impressions, position")
        .eq("project_id", BANFIELD_PROJECT_ID)
        .order("clicks", { ascending: false })
        .limit(500),
      supabase
        .from("gsc_pages_daily")
        .select("page, clicks, impressions, position")
        .eq("project_id", BANFIELD_PROJECT_ID)
        .order("clicks", { ascending: false })
        .limit(50),
      supabase
        .from("gsc_queries_daily")
        .select("device, clicks")
        .eq("project_id", BANFIELD_PROJECT_ID),
      supabase
        .from("insights_band")
        .select("id, category, title, body, projected_impact, added_to_tracker")
        .eq("project_id", BANFIELD_PROJECT_ID)
        .order("created_at", { ascending: false })
        .limit(6),
    ]);

  const queries  = queriesRaw  as QueryRow[]   | null;
  const pages    = pagesRaw    as PageRow[]    | null;
  const devices  = devicesRaw  as DeviceRow[]  | null;
  const insights = insightsRaw as InsightRow[] | null;

  const hasGscData = queries && queries.length > 0;

  if (!hasGscData) {
    return (
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-xl font-bold" style={{ color: "var(--ink)" }}>Traffic</h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--ink-4)" }}>
            Banfield Pet Hospital · jobs.banfield.com
          </p>
        </div>
        <div
          className="rounded-[var(--r-xl)] p-8 text-center"
          style={{ background: "var(--surface)", boxShadow: "var(--sh-1)", border: "1px dashed var(--line-2)" }}
        >
          <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--indigo)" }}>
            No GSC data yet
          </span>
          <p className="text-sm mt-2" style={{ color: "var(--ink-4)" }}>
            Connect Google Search Console in{" "}
            <a href="/settings/connections" style={{ color: "var(--indigo)" }}>Settings → Connections</a>{" "}
            and trigger a sync.
          </p>
        </div>
      </div>
    );
  }

  // Aggregate query-level data into lane metrics
  let totalImpressions = 0, totalClicks = 0, positionSum = 0;
  const queryMap = new Map<string, { clicks: number; impressions: number; position: number }>();
  for (const row of queries!) {
    totalImpressions += row.impressions ?? 0;
    totalClicks      += row.clicks ?? 0;
    positionSum      += (row.position ?? 0) * (row.clicks ?? 0);

    const existing = queryMap.get(row.query) ?? { clicks: 0, impressions: 0, position: 0 };
    queryMap.set(row.query, {
      clicks:      existing.clicks + (row.clicks ?? 0),
      impressions: existing.impressions + (row.impressions ?? 0),
      position:    row.position ?? existing.position,
    });
  }

  const topQueries = Array.from(queryMap.entries())
    .map(([query, v]) => ({ query, ...v }))
    .sort((a, b) => b.clicks - a.clicks)
    .slice(0, 8);

  // Device breakdown
  const deviceMap = new Map<string, number>();
  for (const row of devices ?? []) {
    const dev = (row.device ?? "UNKNOWN").toUpperCase();
    deviceMap.set(dev, (deviceMap.get(dev) ?? 0) + (row.clicks ?? 0));
  }
  const deviceBreakdown = Array.from(deviceMap.entries()).map(([device, clicks]) => ({ device, clicks }));

  const humanData = {
    impressions:     totalImpressions,
    clicks:          totalClicks,
    avgPosition:     totalClicks > 0 ? positionSum / totalClicks : 0,
    ctr:             totalImpressions > 0 ? totalClicks / totalImpressions : 0,
    topQueries,
    topPages: (pages ?? []).map((p) => ({ page: p.page, clicks: p.clicks ?? 0, position: p.position ?? 0 })),
    deviceBreakdown,
  };

  const insightRows = (insights ?? []).map((i) => ({
    id:                i.id,
    category:          i.category as "seasonal" | "quick_win" | "competitor" | "content_gap",
    title:             i.title,
    body:              i.body,
    projected_impact:  i.projected_impact ?? null,
    added_to_tracker:  i.added_to_tracker ?? false,
  }));

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold" style={{ color: "var(--ink)" }}>Traffic</h1>
        <p className="text-sm mt-0.5" style={{ color: "var(--ink-4)" }}>
          Banfield Pet Hospital · jobs.banfield.com
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <HumanLane data={humanData} />
        <BotLane />
      </div>

      {insightRows.length > 0 && (
        <InsightsBand projectId={BANFIELD_PROJECT_ID} insights={insightRows} />
      )}
    </div>
  );
}
