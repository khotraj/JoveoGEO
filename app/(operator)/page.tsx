import { createClient } from "@/lib/db/server";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

const BANFIELD_PROJECT_ID = "a0000000-0000-0000-0000-000000000001";
const BRANDED_TERM        = "banfield";
const DEFAULT_VET_CPC     = 4.5;

function fmtNum(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}

// ─── KPI Tile ────────────────────────────────────────────────────────────────

function KpiTile({ icon, label, value, trendText, up, colorVar }: {
  icon: string; label: string; value: string;
  trendText: string; up: boolean | null; colorVar: string;
}) {
  const trendBg    = up === true ? "var(--green-tint)" : up === false ? "var(--red-tint)" : "var(--bg-2)";
  const trendColor = up === true ? "#166534"           : up === false ? "#991B1B"         : "var(--ink-4)";

  return (
    <div
      className="hover-lift"
      style={{ background: "var(--surface)", border: "1px solid var(--line-2)", borderRadius: "var(--r-lg)", padding: "14px 16px", display: "flex", alignItems: "center", gap: 12 }}
    >
      <div style={{ width: 38, height: 38, borderRadius: 11, display: "grid", placeItems: "center", background: colorVar + "20", color: colorVar, fontSize: 17, flexShrink: 0 }}>
        {icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 10.5, fontWeight: 600, color: "var(--ink-4)", letterSpacing: ".04em", textTransform: "uppercase" }}>{label}</div>
        <div className="font-mono" style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-.025em", lineHeight: 1.1, marginTop: 1 }}>{value}</div>
        <div style={{ marginTop: 3, fontSize: 10.5, fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 4, color: trendColor, background: trendBg, padding: "2px 6px", borderRadius: 6 }}>
          {trendText}
        </div>
      </div>
    </div>
  );
}

// ─── Abstraction Card ─────────────────────────────────────────────────────────

function AbsCard({ type, tag, tagColor, tagBg, num, delta, deltaUp, headline, sub, href, children }: {
  type: "traffic" | "visible" | "geo";
  tag: string; tagColor: string; tagBg: string;
  num: string; delta: string; deltaUp: boolean;
  headline: string; sub: string; href: string;
  children?: React.ReactNode;
}) {
  const icons = {
    traffic: <path d="M22 7 13.5 15.5 8.5 10.5 2 17M16 7h6v6" />,
    visible: <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></>,
    geo:     <><circle cx="12" cy="12" r="10" /><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" /></>,
  };

  return (
    <Link href={href} className="abs-card" style={{ position: "relative", background: "var(--surface)", border: "1.5px solid var(--line-2)", borderRadius: "var(--r-2xl)", padding: "22px 22px 20px", overflow: "hidden" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 7, fontSize: 10.5, fontWeight: 700, color: "var(--ink-4)", letterSpacing: ".08em", textTransform: "uppercase" }}>
          <div style={{ width: 22, height: 22, borderRadius: 7, display: "grid", placeItems: "center", background: tagBg, color: tagColor }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">{icons[type]}</svg>
          </div>
          {tag}
        </div>
        <div className="card-chev" style={{ width: 26, height: 26, borderRadius: 8, display: "grid", placeItems: "center", background: "var(--surface-2)", color: "var(--ink-4)", border: "1px solid var(--line-2)" }}>
          <ChevronRight size={13} />
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
        <div className="font-mono" style={{ fontSize: 36, fontWeight: 800, letterSpacing: "-.035em", lineHeight: 1 }}>{num}</div>
        <div style={{ fontSize: 11, fontWeight: 700, padding: "3px 7px", borderRadius: 6, display: "inline-flex", alignItems: "center", gap: 3, background: deltaUp ? "var(--green-tint)" : "var(--bg-2)", color: deltaUp ? "#166534" : "var(--ink-4)", border: deltaUp ? "none" : "1px solid var(--line)" }}>
          {delta}
        </div>
      </div>

      <div style={{ margin: "10px 0 4px", fontSize: 15.5, fontWeight: 700, letterSpacing: "-.012em", lineHeight: 1.35, color: "var(--ink)" }}>{headline}</div>
      <div style={{ fontSize: 12.5, color: "var(--ink-3)", lineHeight: 1.5 }}>{sub}</div>

      {children && (
        <div style={{ marginTop: 16, paddingTop: 14, borderTop: "1px dashed var(--line-2)" }}>{children}</div>
      )}
    </Link>
  );
}

// ─── Mini components ──────────────────────────────────────────────────────────

function MiniBar({ label, pct, gradient }: { label: string; pct: number; gradient: string }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "50px 1fr 38px", alignItems: "center", gap: 10, marginTop: 6 }}>
      <span style={{ color: "var(--ink-4)", fontWeight: 600, letterSpacing: ".02em", textTransform: "uppercase", fontSize: 10 }}>{label}</span>
      <div style={{ height: 6, background: "var(--line-soft)", borderRadius: 999, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${pct}%`, borderRadius: 999, background: gradient }} />
      </div>
      <span className="font-mono" style={{ fontSize: 11, fontWeight: 700, textAlign: "right" }}>{pct}%</span>
    </div>
  );
}

function MiniRing({ pct, color, label, grade }: { pct: number; color: string; label: string; grade: string }) {
  const r    = 16;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  const gb   = grade === "A" || grade === "B+" ? { bg: "var(--green-tint)", c: "#166534" }
             : grade === "B"                   ? { bg: "var(--amber-tint)", c: "#92400E" }
             :                                   { bg: "var(--red-tint)",   c: "#991B1B" };
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, flex: 1 }}>
      <div style={{ position: "relative" }}>
        <svg width="44" height="44" style={{ transform: "rotate(-90deg)" }}>
          <circle cx="22" cy="22" r={r} fill="none" stroke="var(--line-soft)" strokeWidth="4" />
          <circle cx="22" cy="22" r={r} fill="none" stroke={color} strokeWidth="4"
            strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" />
        </svg>
        <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", fontWeight: 800, fontSize: 12 }}>{pct}</div>
      </div>
      <div style={{ fontSize: 9.5, fontWeight: 700, color: "var(--ink-4)", textTransform: "uppercase", letterSpacing: ".05em" }}>{label}</div>
      <div style={{ fontSize: 10, fontWeight: 800, padding: "1px 5px", borderRadius: 4, background: gb.bg, color: gb.c }}>{grade}</div>
    </div>
  );
}

function MiniSov({ name, pct, you }: { name: string; pct: number; you: boolean }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "76px 1fr 30px", alignItems: "center", gap: 8 }}>
      <span style={{ fontSize: 11, fontWeight: you ? 700 : 600, color: you ? "var(--indigo)" : "var(--ink-3)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        {you ? "★ " : ""}{name}
      </span>
      <div style={{ height: 8, background: "var(--line-soft)", borderRadius: 999, overflow: "hidden", border: "1px solid var(--line-2)" }}>
        <div style={{ height: "100%", width: `${pct}%`, borderRadius: 999, background: you ? "linear-gradient(90deg,var(--indigo),var(--purple))" : "linear-gradient(90deg,#6B7280,#9CA3AF)" }} />
      </div>
      <span className="font-mono" style={{ fontSize: 10.5, fontWeight: 700, textAlign: "right" }}>{pct}%</span>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function OverviewPage() {
  const supabase = await createClient();

  const [{ data: queryAggRaw }, { data: recsRaw }, { data: issuesRaw }] = await Promise.all([
    supabase.from("gsc_queries_daily").select("query, clicks").eq("project_id", BANFIELD_PROJECT_ID),
    supabase.from("recommendations").select("wave_number, status").eq("project_id", BANFIELD_PROJECT_ID),
    supabase.from("issues").select("severity, status").eq("project_id", BANFIELD_PROJECT_ID),
  ]);

  const queryAgg = (queryAggRaw ?? []) as Array<{ query: string; clicks: number }>;
  const recs     = (recsRaw     ?? []) as Array<{ wave_number: number; status: string }>;
  const issues   = (issuesRaw   ?? []) as Array<{ severity: string; status: string }>;

  const hasGSC = queryAgg.length > 0;
  let total = 0, branded = 0, unbranded = 0;
  for (const row of queryAgg) {
    const c = row.clicks ?? 0;
    if (row.query?.toLowerCase().includes(BRANDED_TERM)) branded += c; else unbranded += c;
    total += c;
  }

  const totalRecs  = recs.length;
  const openRecs   = recs.filter(r => r.status === "open").length;
  const highIssues = issues.filter(i => i.severity === "high" && i.status === "open").length;

  return (
    <div style={{ maxWidth: 1480, margin: "0 auto", padding: "24px 32px 70px" }}>

      {/* Header */}
      <div style={{ marginBottom: 22 }}>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, letterSpacing: "-.025em", color: "var(--ink)" }}>Overview</h1>
        <p style={{ margin: "4px 0 0", fontSize: 13.5, color: "var(--ink-3)" }}>Banfield Pet Hospital · jobs.banfield.com · Last 30 days</p>
      </div>

      {/* KPI Strip */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 22 }}>
        <KpiTile icon="↗" label="Monthly Organic Visits"   value={hasGSC ? fmtNum(total) : "—"} trendText={hasGSC ? "+12% vs prev 30d" : "Connect GSC"} up={hasGSC ? true : null} colorVar="var(--indigo)" />
        <KpiTile icon="✦" label="AI Visibility · Unbranded" value="—"                           trendText="Connect Rankscale"                             up={null}                colorVar="var(--purple)" />
        <KpiTile icon="◑" label="Branded vs Unbranded"      value={hasGSC ? `${Math.round((branded/total)*100)}/${Math.round((unbranded/total)*100)}` : "—/—"} trendText={hasGSC ? "% of GSC clicks" : "Connect GSC"} up={null} colorVar="var(--cyan)" />
        <KpiTile icon="$" label="Paid-Equiv. Leak"           value={hasGSC ? `$${fmtNum(Math.round(total * DEFAULT_VET_CPC))}` : "—"} trendText={hasGSC ? "clicks × $4.50 CPC" : "Connect GSC"} up={hasGSC ? true : null} colorVar="var(--amber)" />
      </div>

      {/* 3 Abstraction Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginBottom: 22 }}>
        <AbsCard type="traffic" tag="Traffic"
          tagColor="var(--indigo)" tagBg="var(--indigo-tint)"
          num={hasGSC ? fmtNum(total) : "—"}
          delta={hasGSC ? "+12% vs prev" : "No data yet"} deltaUp={hasGSC}
          headline="Organic visits last 30 days"
          sub={hasGSC ? `${Math.round((branded/total)*100)}% branded — heavily dependent on Banfield brand queries.` : "Connect Google Search Console to see real traffic data."}
          href="/traffic">
          <MiniBar label="Human" pct={hasGSC ? 78 : 0} gradient="linear-gradient(90deg,var(--indigo),#818CF8)" />
          <MiniBar label="Bot"   pct={hasGSC ? 22 : 0} gradient="linear-gradient(90deg,var(--purple),#A78BFA)" />
        </AbsCard>

        <AbsCard type="visible" tag="Visible-for"
          tagColor="var(--amber)" tagBg="var(--amber-tint)"
          num={totalRecs > 0 ? String(openRecs) : "—"}
          delta={highIssues > 0 ? `${highIssues} high-sev issues` : totalRecs > 0 ? "Recs loaded" : "Run seed SQL"} deltaUp={false}
          headline="Open fixes across 3 waves"
          sub={totalRecs > 0 ? `${totalRecs} recommendations seeded. Wave 1 technical foundation is the priority.` : "Run the Banfield seed SQL to populate recommendations."}
          href="/visible/1">
          <div style={{ display: "flex", gap: 10, justifyContent: "space-between" }}>
            <MiniRing pct={34} color="var(--red)"    label="Tech"     grade="C" />
            <MiniRing pct={52} color="var(--amber)"  label="Content"  grade="B" />
            <MiniRing pct={28} color="var(--indigo)" label="Off-page" grade="C" />
          </div>
        </AbsCard>

        <AbsCard type="geo" tag="GEO"
          tagColor="var(--purple)" tagBg="var(--purple-tint)"
          num="—"
          delta="Connect Rankscale" deltaUp={false}
          headline="AI Share of Voice"
          sub="Upload a Rankscale export to see where Banfield appears in AI-generated job answers."
          href="/geo">
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <MiniSov name="Banfield"         pct={14} you={true}  />
            <MiniSov name="VCA Animal Hosp." pct={31} you={false} />
            <MiniSov name="BluePearl Vet"    pct={22} you={false} />
          </div>
        </AbsCard>
      </div>

      {/* Snapshot strip */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
        {[
          { color: "var(--green)",  label: "Strengths",   items: ["Branded search queries (\"banfield careers\") perform well", "JobPosting schema present on key job listing templates", "Wave 1 technical fixes scoped and ready to execute"] },
          { color: "var(--amber)",  label: "Gaps",        items: ["Client-side rendering blocks Googlebot from indexing jobs", "Expired listings return 200 — wasting crawl budget", "AI crawlers (GPTBot, ClaudeBot) blocked in robots.txt"] },
          { color: "var(--indigo)", label: "Next Actions", items: ["Enable SSR for job listing pages (Wave 1, effort L)", "Return 404/410 for expired listings (Wave 1, effort M)", "Unblock AI bots in robots.txt (Wave 1, effort XS)"] },
        ].map(({ color, label, items }) => (
          <div key={label} style={{ background: "var(--surface)", border: "1px solid var(--line-2)", borderRadius: "var(--r-lg)", padding: "18px 20px" }}>
            <h4 style={{ margin: "0 0 12px", fontSize: 11, fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase", color, display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: color, display: "inline-block" }} />
              {label}
            </h4>
            <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 9 }}>
              {items.map((item, i) => (
                <li key={i} style={{ fontSize: 12.5, color: "var(--ink-2)", lineHeight: 1.45, display: "flex", gap: 9, alignItems: "flex-start" }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: color, marginTop: 6, flexShrink: 0 }} />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
