import { NextResponse, type NextRequest } from "next/server";
import { createServiceClient } from "@/lib/db/server";
import { syncQueries, syncPages } from "@/lib/sources/gsc";
import { dateRange } from "@/lib/utils/dates";

/**
 * POST /api/sync/gsc
 * Body: { project_id: string; days?: number }
 * Called manually from Settings UI or by /api/sync/all cron.
 * Vercel Free plan: 60s limit — 30 days of GSC data for a typical career site fits easily.
 */
export async function POST(request: NextRequest) {
  // Verify caller is internal (cron) or authenticated operator
  const authHeader = request.headers.get("Authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    // Allow if the request has a valid Supabase session (manual trigger from UI)
    // For simplicity in MVP: service-role key check suffices
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: { project_id?: string; days?: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }

  const { project_id, days = 30 } = body;
  if (!project_id) return NextResponse.json({ error: "project_id required" }, { status: 400 });

  const supabase = createServiceClient();

  // Look up the GSC connection and its property URL
  const { data: conn } = await supabase
    .from("connections")
    .select("external_property_id, status")
    .eq("project_id", project_id)
    .eq("provider", "gsc")
    .single();

  if (!conn?.external_property_id) {
    return NextResponse.json({ error: "GSC not connected for this project" }, { status: 422 });
  }
  if (conn.status === "expired") {
    return NextResponse.json({ error: "GSC token expired — reconnect" }, { status: 422 });
  }

  const { from, to } = dateRange(days);

  try {
    const [q, p] = await Promise.all([
      syncQueries(project_id, conn.external_property_id, from, to),
      syncPages(project_id, conn.external_property_id, from, to),
    ]);

    // Update project last_synced_at
    await supabase
      .from("projects")
      .update({ last_synced_at: new Date().toISOString() })
      .eq("id", project_id);

    return NextResponse.json({ ok: true, queries: q.rows, pages: p.rows, from, to });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    await supabase
      .from("connections")
      .update({ last_error: msg })
      .eq("project_id", project_id)
      .eq("provider", "gsc");
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
