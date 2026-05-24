import { createClient } from "@/lib/db/server";
import { BackBar } from "@/components/shell/BackBar";
import { RecRow } from "@/components/recommendations/RecRow";

interface Props {
  params: Promise<{ id: string }>;
}

interface IssueFull {
  id: string;
  title: string;
  category: string;
  severity: "critical" | "high" | "medium" | "low";
  pages: string[] | null;
  status: string;
  detected_at: string | null;
  user_sees: string | null;
  ai_sees: string | null;
}

interface RecItem {
  id: string;
  title: string;
  wave_number: 1 | 2 | 3;
  kind: string;
  status: "open" | "scheduled" | "in_progress" | "done" | "wontfix";
  impact_score: number;
  effort: "XS" | "S" | "M" | "L";
  page_url: string | null;
}

function severityStyle(severity: IssueFull["severity"]): React.CSSProperties {
  switch (severity) {
    case "critical": return { background: "var(--red-tint)", color: "var(--red)" };
    case "high": return { background: "var(--amber-tint)", color: "var(--amber)" };
    case "medium": return { background: "var(--indigo-tint)", color: "var(--indigo)" };
    case "low": return { background: "var(--bg-2)", color: "var(--ink-4)" };
  }
}

export default async function IssueInspectorPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: issueRaw } = await supabase
    .from("issues")
    .select("*")
    .eq("id", id)
    .single();

  if (!issueRaw) {
    return (
      <>
        <BackBar label="Visible-for" href="/visible/1" title="Not found" />
        <div className="p-6">
          <p className="text-sm" style={{ color: "var(--ink-4)" }}>
            Issue not found.
          </p>
        </div>
      </>
    );
  }

  const issue = issueRaw as IssueFull;

  const { data: linkedRecsRaw } = await supabase
    .from("recommendations")
    .select("id, title, wave_number, kind, status, impact_score, effort, page_url")
    .contains("resolves_issue_ids", [id]);

  const linkedRecs = (linkedRecsRaw as RecItem[] | null) ?? [];

  const hasUserImpact = Boolean(issue.user_sees);
  const hasAiImpact = Boolean(issue.ai_sees);
  const showSideBySide = hasUserImpact && hasAiImpact;
  const pages = issue.pages ?? [];

  return (
    <>
      <BackBar label="Visible-for" href="/visible/1" title={issue.title} />
      <div className="p-6 space-y-6">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span
              className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded-full"
              style={severityStyle(issue.severity)}
            >
              {issue.severity}
            </span>
            <span
              className="text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded"
              style={{ background: "var(--bg-2)", color: "var(--ink-4)" }}
            >
              {issue.category}
            </span>
          </div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--ink)" }}>
            {issue.title}
          </h1>
        </div>

        {(hasUserImpact || hasAiImpact) && (
          <div className={showSideBySide ? "grid grid-cols-2 gap-4" : "flex flex-col gap-4"}>
            {hasUserImpact && (
              <div
                className="rounded-[var(--r-lg)] p-4"
                style={{ background: "var(--surface)", boxShadow: "var(--sh-1)" }}
              >
                <p className="text-xs font-semibold mb-2" style={{ color: "var(--ink-4)" }}>
                  What the user sees
                </p>
                <p className="text-sm" style={{ color: "var(--ink-3)" }}>
                  {issue.user_sees}
                </p>
              </div>
            )}
            {hasAiImpact && (
              <div
                className="rounded-[var(--r-lg)] p-4"
                style={{ background: "var(--surface)", boxShadow: "var(--sh-1)" }}
              >
                <p className="text-xs font-semibold mb-2" style={{ color: "var(--ink-4)" }}>
                  What AI sees
                </p>
                <p className="text-sm" style={{ color: "var(--ink-3)" }}>
                  {issue.ai_sees}
                </p>
              </div>
            )}
          </div>
        )}

        {pages.length > 0 && (
          <div
            className="rounded-[var(--r-xl)] p-4"
            style={{ background: "var(--surface)", boxShadow: "var(--sh-1)" }}
          >
            <h2 className="text-sm font-bold mb-3" style={{ color: "var(--ink)" }}>
              Affected pages ({pages.length})
            </h2>
            <div className="flex flex-col gap-1">
              {pages.slice(0, 10).map((page, i) => (
                <p key={i} className="text-xs font-mono truncate" style={{ color: "var(--ink-3)" }}>
                  {page}
                </p>
              ))}
              {pages.length > 10 && (
                <p className="text-xs" style={{ color: "var(--ink-4)" }}>
                  +{pages.length - 10} more
                </p>
              )}
            </div>
          </div>
        )}

        <div className="flex items-center gap-3">
          <span
            className="text-xs font-medium px-2 py-1 rounded-full"
            style={{ background: "var(--bg-2)", color: "var(--ink-4)" }}
          >
            {issue.status}
          </span>
          {issue.detected_at && (
            <span className="text-xs" style={{ color: "var(--ink-5)" }}>
              Detected {new Date(issue.detected_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
            </span>
          )}
        </div>

        <div
          className="rounded-[var(--r-xl)] p-4"
          style={{ background: "var(--surface)", boxShadow: "var(--sh-1)" }}
        >
          <h2 className="text-sm font-bold mb-3" style={{ color: "var(--ink)" }}>
            Linked Fixes ({linkedRecs.length})
          </h2>
          {linkedRecs.length === 0 ? (
            <p className="text-sm" style={{ color: "var(--ink-4)" }}>
              No linked fixes yet.
            </p>
          ) : (
            <div className="flex flex-col">
              {linkedRecs.map((rec) => (
                <RecRow
                  key={rec.id}
                  id={rec.id}
                  title={rec.title}
                  waveNumber={rec.wave_number}
                  kind={rec.kind}
                  status={rec.status}
                  impactScore={rec.impact_score}
                  effort={rec.effort}
                  pageUrl={rec.page_url}
                  href={`/recommendations/${rec.id}`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
