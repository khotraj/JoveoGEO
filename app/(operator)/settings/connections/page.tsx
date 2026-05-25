import { createClient } from "@/lib/db/server";
import { ConnectionCard } from "@/components/connections/ConnectionCard";
import type { ConnectionStatus } from "@/components/connections/ConnectionCard";
import { triggerGscSync } from "@/app/actions/sync";

const BANFIELD_PROJECT_ID = "a0000000-0000-0000-0000-000000000001";

function deriveStatus(conn: {
  status: string | null;
  last_error: string | null;
} | null): ConnectionStatus {
  if (!conn) return "not_connected";
  if (conn.status === "connected" && !conn.last_error) return "connected";
  if (conn.status === "expired")  return "expired";
  if (conn.status === "error" || conn.last_error) return "error";
  if (conn.status === "connecting") return "connecting";
  return "not_connected";
}

export default async function ConnectionsPage() {
  const supabase = await createClient();

  type ConnRow = {
    provider: string;
    status: string | null;
    external_property_id: string | null;
    last_synced_at: string | null;
    last_error: string | null;
  };

  const { data: connectionsRaw } = await supabase
    .from("connections")
    .select("provider, status, external_property_id, last_synced_at, last_error")
    .eq("project_id", BANFIELD_PROJECT_ID);

  const connections = connectionsRaw as ConnRow[] | null;
  const gscConn = connections?.find((c) => c.provider === "gsc") ?? null;
  const ga4Conn = connections?.find((c) => c.provider === "ga4") ?? null;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold" style={{ color: "var(--ink)" }}>Connections</h1>
        <p className="text-sm mt-0.5" style={{ color: "var(--ink-4)" }}>
          Manage data source integrations for Banfield Pet Hospital.
        </p>
      </div>

      <div className="space-y-3">
        <ConnectionCard
          provider="gsc"
          label="Google Search Console"
          description="Organic clicks, impressions, queries, and page-level performance. Powers the Traffic → Human Lane."
          status={deriveStatus(gscConn)}
          propertyId={gscConn?.external_property_id ?? null}
          lastSyncedAt={gscConn?.last_synced_at ?? null}
          lastError={gscConn?.last_error ?? null}
          projectId={BANFIELD_PROJECT_ID}
          connectHref="/api/connect/gsc"
          onSync={triggerGscSync}
        />
        <ConnectionCard
          provider="ga4"
          label="Google Analytics 4"
          description="Session counts, conversion events, and traffic sources. Supplements GSC click data."
          status={deriveStatus(ga4Conn)}
          propertyId={ga4Conn?.external_property_id ?? null}
          lastSyncedAt={ga4Conn?.last_synced_at ?? null}
          lastError={ga4Conn?.last_error ?? null}
          projectId={BANFIELD_PROJECT_ID}
          connectHref="/api/connect/ga4"
        />
      </div>

      <div
        className="rounded-[var(--r-xl)] p-5"
        style={{ background: "var(--surface)", boxShadow: "var(--sh-1)" }}
      >
        <p className="text-xs font-semibold mb-1" style={{ color: "var(--ink-3)" }}>Coming in later slices</p>
        <p className="text-xs" style={{ color: "var(--ink-5)" }}>
          Rankscale API key · Ahrefs API key · Screaming Frog crawl upload
        </p>
      </div>
    </div>
  );
}
