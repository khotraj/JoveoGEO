import { createClient } from "@/lib/db/server";
import { BackBar } from "@/components/shell/BackBar";

interface Props {
  params: Promise<{ id: string }>;
}

interface RecFull {
  id: string;
  title: string;
  wave_number: 1 | 2 | 3;
  kind: string;
  status: "open" | "scheduled" | "in_progress" | "done" | "wontfix";
  impact_score: number;
  effort: "XS" | "S" | "M" | "L";
  page_url: string | null;
  impact_text: string | null;
  fix_steps: string[] | null;
  owner: string | null;
  eta: string | null;
}

function waveBadgeStyle(wave: 1 | 2 | 3): React.CSSProperties {
  switch (wave) {
    case 1: return { background: "var(--indigo-tint)", color: "var(--indigo)" };
    case 2: return { background: "var(--cyan-tint)", color: "var(--cyan)" };
    case 3: return { background: "var(--purple-tint)", color: "var(--purple)" };
  }
}

function effortStyle(effort: RecFull["effort"]): React.CSSProperties {
  switch (effort) {
    case "XS":
    case "S": return { background: "var(--green-tint)", color: "var(--green)" };
    case "M": return { background: "var(--amber-tint)", color: "var(--amber)" };
    case "L": return { background: "var(--red-tint)", color: "var(--red)" };
  }
}

function statusStyle(status: RecFull["status"]): React.CSSProperties {
  switch (status) {
    case "open": return { background: "var(--bg-2)", color: "var(--ink-5)" };
    case "in_progress": return { background: "var(--amber-tint)", color: "var(--amber)" };
    case "scheduled": return { background: "var(--indigo-tint)", color: "var(--indigo)" };
    case "done": return { background: "var(--green-tint)", color: "var(--green)" };
    case "wontfix": return { background: "var(--bg-2)", color: "var(--ink-5)" };
  }
}

function statusLabel(status: RecFull["status"]): string {
  switch (status) {
    case "open": return "Open";
    case "in_progress": return "In Progress";
    case "scheduled": return "Scheduled";
    case "done": return "Done";
    case "wontfix": return "Won't Fix";
  }
}

function shortenUrl(u: string): string {
  try { return new URL(u).pathname; } catch { return u; }
}

export default async function RecDetailPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: recRaw } = await supabase
    .from("recommendations")
    .select("*")
    .eq("id", id)
    .single();

  if (!recRaw) {
    return (
      <>
        <BackBar label="Recommendations" href="/recommendations" title="Not found" />
        <div className="p-6">
          <p className="text-sm" style={{ color: "var(--ink-4)" }}>
            Recommendation not found.
          </p>
        </div>
      </>
    );
  }

  const rec = recRaw as RecFull;

  return (
    <>
      <BackBar label="Recommendations" href="/recommendations" title={rec.title} />
      <div className="p-6 space-y-6">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span
              className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-full"
              style={waveBadgeStyle(rec.wave_number)}
            >
              W{rec.wave_number}
            </span>
            <span
              className="text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded"
              style={{ background: "var(--bg-2)", color: "var(--ink-4)" }}
            >
              {rec.kind}
            </span>
            <span
              className="text-[10px] font-medium px-1.5 py-0.5 rounded-full"
              style={statusStyle(rec.status)}
            >
              {statusLabel(rec.status)}
            </span>
            <span
              className="text-[10px] font-bold font-mono px-1.5 py-0.5 rounded"
              style={effortStyle(rec.effort)}
            >
              {rec.effort}
            </span>
          </div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--ink)" }}>
            {rec.title}
          </h1>
        </div>

        <div
          className="flex items-baseline gap-1 px-4 py-3 rounded-[var(--r-lg)]"
          style={{ background: "var(--indigo-tint)" }}
        >
          <span className="text-sm font-semibold" style={{ color: "var(--indigo)" }}>
            Impact:
          </span>
          <span className="text-2xl font-bold font-mono" style={{ color: "var(--indigo)" }}>
            {rec.impact_score}
          </span>
          <span className="text-sm" style={{ color: "var(--indigo)" }}>pts</span>
        </div>

        {rec.page_url && (
          <div
            className="px-4 py-3 rounded-[var(--r-lg)]"
            style={{ background: "var(--bg-2)" }}
          >
            <span className="text-xs" style={{ color: "var(--ink-4)" }}>Page: </span>
            <span className="text-xs font-mono" style={{ color: "var(--ink-3)" }}>
              {shortenUrl(rec.page_url)}
            </span>
          </div>
        )}

        {rec.impact_text && (
          <blockquote
            className="px-4 py-3 rounded-[var(--r-lg)] border-l-4"
            style={{
              background: "var(--surface)",
              borderColor: "var(--indigo)",
              boxShadow: "var(--sh-1)",
            }}
          >
            <p className="text-sm" style={{ color: "var(--ink-3)" }}>
              {rec.impact_text}
            </p>
          </blockquote>
        )}

        <div
          className="rounded-[var(--r-xl)] p-4"
          style={{ background: "var(--surface)", boxShadow: "var(--sh-1)" }}
        >
          <h2 className="text-sm font-bold mb-3" style={{ color: "var(--ink)" }}>
            Fix Steps
          </h2>
          {rec.fix_steps && rec.fix_steps.length > 0 ? (
            <ol className="flex flex-col gap-2">
              {rec.fix_steps.map((step, i) => (
                <li key={i} className="flex gap-2">
                  <span
                    className="shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold font-mono"
                    style={{ background: "var(--indigo-tint)", color: "var(--indigo)" }}
                  >
                    {i + 1}
                  </span>
                  <span className="text-sm" style={{ color: "var(--ink-3)" }}>
                    {step}
                  </span>
                </li>
              ))}
            </ol>
          ) : (
            <p className="text-sm" style={{ color: "var(--ink-4)" }}>
              Fix steps coming soon.
            </p>
          )}
        </div>

        <div>
          <button
            disabled
            className="px-4 py-2 rounded-[var(--r-md)] text-sm font-medium cursor-not-allowed"
            style={{ background: "var(--bg-2)", color: "var(--ink-5)" }}
          >
            Generate Page Brief (Slice 6)
          </button>
        </div>

        <div
          className="rounded-[var(--r-xl)] p-4"
          style={{ background: "var(--surface)", boxShadow: "var(--sh-1)" }}
        >
          <h2 className="text-sm font-bold mb-3" style={{ color: "var(--ink)" }}>
            Metadata
          </h2>
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: "Owner", value: rec.owner ?? "—" },
              { label: "ETA", value: rec.eta ?? "—" },
              { label: "Status", value: statusLabel(rec.status) },
            ].map(({ label, value }) => (
              <div key={label}>
                <p className="text-xs mb-0.5" style={{ color: "var(--ink-4)" }}>
                  {label}
                </p>
                <p className="text-sm font-medium" style={{ color: "var(--ink)" }}>
                  {value}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
