import { NextResponse, type NextRequest } from "next/server";
import { createServiceClient } from "@/lib/db/server";

/**
 * GET /api/sync/all
 * Called nightly by Vercel cron (0 2 * * *).
 * Fires sequential syncs for each connected project to stay within 60s Hobby limit.
 * Vercel cron authenticates via CRON_SECRET header.
 */
export async function GET(request: NextRequest) {
  // Vercel sends Authorization: Bearer <CRON_SECRET> for cron invocations
  const authHeader = request.headers.get("Authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const supabase = createServiceClient();
  const baseUrl  = new URL(request.url).origin;

  // Fetch all live projects that have at least one active connection
  const { data: projects } = await supabase
    .from("projects")
    .select("id, mode")
    .eq("mode", "live")
    .is("deleted_at", null);

  const results: Record<string, unknown> = {};

  for (const project of projects ?? []) {
    const headers = {
      "Content-Type":  "application/json",
      "Authorization": `Bearer ${process.env.CRON_SECRET}`,
    };
    const body = JSON.stringify({ project_id: project.id });

    const [gscRes, ga4Res] = await Promise.allSettled([
      fetch(`${baseUrl}/api/sync/gsc`, { method: "POST", headers, body }),
      fetch(`${baseUrl}/api/sync/ga4`, { method: "POST", headers, body }),
    ]);

    results[project.id] = {
      gsc: gscRes.status === "fulfilled" ? await gscRes.value.json() : { error: String(gscRes.reason) },
      ga4: ga4Res.status === "fulfilled" ? await ga4Res.value.json() : { error: String(ga4Res.reason) },
    };
  }

  return NextResponse.json({ synced: Object.keys(results).length, results });
}
