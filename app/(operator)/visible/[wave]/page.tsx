import { createClient } from "@/lib/db/server";
import { WaveTower } from "@/components/visible/WaveTower";
import { IssueRow } from "@/components/visible/IssueRow";

const BANFIELD_PROJECT_ID = "a0000000-0000-0000-0000-000000000001";

interface WaveBlock {
  label: string;
  shaded: boolean;
  color: "green" | "amber" | "red" | "gray";
}

interface WaveData {
  grade: string | null;
  blocks: WaveBlock[] | null;
}

interface RecItem {
  id: string;
  title: string;
  kind: string;
  status: "open" | "scheduled" | "in_progress" | "done" | "wontfix";
  impact_score: number;
  effort: "XS" | "S" | "M" | "L";
}

interface IssueItem {
  id: string;
  title: string;
  category: string;
  severity: "critical" | "high" | "medium" | "low";
  pages: string[] | null;
  status: string;
}

const waveLabel: Record<string, string> = {
  "1": "Technical Foundation",
  "2": "Content Expansion",
  "3": "Off-Page Authority",
};

function statusChipStyle(status: RecItem["status"]): React.CSSProperties {
  switch (status) {
    case "open":
      return { background: "var(--bg-2)", color: "var(--ink-5)" };
    case "in_progress":
      return { background: "var(--amber-tint)", color: "var(--amber)" };
    case "scheduled":
      return { background: "var(--indigo-tint)", color: "var(--indigo)" };
    case "done":
      return { background: "var(--green-tint)", color: "var(--green)" };
    case "wontfix":
      return { background: "var(--bg-2)", color: "var(--ink-5)" };
  }
}

function statusLabel(status: RecItem["status"]): string {
  switch (status) {
    case "open": return "Open";
    case "in_progress": return "In progress";
    case "scheduled": return "Scheduled";
    case "done": return "Done";
    case "wontfix": return "Won't fix";
  }
}

interface Props {
  params: Promise<{ wave: string }>;
}

export default async function VisibleWavePage({ params }: Props) {
  const { wave } = await params;
  const waveNum = Number(wave) as 1 | 2 | 3;
  const supabase = await createClient();

  const [wavesResult, recsResult, issuesResult] = await Promise.all([
    supabase
      .from("waves")
      .select("grade, blocks")
      .eq("project_id", BANFIELD_PROJECT_ID)
      .eq("wave_number", waveNum)
      .single(),
    supabase
      .from("recommendations")
      .select("id, title, kind, status, impact_score, effort")
      .eq("project_id", BANFIELD_PROJECT_ID)
      .eq("wave_number", waveNum)
      .order("impact_score", { ascending: false })
      .limit(10),
    supabase
      .from("issues")
      .select("id, title, category, severity, pages, status")
      .eq("project_id", BANFIELD_PROJECT_ID)
      .order("detected_at", { ascending: false })
      .limit(8),
  ]);

  const waveData = wavesResult.data as WaveData | null;
  const recs = (recsResult.data as RecItem[] | null) ?? [];
  const issues = (issuesResult.data as IssueItem[] | null) ?? [];
  const blocks = (waveData?.blocks as WaveBlock[]) ?? [];

  const gradeStyle: React.CSSProperties = (() => {
    const g = waveData?.grade;
    if (!g) return { background: "var(--red-tint)", color: "var(--red)" };
    if (g.startsWith("A")) return { background: "var(--green-tint)", color: "var(--green)" };
    if (g.startsWith("B")) return { background: "var(--indigo-tint)", color: "var(--indigo)" };
    if (g.startsWith("C")) return { background: "var(--amber-tint)", color: "var(--amber)" };
    return { background: "var(--red-tint)", color: "var(--red)" };
  })();

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-1" style={{ color: "var(--ink)" }}>
          Visible-for — Wave {wave}
        </h1>
        <div className="flex items-center gap-2">
          <span className="text-sm" style={{ color: "var(--ink-4)" }}>
            {waveLabel[wave] ?? `Wave ${wave}`}
          </span>
          {waveData?.grade && (
            <span
              className="text-xs font-bold font-mono px-2 py-0.5 rounded-full"
              style={gradeStyle}
            >
              {waveData.grade}
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="flex flex-col gap-4">
          <div
            className="rounded-[var(--r-xl)] p-4"
            style={{ background: "var(--surface)", boxShadow: "var(--sh-1)" }}
          >
            <WaveTower waveNumber={waveNum} grade={waveData?.grade ?? null} blocks={blocks} />
          </div>

          <div
            className="rounded-[var(--r-xl)] p-4"
            style={{ background: "var(--surface)", boxShadow: "var(--sh-1)" }}
          >
            <h2 className="text-sm font-bold mb-3" style={{ color: "var(--ink)" }}>
              Wave {wave} Recommendations ({recs.length})
            </h2>
            {recs.length === 0 ? (
              <p className="text-xs" style={{ color: "var(--ink-4)" }}>
                No recommendations yet.
              </p>
            ) : (
              <div className="flex flex-col gap-1">
                {recs.map((rec) => (
                  <div
                    key={rec.id}
                    className="flex items-center gap-2 px-2 py-2 rounded-[var(--r-md)] hover:bg-[var(--bg-2)] transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate" style={{ color: "var(--ink)" }}>
                        {rec.title}
                      </p>
                    </div>
                    <span
                      className="shrink-0 text-[10px] font-medium px-1.5 py-0.5 rounded-full"
                      style={statusChipStyle(rec.status)}
                    >
                      {statusLabel(rec.status)}
                    </span>
                    <a
                      href={`/recommendations/${rec.id}`}
                      className="shrink-0 text-xs font-medium transition-opacity hover:opacity-70"
                      style={{ color: "var(--indigo)" }}
                    >
                      →
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div
          className="rounded-[var(--r-xl)] p-4"
          style={{ background: "var(--surface)", boxShadow: "var(--sh-1)" }}
        >
          <h2 className="text-sm font-bold mb-3" style={{ color: "var(--ink)" }}>
            Issues ({issues.length})
          </h2>
          {issues.length === 0 ? (
            <div
              className="rounded-[var(--r-lg)] p-6 text-center"
              style={{ border: "1px dashed var(--line-2)" }}
            >
              <p className="text-xs" style={{ color: "var(--ink-4)" }}>
                No issues logged yet.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-0.5">
              {issues.map((issue) => (
                <IssueRow
                  key={issue.id}
                  id={issue.id}
                  title={issue.title}
                  category={issue.category}
                  severity={issue.severity}
                  pagesCount={issue.pages?.length ?? 0}
                  status={issue.status}
                  href={`/issues/${issue.id}`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function generateStaticParams() {
  return [{ wave: "1" }, { wave: "2" }, { wave: "3" }];
}
