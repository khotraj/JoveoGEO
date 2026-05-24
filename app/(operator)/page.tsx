export default function OverviewPage() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ color: "var(--ink)" }}>Overview</h1>
        <p className="text-sm mt-1" style={{ color: "var(--ink-4)" }}>
          KPI strip, abstraction cards, and snapshot column — coming in Slice 2.
        </p>
      </div>
      <div
        className="rounded-[var(--r-xl)] p-8 text-center"
        style={{ background: "var(--surface)", boxShadow: "var(--sh-1)", border: "1px dashed var(--line-2)" }}
      >
        <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--indigo)" }}>
          Slice 2 — Live Mode for Banfield, Box 1
        </span>
        <p className="text-sm mt-2" style={{ color: "var(--ink-4)" }}>
          GSC + GA4 OAuth → KPI strip → Traffic screen → Insights Band
        </p>
      </div>
    </div>
  );
}
