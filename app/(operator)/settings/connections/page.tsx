export default function ConnectionsPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-1" style={{ color: "var(--ink)" }}>Connections</h1>
      <p className="text-sm mb-6" style={{ color: "var(--ink-4)" }}>
        Connect GSC, GA4, Rankscale, Ahrefs, Screaming Frog exports. Coming in Slice 2.
      </p>
      <div className="grid gap-3">
        {["Google Search Console", "Google Analytics 4", "Rankscale", "Ahrefs", "Screaming Frog"].map((name) => (
          <div
            key={name}
            className="flex items-center justify-between px-4 py-3 rounded-[var(--r-md)]"
            style={{ background: "var(--surface)", boxShadow: "var(--sh-1)" }}
          >
            <span className="text-sm font-medium" style={{ color: "var(--ink-2)" }}>{name}</span>
            <span
              className="text-xs font-medium px-2 py-0.5 rounded-full"
              style={{ background: "var(--line-soft)", color: "var(--ink-4)" }}
            >
              Not connected
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
