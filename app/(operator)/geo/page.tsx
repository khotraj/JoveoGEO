export default function GeoPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-1" style={{ color: "var(--ink)" }}>GEO</h1>
      <p className="text-sm mb-6" style={{ color: "var(--ink-4)" }}>
        AI Share of Voice, Prompt Visibility Grid, Citation Strip, Mentions Feed — coming in Slice 4.
      </p>
      <div
        className="rounded-[var(--r-xl)] p-8 text-center"
        style={{ background: "var(--surface)", boxShadow: "var(--sh-1)", border: "1px dashed var(--line-2)" }}
      >
        <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--indigo)" }}>
          Slice 4 — Box 3: GEO via Rankscale
        </span>
      </div>
    </div>
  );
}
