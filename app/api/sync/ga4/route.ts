import { NextResponse, type NextRequest } from "next/server";
import { createServiceClient } from "@/lib/db/server";
import { syncSessions, syncConversions } from "@/lib/sources/ga4";
import { dateRange } from "@/lib/utils/dates";

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("Authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
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

  const { data: conn } = await supabase
    .from("connections")
    .select("external_property_id, status")
    .eq("project_id", project_id)
    .eq("provider", "ga4")
    .single();

  if (!conn?.external_property_id) {
    return NextResponse.json({ error: "GA4 not connected for this project" }, { status: 422 });
  }

  const { from, to } = dateRange(days);

  try {
    const [s, c] = await Promise.all([
      syncSessions(project_id, conn.external_property_id, from, to),
      syncConversions(project_id, conn.external_property_id, from, to),
    ]);

    return NextResponse.json({ ok: true, sessions: s.rows, conversions: c.rows, from, to });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    await supabase
      .from("connections")
      .update({ last_error: msg })
      .eq("project_id", project_id)
      .eq("provider", "ga4");
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
