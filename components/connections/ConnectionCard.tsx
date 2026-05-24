"use client";

import { CheckCircle2, AlertCircle, Clock, Link2 } from "lucide-react";
import { formatDate } from "@/lib/utils/dates";

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
}

const STATUS_CONFIG = {
  not_connected: { icon: Link2,          color: "var(--ink-5)", label: "Not connected" },
  connecting:    { icon: Clock,          color: "var(--amber)", label: "Connecting…" },
  connected:     { icon: CheckCircle2,   color: "var(--green)", label: "Connected" },
  error:         { icon: AlertCircle,    color: "var(--red)",   label: "Error" },
  expired:       { icon: AlertCircle,    color: "var(--amber)", label: "Token expired" },
} as const;

export function ConnectionCard({
  provider,
  label,
  description,
  status,
  propertyId,
  lastSyncedAt,
  lastError,
  projectId,
  connectHref,
}: ConnectionCardProps) {
  const cfg  = STATUS_CONFIG[status];
  const Icon = cfg.icon;
  const isConnected = status === "connected";
  const needsReauth = status === "expired" || status === "error";

  return (
    <div
      className="rounded-[var(--r-xl)] p-5"
      style={{
        background:  "var(--surface)",
        boxShadow:   "var(--sh-1)",
        border:      isConnected ? "1px solid var(--green-tint)" : "1px solid var(--line)",
      }}
      data-testid={`connection-card-${provider}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-semibold" style={{ color: "var(--ink)" }}>{label}</span>
            <div className="flex items-center gap-1">
              <Icon size={12} style={{ color: cfg.color }} />
              <span className="text-xs" style={{ color: cfg.color }} data-testid={`${provider}-status`}>
                {cfg.label}
              </span>
            </div>
          </div>
          <p className="text-xs" style={{ color: "var(--ink-4)" }}>{description}</p>

          {propertyId && (
            <p className="text-xs mt-1 font-mono" style={{ color: "var(--ink-3)" }}>
              {propertyId}
            </p>
          )}
          {lastSyncedAt && (
            <p className="text-xs mt-1" style={{ color: "var(--ink-5)" }} data-testid={`${provider}-last-sync`}>
              Last synced: {formatDate(lastSyncedAt)}
            </p>
          )}
          {lastError && (
            <p
              className="text-xs mt-1 px-2 py-1 rounded-[var(--r-sm)]"
              style={{ color: "var(--red)", background: "var(--red-tint)" }}
            >
              {lastError}
            </p>
          )}
        </div>

        <a
          href={`${connectHref}?project_id=${projectId}`}
          className="shrink-0 text-xs font-semibold px-3 py-1.5 rounded-[var(--r-md)] transition-opacity hover:opacity-80"
          style={{
            background: isConnected ? "var(--bg-2)" : "linear-gradient(135deg, var(--indigo), var(--purple))",
            color:      isConnected ? "var(--ink-3)" : "white",
            border:     isConnected ? "1px solid var(--line)" : "none",
          }}
        >
          {isConnected ? "Reconnect" : needsReauth ? "Re-authenticate" : `Connect ${label}`}
        </a>
      </div>
    </div>
  );
}
