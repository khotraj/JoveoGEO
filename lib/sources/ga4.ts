/**
 * Google Analytics 4 sync library.
 * Uses GA4 Data API v1beta via raw fetch + Bearer token.
 * Property ID is stored in connections.external_property_id as the numeric ID.
 */
import { createServiceClient } from "@/lib/db/server";
import { getAccessToken } from "@/lib/sources/oauth";

const GA4_BASE = "https://analyticsdata.googleapis.com/v1beta";

// ─── Sessions ─────────────────────────────────────────────────────────────────
export async function syncSessions(
  projectId: string,
  propertyId: string,   // numeric, e.g. "517390332"
  from: string,
  to: string,
): Promise<{ rows: number }> {
  const token    = await getAccessToken(projectId, "ga4");
  const supabase = createServiceClient();

  const res = await fetch(`${GA4_BASE}/properties/${propertyId}:runReport`, {
    method: "POST",
    headers: {
      Authorization:  `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      dateRanges: [{ startDate: from, endDate: to }],
      dimensions: [
        { name: "date" },
        { name: "sessionSource" },
        { name: "sessionMedium" },
        { name: "sessionCampaignName" },
      ],
      metrics: [
        { name: "sessions" },
        { name: "newUsers" },
        { name: "totalUsers" },
        { name: "averageSessionDuration" },
        { name: "bounceRate" },
      ],
      limit: 10_000,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`GA4 sessions API ${res.status}: ${err}`);
  }

  const data = await res.json();
  if (!data.rows?.length) return { rows: 0 };

  // Map dimension/metric headers to named fields
  const dimHeaders = (data.dimensionHeaders as Array<{ name: string }>).map((h) => h.name);
  const metHeaders = (data.metricHeaders as Array<{ name: string }>).map((h) => h.name);

  const idx = (arr: string[], name: string) => arr.indexOf(name);
  const di = {
    date:     idx(dimHeaders, "date"),
    source:   idx(dimHeaders, "sessionSource"),
    medium:   idx(dimHeaders, "sessionMedium"),
    campaign: idx(dimHeaders, "sessionCampaignName"),
  };
  const mi = {
    sessions:   idx(metHeaders, "sessions"),
    newUsers:   idx(metHeaders, "newUsers"),
    totalUsers: idx(metHeaders, "totalUsers"),
    duration:   idx(metHeaders, "averageSessionDuration"),
    bounce:     idx(metHeaders, "bounceRate"),
  };

  const records = (data.rows as Array<{
    dimensionValues: Array<{ value: string }>;
    metricValues: Array<{ value: string }>;
  }>).map((row) => {
    const d = row.dimensionValues;
    const m = row.metricValues;
    // GA4 returns dates as YYYYMMDD
    const rawDate = d[di.date].value;
    const date = `${rawDate.slice(0, 4)}-${rawDate.slice(4, 6)}-${rawDate.slice(6, 8)}`;
    const campaign = d[di.campaign].value;
    return {
      project_id:              projectId,
      date,
      sessions:                parseInt(m[mi.sessions].value, 10),
      users:                   parseInt(m[mi.totalUsers].value, 10),
      new_users:               parseInt(m[mi.newUsers].value, 10),
      engagement_time_avg_sec: parseFloat(m[mi.duration].value),
      bounce_rate:             parseFloat(m[mi.bounce].value),
      source:                  d[di.source].value || "(direct)",
      medium:                  d[di.medium].value || "(none)",
      campaign:                campaign === "(not set)" ? null : campaign,
    };
  });

  const { error } = await supabase
    .from("ga4_sessions_daily")
    .upsert(records, {
      onConflict: "project_id,date,source,medium,campaign",
      ignoreDuplicates: false,
    });

  if (error) throw new Error(`GA4 sessions upsert: ${error.message}`);

  await supabase
    .from("connections")
    .update({ last_synced_at: new Date().toISOString(), last_error: null })
    .eq("project_id", projectId)
    .eq("provider", "ga4");

  return { rows: records.length };
}

// ─── Conversions ──────────────────────────────────────────────────────────────
export async function syncConversions(
  projectId: string,
  propertyId: string,
  from: string,
  to: string,
): Promise<{ rows: number }> {
  const token    = await getAccessToken(projectId, "ga4");
  const supabase = createServiceClient();

  const res = await fetch(`${GA4_BASE}/properties/${propertyId}:runReport`, {
    method: "POST",
    headers: {
      Authorization:  `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      dateRanges: [{ startDate: from, endDate: to }],
      dimensions: [{ name: "date" }, { name: "eventName" }],
      metrics:    [{ name: "eventCount" }],
      dimensionFilter: {
        filter: {
          fieldName:     "eventName",
          inListFilter:  { values: ["apply_start", "apply_complete", "job_view", "generate_lead"] },
        },
      },
      limit: 5_000,
    }),
  });

  if (!res.ok) return { rows: 0 }; // conversions may not be configured — non-fatal
  const data = await res.json();
  if (!data.rows?.length) return { rows: 0 };

  const records = (data.rows as Array<{
    dimensionValues: Array<{ value: string }>;
    metricValues:    Array<{ value: string }>;
  }>).map((row) => {
    const rawDate = row.dimensionValues[0].value;
    const date    = `${rawDate.slice(0, 4)}-${rawDate.slice(4, 6)}-${rawDate.slice(6, 8)}`;
    return {
      project_id:  projectId,
      date,
      event_name:  row.dimensionValues[1].value,
      count:       parseInt(row.metricValues[0].value, 10),
    };
  });

  const { error } = await supabase
    .from("ga4_conversions_daily")
    .upsert(records, { onConflict: "project_id,date,event_name", ignoreDuplicates: false });

  if (error) throw new Error(`GA4 conversions upsert: ${error.message}`);
  return { rows: records.length };
}

// ─── Property list (for the connection picker UI) ─────────────────────────────
export async function listGA4Properties(accessToken: string): Promise<Array<{
  name: string;       // "properties/517390332"
  displayName: string;
  websiteUri: string;
}>> {
  const res = await fetch(
    "https://analyticsadmin.googleapis.com/v1beta/properties?filter=parent:accounts/-",
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );
  if (!res.ok) return [];
  const data = await res.json();
  return (data.properties ?? []) as Array<{ name: string; displayName: string; websiteUri: string }>;
}
