/**
 * Google Search Console sync library.
 * All writes use the service-role client — never exposed to the browser.
 * Uses raw fetch (no googleapis bundle) + Bearer token auth.
 */
import { createServiceClient } from "@/lib/db/server";
import { getAccessToken } from "@/lib/sources/oauth";

// GSC API base — site URL must be URL-encoded in the path
const GSC_BASE = "https://www.googleapis.com/webmasters/v3";

// GSC returns max 25 000 rows per request
const MAX_ROWS = 25_000;

// ─── Queries (keywords) ───────────────────────────────────────────────────────
export async function syncQueries(
  projectId: string,
  siteUrl: string,
  from: string,
  to: string,
): Promise<{ rows: number }> {
  const token       = await getAccessToken(projectId, "gsc");
  const encodedSite = encodeURIComponent(siteUrl);
  const supabase    = createServiceClient();

  let total = 0;
  let startRow = 0;

  while (true) {
    const res = await fetch(
      `${GSC_BASE}/sites/${encodedSite}/searchAnalytics/query`,
      {
        method: "POST",
        headers: {
          Authorization:  `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          startDate:  from,
          endDate:    to,
          dimensions: ["query", "device", "country", "page"],
          rowLimit:   MAX_ROWS,
          startRow,
        }),
      },
    );

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`GSC queries API ${res.status}: ${err}`);
    }

    const data = await res.json();
    const rows: Array<{
      keys: [string, string, string, string];
      impressions: number;
      clicks: number;
      ctr: number;
      position: number;
    }> = data.rows ?? [];

    if (rows.length === 0) break;

    const records = rows.map((r) => ({
      project_id:  projectId,
      date:        to,           // GSC aggregates over range; use end date as the record date
      query:       r.keys[0],
      device:      r.keys[1],
      country:     r.keys[2],
      page:        r.keys[3] ?? null,
      impressions: r.impressions,
      clicks:      r.clicks,
      ctr:         r.ctr,
      position:    r.position,
    }));

    const { error } = await supabase
      .from("gsc_queries_daily")
      .upsert(records, {
        onConflict: "project_id,date,query,device,country,page",
        ignoreDuplicates: false,
      });

    if (error) throw new Error(`GSC queries upsert: ${error.message}`);

    total += rows.length;
    if (rows.length < MAX_ROWS) break;
    startRow += MAX_ROWS;
  }

  // Update connection last_synced_at
  await supabase
    .from("connections")
    .update({ last_synced_at: new Date().toISOString(), last_error: null })
    .eq("project_id", projectId)
    .eq("provider", "gsc");

  return { rows: total };
}

// ─── Pages ────────────────────────────────────────────────────────────────────
export async function syncPages(
  projectId: string,
  siteUrl: string,
  from: string,
  to: string,
): Promise<{ rows: number }> {
  const token       = await getAccessToken(projectId, "gsc");
  const encodedSite = encodeURIComponent(siteUrl);
  const supabase    = createServiceClient();

  const res = await fetch(
    `${GSC_BASE}/sites/${encodedSite}/searchAnalytics/query`,
    {
      method: "POST",
      headers: {
        Authorization:  `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        startDate:  from,
        endDate:    to,
        dimensions: ["page"],
        rowLimit:   5_000,
        startRow:   0,
      }),
    },
  );

  if (!res.ok) throw new Error(`GSC pages API ${res.status}`);
  const data = await res.json();
  const rows: Array<{
    keys: [string];
    impressions: number;
    clicks: number;
    ctr: number;
    position: number;
  }> = data.rows ?? [];

  if (rows.length === 0) return { rows: 0 };

  const records = rows.map((r) => ({
    project_id:  projectId,
    date:        to,
    page:        r.keys[0],
    impressions: r.impressions,
    clicks:      r.clicks,
    ctr:         r.ctr,
    position:    r.position,
  }));

  const { error } = await supabase
    .from("gsc_pages_daily")
    .upsert(records, { onConflict: "project_id,date,page", ignoreDuplicates: false });

  if (error) throw new Error(`GSC pages upsert: ${error.message}`);

  return { rows: rows.length };
}

// ─── Property list (for the connection picker UI) ─────────────────────────────
export async function listProperties(accessToken: string): Promise<Array<{ siteUrl: string; permissionLevel: string }>> {
  const res = await fetch(`${GSC_BASE}/sites`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error(`GSC sites list ${res.status}`);
  const data = await res.json();
  return (data.siteEntry ?? []) as Array<{ siteUrl: string; permissionLevel: string }>;
}
