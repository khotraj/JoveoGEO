export default function DiscoverPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-1" style={{ color: "var(--ink)" }}>Discover</h1>
      <p className="text-sm mb-6" style={{ color: "var(--ink-4)" }}>
        Paste a career site URL → 8 minutes → fully populated Cockpit tenant. Coming in Slice 5.
      </p>
      <div
        className="rounded-[var(--r-xl)] p-8 text-center"
        style={{ background: "var(--surface)", boxShadow: "var(--sh-1)", border: "1px dashed var(--line-2)" }}
      >
        <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--indigo)" }}>
          Slice 5 — Discovery Mode (the money moment)
        </span>
        <p className="text-sm mt-2" style={{ color: "var(--ink-4)" }}>
          URL → crawl → sitemap → jobs → SERP → Ahrefs → Claude → populated tenant
        </p>
      </div>
    </div>
  );
}
