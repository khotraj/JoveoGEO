"use client";

import { CheckCircle2, AlertCircle, Clock, Link2, RefreshCw } from "lucide-react";
import { formatDate } from "@/lib/utils/dates";
import { useState, useTransition } from "react";

export type ConnectionStatus = "not_connected" | "connecting" | "connected" | "error" | "expired";

interface ConnectionCardProps {
  provider:       "gsc" | "ga4";
  label:          string;
  description:    string;
  status:         ConnectionStatus;
  propertyId?:    string | null;
  lastSyncedAt?:  string | null;
  lastError?:     string | null;
  projectId:      string;
  connectHref:    string;
  onSync?:        (projectId: string) => Promise<{ ok: boolean; error?: string; queries?: number; pages?: number }>;
}

const STATUS_CONFIG = {
  not_connected: { icon: Link2,        color: "var(--ink-5)", label: "Not connected" },
  connecting:    { icon: Clock,        color: "var(--amber)", label: "Connecting…" },
  connected:     { icon: CheckCircle2, color: "var(--green)", label: "Connected" },
  error:         { icon: AlertCircle,  color: "var(--red)",   label: "Error" },
  expired:       { icon: AlertCircle,  color: "var(--amber)", label: "Token expired" },
} as const;

export function ConnectionCard({
  provider, label, description, status, propertyId, lastSyncedAt,
  lastError, projectId, connectHref, onSync,
}: ConnectionCardProps) {
  const cfg         = STATUS_CONFIG[status];
  const Icon        = cfg.icon;
  const isConnected = status === "connected";
  const needsReauth = status === "expired" || status === "error";

  const [syncMsg, setSyncMsg]         = useState<string | null>(null);
  const [syncError, setSyncError]     = useState<string | null>(null);
  const [isPending, startTransition]  = useTransition();

  function handleSync() {
    if (!onSync) return;
    setSyncMsg(null);
    setSyncError(null);
    startTransition(async () => {
      const res = await onSync(projectId);
      if (res.ok) {
        setSyncMsg(`Synced — ${res.queries} queries, ${res.pages} pages`);
      } else {
        setSyncError(res.error ?? "Sync failed");
      }
    });
  }

  return (
    <div
      style={{
        background: "var(--surface)",
        boxShadow:  "var(--sh-1)",
        border:     isConnected ? "1px solid var(--green-tint)" : "1px solid var(--line)",
        borderRadius: "var(--r-xl)",
        padding: 20,
      }}
      data-testid={`connection-card-${provider}`}
    >
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)" }}>{label}</span>
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <Icon size={12} style={{ color: cfg.color }} />
              <span style={{ fontSize: 12, color: cfg.color }} data-testid={`${provider}-status`}>{cfg.label}</span>
            </div>
          </div>
          <p style={{ fontSize: 12, color: "var(--ink-4)", margin: 0 }}>{description}</p>

          {propertyId && (
            <p style={{ fontSize: 11, marginTop: 4, fontFamily: "var(--font-jetbrains, monospace)", color: "var(--ink-3)" }}>{propertyId}</p>
          )}
          {lastSyncedAt && (
            <p style={{ fontSize: 11, marginTop: 4, color: "var(--ink-5)" }} data-testid={`${provider}-last-sync`}>
              Last synced: {formatDate(lastSyncedAt)}
            </p>
          )}
          {(lastError && !syncError) && (
            <p style={{ fontSize: 11, marginTop: 4, padding: "4px 8px", borderRadius: 6, color: "var(--red)", background: "var(--red-tint)" }}>{lastError}</p>
          )}
          {syncError && (
            <p style={{ fontSize: 11, marginTop: 4, padding: "4px 8px", borderRadius: 6, color: "var(--red)", background: "var(--red-tint)" }}>{syncError}</p>
          )}
          {syncMsg && (
            <p style={{ fontSize: 11, marginTop: 4, padding: "4px 8px", borderRadius: 6, color: "var(--green)", background: "var(--green-tint)" }}>{syncMsg}</p>
          )}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          {isConnected && onSync && (
            <button
              onClick={handleSync}
              disabled={isPending}
              style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                padding: "6px 11px", fontSize: 12, fontWeight: 500,
                background: "var(--surface)", border: "1px solid var(--line)",
                borderRadius: 9, color: "var(--ink-2)", cursor: isPending ? "not-allowed" : "pointer",
                opacity: isPending ? 0.6 : 1,
              }}
            >
              <RefreshCw size={12} style={{ animation: isPending ? "spin 1s linear infinite" : "none" }} />
              {isPending ? "Syncing…" : "Sync Now"}
            </button>
          )}
          <a
            href={`${connectHref}?project_id=${projectId}`}
            style={{
              display: "inline-flex", alignItems: "center",
              padding: "6px 11px", fontSize: 12, fontWeight: 600,
              background:    isConnected ? "var(--bg-2)" : "linear-gradient(135deg, var(--indigo), var(--purple))",
              color:         isConnected ? "var(--ink-3)" : "white",
              border:        isConnected ? "1px solid var(--line)" : "none",
              borderRadius:  9,
              textDecoration: "none",
            }}
          >
            {isConnected ? "Reconnect" : needsReauth ? "Re-authenticate" : `Connect ${label}`}
          </a>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
