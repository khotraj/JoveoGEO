import { Monitor, Bot, Search, MousePointerClick, Eye } from "lucide-react";

interface HumanLaneData {
  impressions:     number;
  clicks:          number;
  avgPosition:     number;
  ctr:             number;
  topQueries:      Array<{ query: string; clicks: number; impressions: number; position: number }>;
  topPages:        Array<{ page: string; clicks: number; position: number }>;
  deviceBreakdown: Array<{ device: string; clicks: number }>;
}

function MetricPill({
  icon,
  label,
  value,
}: {
  icon:  React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div
      className="flex items-center gap-2 px-3 py-2.5 rounded-[var(--r-md)]"
      style={{ background: "var(--bg-2)", border: "1px solid var(--line-2)" }}
    >
      <span style={{ color: "var(--ink-4)" }}>{icon}</span>
      <div>
        <div className="font-mono text-base font-bold leading-none" style={{ color: "var(--ink)" }}>
          {value}
        </div>
        <div className="text-[10.5px] mt-0.5 label-sm">{label}</div>
      </div>
    </div>
  );
}

function fmtNum(n: number) {
  return n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}M`
       : n >= 1_000     ? `${(n / 1_000).toFixed(1)}k`
       : String(n);
}

function shortenUrl(url: string) {
  try { return new URL(url).pathname; } catch { return url; }
}

export function HumanLane({ data }: { data: HumanLaneData }) {
  return (
    <div
      className="rounded-[var(--r-xl)] p-5"
      style={{ background: "var(--surface)", boxShadow: "var(--sh-1)" }}
      data-testid="lane-human"
    >
      <div className="flex items-center gap-2 mb-4">
        <Monitor size={14} style={{ color: "var(--indigo)" }} />
        <span className="text-sm font-semibold" style={{ color: "var(--ink)" }}>Human Traffic</span>
        <span className="label-sm ml-auto">GSC · last 30 days</span>
      </div>

      {/* Metric pills */}
      <div className="flex gap-2 flex-wrap mb-5">
        <MetricPill icon={<Eye size={13} />}             label="Impressions" value={fmtNum(data.impressions)} />
        <MetricPill icon={<MousePointerClick size={13} />} label="Clicks"     value={fmtNum(data.clicks)} />
        <MetricPill icon={<Search size={13} />}           label="Avg Position" value={data.avgPosition.toFixed(1)} />
        <MetricPill icon={<span className="text-xs font-mono">%</span>} label="CTR" value={`${(data.ctr * 100).toFixed(2)}%`} />
      </div>

      <div className="grid grid-cols-2 gap-5">
        {/* Top queries */}
        <div>
          <p className="label-sm mb-2">Top Queries</p>
          <div className="space-y-1.5">
            {data.topQueries.slice(0, 8).map((q) => (
              <div key={q.query} className="flex items-center justify-between gap-2">
                <span
                  className="text-xs truncate max-w-[180px]"
                  style={{ color: "var(--ink-3)" }}
                  title={q.query}
                >
                  {q.query}
                </span>
                <span className="font-mono text-xs shrink-0" style={{ color: "var(--ink)" }}>
                  {fmtNum(q.clicks)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Top pages */}
        <div>
          <p className="label-sm mb-2">Top Pages</p>
          <div className="space-y-1.5">
            {data.topPages.slice(0, 8).map((p) => (
              <div key={p.page} className="flex items-center justify-between gap-2">
                <span
                  className="text-xs truncate max-w-[180px]"
                  style={{ color: "var(--ink-3)" }}
                  title={p.page}
                >
                  {shortenUrl(p.page)}
                </span>
                <span className="font-mono text-xs shrink-0" style={{ color: "var(--ink)" }}>
                  {fmtNum(p.clicks)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Device breakdown */}
      {data.deviceBreakdown.length > 0 && (
        <div className="mt-5 pt-4" style={{ borderTop: "1px solid var(--line-2)" }}>
          <p className="label-sm mb-2">Device</p>
          <div className="flex gap-3">
            {data.deviceBreakdown.map((d) => {
              const pct = data.clicks > 0 ? (d.clicks / data.clicks) * 100 : 0;
              return (
                <div key={d.device} className="flex items-center gap-1.5">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ background: d.device === "DESKTOP" ? "var(--indigo)" : d.device === "MOBILE" ? "var(--purple)" : "var(--cyan)" }}
                  />
                  <span className="text-xs capitalize" style={{ color: "var(--ink-4)" }}>
                    {d.device.toLowerCase()}
                  </span>
                  <span className="font-mono text-xs font-semibold" style={{ color: "var(--ink)" }}>
                    {pct.toFixed(0)}%
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export function BotLane() {
  return (
    <div
      className="rounded-[var(--r-xl)] p-5"
      style={{ background: "var(--surface)", boxShadow: "var(--sh-1)" }}
    >
      <div className="flex items-center gap-2 mb-4">
        <Bot size={14} style={{ color: "var(--purple)" }} />
        <span className="text-sm font-semibold" style={{ color: "var(--ink)" }}>Bot Traffic</span>
        <span className="label-sm ml-auto">AI crawlers · Slice 3+</span>
      </div>
      <div
        className="rounded-[var(--r-md)] p-4 text-center"
        style={{ background: "var(--bg-2)", border: "1px dashed var(--line)" }}
      >
        <p className="text-xs" style={{ color: "var(--ink-4)" }}>
          AI-bot allowlist, Googlebot crawl frequency, and LLM crawler activity land here.
        </p>
        <p className="text-xs mt-1" style={{ color: "var(--ink-5)" }}>
          Connect a log source or upload a Screaming Frog crawl to unlock.
        </p>
      </div>
    </div>
  );
}
