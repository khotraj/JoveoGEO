interface RecRowProps {
  id: string;
  title: string;
  waveNumber: 1 | 2 | 3;
  kind: string;
  status: "open" | "scheduled" | "in_progress" | "done" | "wontfix";
  impactScore: number;
  effort: "XS" | "S" | "M" | "L";
  pageUrl: string | null;
  href: string;
}

function waveBadgeStyle(wave: 1 | 2 | 3): React.CSSProperties {
  switch (wave) {
    case 1:
      return { background: "var(--indigo-tint)", color: "var(--indigo)" };
    case 2:
      return { background: "var(--cyan-tint)", color: "var(--cyan)" };
    case 3:
      return { background: "var(--purple-tint)", color: "var(--purple)" };
  }
}

function effortStyle(effort: RecRowProps["effort"]): React.CSSProperties {
  switch (effort) {
    case "XS":
    case "S":
      return { background: "var(--green-tint)", color: "var(--green)" };
    case "M":
      return { background: "var(--amber-tint)", color: "var(--amber)" };
    case "L":
      return { background: "var(--red-tint)", color: "var(--red)" };
  }
}

function statusStyle(status: RecRowProps["status"]): React.CSSProperties {
  switch (status) {
    case "open":
      return { color: "var(--ink-5)" };
    case "in_progress":
      return { color: "var(--amber)" };
    case "scheduled":
      return { color: "var(--indigo)" };
    case "done":
      return { color: "var(--green)" };
    case "wontfix":
      return { color: "var(--ink-5)", textDecoration: "line-through" };
  }
}

function statusDotColor(status: RecRowProps["status"]): string {
  switch (status) {
    case "open":
      return "var(--ink-5)";
    case "in_progress":
      return "var(--amber)";
    case "scheduled":
      return "var(--indigo)";
    case "done":
      return "var(--green)";
    case "wontfix":
      return "var(--ink-5)";
  }
}

function shortenUrl(u: string): string {
  try {
    return new URL(u).pathname;
  } catch {
    return u;
  }
}

function statusLabel(status: RecRowProps["status"]): string {
  switch (status) {
    case "open":
      return "Open";
    case "in_progress":
      return "In progress";
    case "scheduled":
      return "Scheduled";
    case "done":
      return "Done";
    case "wontfix":
      return "Won't fix";
  }
}

export function RecRow({ id: _id, title, waveNumber, kind, status, impactScore, effort, pageUrl, href }: RecRowProps) {
  return (
    <a
      href={href}
      data-testid="rec-row"
      className="flex items-center gap-3 px-4 py-3 rounded-[var(--r-md)] border border-transparent transition-colors hover:border-[var(--line-2)] hover:bg-[var(--bg-2)]"
      style={{ textDecoration: "none" }}
    >
      <span
        className="shrink-0 text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-full"
        style={waveBadgeStyle(waveNumber)}
      >
        W{waveNumber}
      </span>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate" style={{ color: "var(--ink)" }}>
          {title}
        </p>
        {pageUrl && (
          <p className="text-xs font-mono truncate" style={{ color: "var(--ink-5)" }}>
            {shortenUrl(pageUrl)}
          </p>
        )}
      </div>

      <span
        className="shrink-0 text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded"
        style={{ background: "var(--bg-2)", color: "var(--ink-4)" }}
      >
        {kind}
      </span>

      <span
        className="shrink-0 text-[10px] font-bold font-mono px-1.5 py-0.5 rounded"
        style={effortStyle(effort)}
      >
        {effort}
      </span>

      <div className="shrink-0 flex items-baseline gap-0.5">
        <span className="text-sm font-bold font-mono" style={{ color: "var(--ink)" }}>
          {impactScore}
        </span>
        <span className="text-[10px]" style={{ color: "var(--ink-5)" }}>
          pts
        </span>
      </div>

      <div className="shrink-0 flex items-center gap-1">
        <span
          className="inline-block w-1.5 h-1.5 rounded-full"
          style={{ background: statusDotColor(status) }}
        />
        <span className="text-xs" style={statusStyle(status)}>
          {statusLabel(status)}
        </span>
      </div>
    </a>
  );
}
