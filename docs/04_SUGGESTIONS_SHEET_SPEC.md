# Banfield Tracker — Spec & Ingest (UPDATED to match the real workbook)

> **Replaces the earlier synthetic spec.** Raj's actual workbook — `Banfield · Invisible Funnel Tracker (Joveo Organic, May 2026).xlsx` — is the source of truth. The dashboard adapts to it, not vice versa.

The workbook has **5 tabs**:

| Tab | Rows | Purpose | Dashboard mapping |
|---|---|---|---|
| `Banfield Performance` | 50 rows × 21 cols | Weekly + monthly KPI tracking (metrics × time-series) | Powers Overview KPI strip + KPI history charts |
| `Snapshot` | 2 rows × 11 cols | Single-row baseline snapshot | Seed values for the Overview KPI strip on Day 1 |
| `Master Tracker` | 77 rows × 17 cols | The full list of every task across all Waves | Source of truth for `recommendations` table |
| `Top 30 · Active Sprint` | 32 rows × 12 cols | Current 3-week sprint subset | Derived view, not a separate ingest |
| `Milestone Calendar` | 14 rows × 6 cols | Phase milestones by date | Powers Visible-for Wave-tower checkpoints |

Action: **Upload this xlsx to Google Sheets** (File → Open in Google Sheets, then Save as Google Sheets). Grab the resulting Google Sheet URL → put the Sheet ID into `BANFIELD_SUGGESTIONS_SHEET_ID` in Vercel + `.env.local`. The dashboard reads via your `raj.khot@joveo.com` OAuth grant on the Sheets API.

---

## Tab 1 — `Banfield Performance` (KPI time-series)

**Layout:** Pivoted by time. Each row is a metric, each column is a date. First col is the metric group, second col is the metric name, then 12 weekly columns, then 4 monthly columns, then "Q3 2026", "12-Mo Target", "Source / Notes".

**Metric groups** (in Col A as section headers):
- `TECHNICAL HEALTH (Layer 1)` — Indexed pages, SSR coverage %, Schema coverage %, AI-bot allowlist (binary), TTFB, etc.
- `CONTENT HEALTH (Layer 2)` — Hub pages live, Blog articles published, City pages live, etc.
- `OFF-PAGE / AEO (Layer 3)` — Wikipedia presence (binary), Glassdoor response rate, Reddit thread count, etc.
- `ORGANIC PERFORMANCE` — Total clicks, Impressions, CTR, Avg position, Branded clicks, Non-branded clicks
- `AEO PERFORMANCE` — Mars Combined AI Detection %, Citations to jobs.banfield.com, ChatGPT visibility %, Perplexity visibility %, AIO visibility %

### Ingest spec

When the Sheets sync runs, this tab gets parsed as a **wide-format time-series** and written to a new `metrics_history` table:

```sql
metrics_history
  id bigserial PK,
  project_id uuid → projects,
  metric_group text,         -- 'technical_health' | 'content_health' | 'off_page' | 'organic_performance' | 'aeo_performance'
  metric_name text,          -- 'indexed_pages' | 'ssr_coverage_pct' | …
  observed_at date,
  cadence enum('weekly','monthly','quarterly','target'),
  value numeric NULL,
  value_text text NULL,      -- for binary 'yes/no' or free-text targets
  source_note text,
  UNIQUE (project_id, metric_name, observed_at, cadence)
```

The Overview KPI strip reads the latest row per `metric_name`. The trend sparkline reads the last 12 weeks for that metric.

---

## Tab 2 — `Snapshot` (Day-1 baseline)

**Layout:** Two-row table. Row 1 = headers. Row 2 = current values.

Header columns:
`Date | Indexed Pages | Total Organic Traffic (est. mo.) | Total Keywords Ranking | Branded Clicks (mo.) | Non-branded Clicks (mo.) | Total Impressions (mo.) | Avg CTR | Mars Combined AI Detection % | Citations to jobs.banfield.com (per 30 q.) | Notes`

### Ingest spec

This tab is **only read once** during initial seed. The values populate `metrics_history` with `cadence = 'weekly'` at the snapshot date. After that, weekly columns from Tab 1 drive everything.

---

## Tab 3 — `Master Tracker` (THE source of truth for `recommendations`)

**Layout:** Header in row 2 (row 1 is a title). 17 columns:

| Col | Header | Maps to `recommendations.` |
|---|---|---|
| A | `ID` | `external_id` (e.g., `BF-01`, `BF-77`) |
| B | `Task` | `title` |
| C | `Layer` (`Tech` / `Content` / `Off-page`) | derived → `kind` family |
| D | `Wave` (`Wave 1 · Technical` / `Wave 2 · …` / `Wave 3 · …`) | parsed → `wave_number` (1/2/3) |
| E | `Week` (1–12) | `target_week` (new col) |
| F | `Priority` (`P1`/`P2`/`P3`) | parsed → `impact_score` bucket (P1=80–100, P2=50–79, P3=1–49) |
| G | `Effort` (`XS`/`S`/`M`/`L`) | `effort` |
| H | `Owner(s)` (`Joveo` / `Banfield Eng` / `Joveo + Banfield Eng`) | `owner` |
| I | `ETA` (date) | `eta` |
| J | `Status` (`Not Started` / `In Progress` / `Done` / `Blocked` / `Wontfix`) | normalized → `status` |
| K | `Blocks / Dependencies` | `dependencies_text` (new col) |
| L | `Estimated Impact` | `impact_text` |
| M | `Source (audit)` (e.g., `Joveo Technical Crawl · Indexability Audit`) | `evidence_source` (free-text in MVP) |
| N | `Joveo Comments` | `joveo_notes` (new col) |
| O | `Client / Mars Comments` | `client_notes` (new col) |
| P | `Completed Date` | `completed_at` (new col) |
| Q | `Doc Link` | `doc_link` (new col) |

### Updated `recommendations` schema (revised from `01_PLAN.md` §4.4)

```sql
recommendations
  id uuid PK,
  project_id uuid → projects,
  external_id text NOT NULL,           -- 'BF-01' etc.
  wave_number int CHECK (wave_number IN (1,2,3)),
  layer enum('tech','content','off_page'),
  kind enum('quick','seasonal','competitor','evp','technical','content','off_page'),
  title text NOT NULL,
  target_week int NULL,                -- 1-12
  priority enum('P1','P2','P3'),
  effort enum('XS','S','M','L'),
  impact_score int,                    -- derived 1-100 from priority + manual override
  impact_text text,
  owner text,
  eta date NULL,
  status enum('not_started','scheduled','in_progress','blocked','done','wontfix'),
  dependencies_text text,
  evidence_source text,                -- free-text in MVP since Master Tracker uses long source labels
  joveo_notes text,
  client_notes text,
  completed_at date NULL,
  doc_link text,
  -- legacy fields kept for forward-looking features:
  page_url text NULL,
  cms_path text NULL,
  fix_steps jsonb,                     -- populated by Claude on demand from `title` + `impact_text`
  resolves_issue_ids uuid[],
  pillar_id uuid NULL → keyword_pillars,
  created_at, last_modified_at,
  UNIQUE (project_id, external_id)
```

### Ingest behavior

- **Frequency:** daily cron at `0 5 * * *` UTC. Manual "Refresh from Sheet" button on `/recommendations` triggers immediately.
- **Read:** Sheets API → `spreadsheets.values.get` with range `Master Tracker!A3:Q1000` (skip the two title/header rows).
- **Upsert key:** `(project_id, external_id)`. Sheet wins for all columns except dashboard-only fields (`fix_steps`, `resolves_issue_ids`, `pillar_id` — these can be enriched by Claude inside the app and persist).
- **Wave parsing:** `"Wave 1 · Technical"` → `wave_number=1, layer='tech'`. `"Wave 2 · Content"` → `wave_number=2, layer='content'`. Etc.
- **Status normalization:** map sheet values to lowercase snake_case. `"Not Started" → "not_started"`. Unknown values → `'not_started'` and log a warning.
- **Priority → impact_score:** P1 = default 90 (range 80–100), P2 = default 65 (range 50–79), P3 = default 30 (range 1–49). If `Estimated Impact` text contains a number like `+842 clicks/mo`, attempt to nudge impact_score higher within the band.
- **Validation:** Zod schema enforces enums. Bad rows go to a `sheet_ingest_errors` table with row number + cell + error.

### Manual edits inside the dashboard

For MVP we go **sheet-wins** one-way. Operators who edit status in the UI need to be told "the next sheet sync will overwrite your change unless you also update the sheet." Post-MVP: bi-directional sync via Sheets API `values.update`.

---

## Tab 4 — `Top 30 · Active Sprint`

Subset of Master Tracker (current 3-week sprint). Same `ID` keys.

**Ingest:** *not* a separate table. The dashboard derives this view in SQL:

```sql
-- "Active Sprint" view:
SELECT * FROM recommendations
WHERE project_id = $1
  AND status IN ('not_started','in_progress','blocked')
  AND target_week BETWEEN $current_week AND $current_week + 2
ORDER BY priority ASC, impact_score DESC
LIMIT 30;
```

So no ingest from Tab 4. Tab 4 stays in the sheet for the operator's manual planning view.

---

## Tab 5 — `Milestone Calendar`

**Layout:** 6 columns: `Date | Week | Phase | Milestone | Owner | Link`.

Powers the Visible-for **Wave tower checkpoints** and the Overview "What's next this week" card.

### Ingest spec

```sql
milestones
  id uuid PK,
  project_id uuid → projects,
  scheduled_for date,
  week_number int,
  phase text,                          -- 'Kickoff' | 'Wave 1' | 'Wave 2' | 'Wave 3' | 'Checkpoint'
  milestone text,
  owner text,
  link text NULL,
  status enum('upcoming','due','overdue','done'),
  UNIQUE (project_id, scheduled_for, milestone)
```

Sync cadence: same daily cron as Master Tracker.

---

## What "the sheet wins" + "the dashboard enriches" looks like

| Field | Owner | Why |
|---|---|---|
| `external_id`, `title`, `wave_number`, `priority`, `effort`, `owner`, `eta`, `status`, `impact_text`, `evidence_source` | **Sheet** | Raj's working document, edited by humans during sprint planning |
| `fix_steps` (numbered, CMS-pathed), `resolves_issue_ids`, `pillar_id` | **Dashboard (Claude)** | Generated on demand by clicking "Draft fix steps" inside Fix Detail; persist in Postgres |
| `last_modified_at` | **Dashboard** | Tracks when *we* last touched the row |
| `joveo_notes`, `client_notes` | **Sheet** (read), **Dashboard read-only** | These already exist as workflow today |

---

## Day-1 demo path with this sheet

When Claude Code wires up the Sheets ingest in Slice 3:

1. **Master Tracker → `recommendations`** populates with all 77 real Banfield tasks (BF-01 to BF-77+). Wave Tower lights up. Recommendations Inbox filters work. Top 30 view derives.
2. **Banfield Performance → `metrics_history`** populates Overview KPI strip with real numbers (Indexed pages: 4974, Total Organic Traffic: ~8K-10K, etc.).
3. **Snapshot** is the Day-1 baseline shown next to the latest values.
4. **Milestone Calendar → `milestones`** populates Wave tower checkpoints + "What's next" card.

No invented data. Every number traces back to the sheet, which traces back to GSC + the Mars Vet Health master plan.
