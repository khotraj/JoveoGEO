import { TrendingUp, Eye, BarChart2, DollarSign } from "lucide-react";

export interface KpiData {
  organicVisits:    number;
  aiVisibility:     number | null;   // null until Rankscale is wired (Slice 4)
  brandedPct:       number;
  unbrandedPct:     number;
  paidEquivalentLeak: number;        // $ value = clicks × CPC
}

interface KpiTileProps {
  icon:    React.ReactNode;
  label:   string;
  value:   string;
  sub:     string;
  color:   string;
}

function KpiTile({ icon, label, value, sub, color }: KpiTileProps) {
  return (
    <div
      className="flex-1 rounded-[var(--r-lg)] p-4 min-w-[160px]"
      style={{ background: "var(--surface)", boxShadow: "var(--sh-1)" }}
    >
      <div className="flex items-center gap-2 mb-3">
        <div
          className="w-7 h-7 rounded-[var(--r-sm)] flex items-center justify-center"
          style={{ background: color + "15", color }}
        >
          {icon}
        </div>
        <span className="label-sm">{label}</span>
      </div>
      <div className="font-mono text-2xl font-bold leading-none mb-1" style={{ color: "var(--ink)" }}>
        {value}
      </div>
      <div className="text-xs" style={{ color: "var(--ink-4)" }}>{sub}</div>
    </div>
  );
}

export function KpiStrip({ data }: { data: KpiData }) {
  const fmtNum = (n: number) =>
    n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}M`
    : n >= 1_000   ? `${(n / 1_000).toFixed(1)}k`
    : String(n);

  return (
    <div className="flex gap-3 flex-wrap">
      <KpiTile
        icon={<TrendingUp size={14} />}
        label="Organic Visits"
        value={fmtNum(data.organicVisits)}
        sub="last 30 days · GSC clicks"
        color="var(--indigo)"
      />
      <KpiTile
        icon={<Eye size={14} />}
        label="AI Visibility"
        value={data.aiVisibility !== null ? `${data.aiVisibility.toFixed(1)}%` : "—"}
        sub={data.aiVisibility !== null ? "unbranded · Rankscale" : "Connect Rankscale in Slice 4"}
        color="var(--purple)"
      />
      <KpiTile
        icon={<BarChart2 size={14} />}
        label="Branded / Unbranded"
        value={`${data.brandedPct.toFixed(0)}% / ${data.unbrandedPct.toFixed(0)}%`}
        sub="of GSC clicks · last 30 days"
        color="var(--cyan)"
      />
      <KpiTile
        icon={<DollarSign size={14} />}
        label="Paid-Equiv. Leak"
        value={`$${fmtNum(Math.round(data.paidEquivalentLeak))}`}
        sub="clicks × $4.50 avg vet role CPC"
        color="var(--amber)"
      />
    </div>
  );
}
