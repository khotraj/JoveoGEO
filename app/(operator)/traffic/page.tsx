export default function TrafficPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-1" style={{ color: "var(--ink)" }}>Traffic</h1>
      <p className="text-sm mb-6" style={{ color: "var(--ink-4)" }}>
        Human + Bot lanes, keyword cloud, AI sources, Insights Band — coming in Slice 2.
      </p>
      <div
        className="rounded-[var(--r-xl)] p-8 text-center"
        style={{ background: "var(--surface)", boxShadow: "var(--sh-1)", border: "1px dashed var(--line-2)" }}
      >
        <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--indigo)" }}>
          Slice 2 — Box 1: Traffic
        </span>
      </div>
    </div>
  );
}
