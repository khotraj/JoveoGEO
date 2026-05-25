"use server";

import { createClient, createServiceClient } from "@/lib/db/server";
import { syncQueries, syncPages } from "@/lib/sources/gsc";
import { dateRange } from "@/lib/utils/dates";

export async function triggerGscSync(projectId: string): Promise<{ ok: true; queries: number; pages: number } | { ok: false; error: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not authenticated" };

  const service = createServiceClient();

  const { data: conn } = await service
    .from("connections")
    .select("external_property_id, status")
    .eq("project_id", projectId)
    .eq("provider", "gsc")
    .single();

  if (!conn?.external_property_id) return { ok: false, error: "GSC not connected for this project" };
  if (conn.status === "expired")   return { ok: false, error: "GSC token expired — reconnect first" };

  try {
    const { from, to } = dateRange(30);
    const [q, p] = await Promise.all([
      syncQueries(projectId, conn.external_property_id, from, to),
      syncPages(projectId, conn.external_property_id, from, to),
    ]);
    await service.from("projects").update({ last_synced_at: new Date().toISOString() }).eq("id", projectId);
    return { ok: true, queries: q.rows, pages: p.rows };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    await service.from("connections").update({ last_error: msg }).eq("project_id", projectId).eq("provider", "gsc");
    return { ok: false, error: msg };
  }
}
