interface IssueRowProps {
  id: string;
  title: string;
  category: string;
  severity: "critical" | "high" | "medium" | "low";
  pagesCount: number;
  status: string;
  href: string;
}

function severityStyle(severity: IssueRowProps["severity"]): React.CSSProperties {
  switch (severity) {
    case "critical":
      return { background: "var(--red-tint)", color: "var(--red)" };
    case "high":
      return { background: "var(--amber-tint)", color: "var(--amber)" };
    case "medium":
      return { background: "var(--indigo-tint)", color: "var(--indigo)" };
    case "low":
      return { background: "var(--bg-2)", color: "var(--ink-4)" };
  }
}

export function IssueRow({ id: _id, title, category, severity, pagesCount, status, href }: IssueRowProps) {
  return (
    <a
      href={href}
      data-testid="issue-row"
      className="flex items-center gap-3 px-3 py-2.5 rounded-[var(--r-md)] border border-transparent transition-colors hover:border-[var(--line-2)]"
      style={{ textDecoration: "none" }}
      onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-2)")}
      onMouseLeave={(e) => (e.currentTarget.style.background = "")}
    >
      <span
        className="shrink-0 text-[10px] font-bold uppercase px-1.5 py-0.5 rounded-full"
        style={severityStyle(severity)}
      >
        {severity}
      </span>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate" style={{ color: "var(--ink)" }}>
          {title}
        </p>
        <p className="text-xs" style={{ color: "var(--ink-4)" }}>
          {category}
        </p>
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        {pagesCount > 0 && (
          <span
            className="text-xs font-mono px-1.5 py-0.5 rounded"
            style={{ background: "var(--bg-2)", color: "var(--ink-4)" }}
          >
            {pagesCount}p
          </span>
        )}
        <span
          className="text-xs px-1.5 py-0.5 rounded-full"
          style={{ background: "var(--bg-2)", color: "var(--ink-4)" }}
        >
          {status}
        </span>
      </div>
    </a>
  );
}
