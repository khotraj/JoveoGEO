interface Props { params: Promise<{ wave: string }> }

export default async function VisiblePage({ params }: Props) {
  const { wave } = await params;
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-1" style={{ color: "var(--ink)" }}>Visible-for</h1>
      <p className="text-sm mb-6" style={{ color: "var(--ink-4)" }}>
        Health rings, Wave {wave} tower of blocks, issues drawer — coming in Slice 3.
      </p>
      <div
        className="rounded-[var(--r-xl)] p-8 text-center"
        style={{ background: "var(--surface)", boxShadow: "var(--sh-1)", border: "1px dashed var(--line-2)" }}
      >
        <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--indigo)" }}>
          Slice 3 — Box 2: Visible-for (Wave {wave})
        </span>
      </div>
    </div>
  );
}

export function generateStaticParams() {
  return [{ wave: "1" }, { wave: "2" }, { wave: "3" }];
}
