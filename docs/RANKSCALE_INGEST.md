# Rankscale Ingest — Real Schema (from May 23 2026 Banfield export)

> Replaces the placeholder ingest spec in `01_PLAN.md` §7. Based on Raj's actual Banfield Rankscale export sitting at `MVP Data/Rankscale_export_multiple_search_terms_18_2026-05-23_21-33-31.xlsx` — **127 rows × 140 columns** of dense AI-engine query results.

## File shape

- Single sheet (`Sheet1`).
- Header row at row 1.
- Each row = one (`query` × `ai_engine`) result, with the brand-of-interest's appearance + the top 16 competing brands.

## Column groups

### Group 1 — Run metadata (cols A–E)

| Col | Header | Type | Notes |
|---|---|---|---|
| A | `timestamp` | ISO datetime | When the query was executed |
| B | `brand_reference` | text | "Banfield Pet Hospital" — the tenant brand |
| C | `topic_name` | text | E.g., "Banfield Educational / How-To Content" — Rankscale topic cluster |
| D | `tags` | text | "-" or comma-separated tags |
| E | `query` | text | The prompt Rankscale ran |

### Group 2 — Engine + context (cols F–L)

| Col | Header | Type | Notes |
|---|---|---|---|
| F | `ai_engine` | enum | `chatgpt_gui` / `perplexity_gui` / `google_ai_overview` (and others as added) |
| G | `ai_overview` | enum | `yes`/`no`/`N/A` — whether Google AIO appeared |
| H | `chatgpt_websearch` | enum | `yes`/`no`/`N/A` |
| I | `chatgpt_model` | text | `gpt-5-5` etc. |
| J | `chatgpt_shopping` | enum | `yes`/`no`/`N/A` |
| K | `web_search_queries` | text | The expanded web searches the engine ran |
| L | `related_prompts` | text | Suggested follow-up prompts |

### Group 3 — The result text + tenant brand presence (cols M–Y)

| Col | Header | Type | Notes |
|---|---|---|---|
| M | `result_text` | text | The full AI response |
| N | `brands_total` | int | Count of distinct brands found in the response |
| O | `brand_found` | enum | `yes`/`no` — did our brand appear? |
| P | `brand_name_mentioned` | text | The exact form of the brand name in the response |
| Q | `brand_rank` | int NULL | Our brand's position (1 = first mentioned) |
| R | `brand_citations` | text | URL(s) cited for our brand |
| S | `sentiment` | numeric NULL | -1 to +1, our brand's sentiment |
| T | `sentiment_reason` | text | Why that sentiment |
| U | `positive_keywords` | text | Semicolon-separated |
| V | `neutral_keywords` | text | Semicolon-separated |
| W | `negative_keywords` | text | Semicolon-separated |
| X | `other_citations` | text | Comma-separated URLs not tied to our brand |
| Y | `visibility_score_latest` | numeric | 0–100, the latest visibility score for this query |

### Group 4 — Visibility history (cols Z–AB)

| Col | Header | Type | Notes |
|---|---|---|---|
| Z | `visibility_score_24h` | numeric | |
| AA | `visibility_score_7d` | numeric | |
| AB | `visibility_score_30d` | numeric | |

### Group 5 — Top-16 competitor breakdown (cols AC–EJ, 7 cols × 16 ranks)

For each rank 1..16, seven columns:

| Suffix | Header pattern | Type |
|---|---|---|
| `_brandname` | `rankN_brandname` | text |
| `_citations` | `rankN_citations` | URL(s) |
| `_sentiment` | `rankN_sentiment` | numeric |
| `_sentiment_reason` | `rankN_sentiment_reason` | text |
| `_positive_keywords` | `rankN_positive_keywords` | text |
| `_neutral_keywords` | `rankN_neutral_keywords` | text |
| `_negative_keywords` | `rankN_negative_keywords` | text |

So the full pattern: cols AC..AI = rank1_*; AJ..AP = rank2_*; … through rank16. Cells are `-` when that rank isn't filled.

---

## Postgres ingest

Three normalized tables instead of the 140-wide flat shape:

```sql
rankscale_runs
  id uuid PK,
  project_id uuid → projects,
  export_file_path text,
  imported_at timestamptz,
  row_count int,
  UNIQUE (project_id, export_file_path)

rankscale_prompts
  id bigserial PK,
  project_id uuid → projects,
  run_id uuid → rankscale_runs,
  query_timestamp timestamptz,           -- col A
  brand_reference text,                  -- col B
  topic_name text,                       -- col C
  tags text,                             -- col D
  query text,                            -- col E
  ai_engine text,                        -- col F (no enum constraint — Rankscale may add engines)
  ai_overview text,                      -- col G
  chatgpt_websearch text,                -- col H
  chatgpt_model text,                    -- col I
  chatgpt_shopping text,                 -- col J
  web_search_queries text,               -- col K
  related_prompts text,                  -- col L
  result_text text,                      -- col M
  brands_total int,                      -- col N
  brand_found bool,                      -- col O
  brand_name_mentioned text,             -- col P
  brand_rank int NULL,                   -- col Q
  brand_citations text[],                -- col R, split on whitespace/comma
  sentiment numeric NULL,                -- col S
  sentiment_reason text,                 -- col T
  positive_keywords text[],              -- col U
  neutral_keywords text[],               -- col V
  negative_keywords text[],              -- col W
  other_citations text[],                -- col X
  visibility_score_latest numeric,       -- col Y
  visibility_score_24h numeric,          -- col Z
  visibility_score_7d numeric,           -- col AA
  visibility_score_30d numeric,          -- col AB

rankscale_competitors
  id bigserial PK,
  project_id uuid → projects,
  run_id uuid → rankscale_runs,
  prompt_id bigint → rankscale_prompts,
  rank int CHECK (rank BETWEEN 1 AND 16),
  brand_name text,
  citations text[],
  sentiment numeric NULL,
  sentiment_reason text,
  positive_keywords text[],
  neutral_keywords text[],
  negative_keywords text[],
  UNIQUE (prompt_id, rank)
```

Indexes:
- `rankscale_prompts (project_id, ai_engine, brand_found, query_timestamp DESC)` — drives the AI Share of Voice + Prompt Grid
- `rankscale_competitors (project_id, brand_name, query_timestamp)` (denormalized timestamp) — drives competitor SOV bars

---

## How the GEO box reads this

### AI Share of Voice bars

For each tenant project, latest run, all engines:

```sql
SELECT
  brand_name,
  COUNT(*)::numeric / (SELECT COUNT(DISTINCT prompt_id) FROM rankscale_competitors WHERE project_id = $1 AND run_id = $LATEST) * 100 AS sov_pct
FROM rankscale_competitors
WHERE project_id = $1
  AND run_id = $LATEST
GROUP BY brand_name
UNION ALL
SELECT
  brand_reference,
  COUNT(*) FILTER (WHERE brand_found = true)::numeric / COUNT(*) * 100
FROM rankscale_prompts
WHERE project_id = $1 AND run_id = $LATEST
GROUP BY brand_reference
ORDER BY sov_pct DESC
LIMIT 6;
```

From the May 23 Banfield export, that returns roughly: VCA Animal Hospitals, IDEXX Laboratories, Banfield Pet Hospital, Thrive Pet Healthcare, Antech Diagnostics, … — perfect for the v3 SOV bars widget.

### Unbranded Prompt Visibility Grid

```sql
SELECT
  query,
  ai_engine,
  brand_rank
FROM rankscale_prompts
WHERE project_id = $1 AND run_id = $LATEST
  AND query NOT ILIKE '%Banfield%'           -- unbranded filter
ORDER BY query, ai_engine;
```

Pivot client-side into `prompt × engine → rank pill`.

### Citation tracking strip

```sql
-- Owned citations: jobs.banfield.com appearing in our brand's row
SELECT
  CASE
    WHEN url ILIKE '%jobs.banfield.com%' THEN 'owned'
    WHEN url ILIKE '%banfield.com%' THEN 'partial'
    ELSE 'other'
  END AS status,
  url,
  COUNT(*) AS times_cited
FROM rankscale_prompts p,
     unnest(p.brand_citations) AS url
WHERE p.project_id = $1 AND p.run_id = $LATEST AND p.brand_found = true
GROUP BY 1, 2
ORDER BY times_cited DESC;
```

Then group by source domain (wikipedia.org → Wikipedia, glassdoor.com → Glassdoor, reddit.com → Reddit, etc.) and assign Owned/Partial/Risk/Missing status.

### Brand mentions feed

Latest 20 rows where `brand_found = true`, ordered by `query_timestamp DESC`. Each card shows: query, engine icon, sentiment badge, snippet from `result_text`, "View source" link to `brand_citations[0]`.

---

## Ingest path — two modes

### Mode A: API pull (preferred once we confirm endpoint)

```ts
// /lib/sources/rankscale.ts
const rankscale = new RankscaleClient({
  apiKey: process.env.RANKSCALE_API_KEY,         // 'rk_mpiuavch_j87kysu34c'
  baseUrl: process.env.RANKSCALE_API_BASE_URL,   // 'https://rankscale.ai'
});

// Trigger a run for the Banfield brand
const runId = await rankscale.triggerAudit({
  brandId: process.env.RANKSCALE_BANFIELD_BRAND_ID, // 'E2bwD34b35KU0nvceDi5'
});

// Poll until done
await rankscale.waitForRun(runId);

// Download the export
const xlsxBuffer = await rankscale.downloadExport(runId, { format: 'xlsx' });

// Parse + ingest (shared with Mode B)
await ingestRankscaleXlsx(xlsxBuffer, { projectId, runId });
```

The exact endpoint shapes depend on Rankscale's API docs — confirm by running:

```bash
curl -H "Authorization: Bearer rk_mpiuavch_j87kysu34c" https://rankscale.ai/api/v1/brands/E2bwD34b35KU0nvceDi5
```

…and exploring the response. If endpoint names differ, swap them in the adapter; the `ingestRankscaleXlsx` parser stays the same.

### Mode B: Manual upload (fallback)

Operator drops the xlsx file into `/settings/connections/rankscale` upload zone. Server uploads to Supabase Storage at `rankscale-exports/{project_id}/{timestamp}.xlsx`, then parses + ingests using the same `ingestRankscaleXlsx` function.

The May 23 sample export already at `MVP Data/Rankscale_export_multiple_search_terms_18_2026-05-23_21-33-31.xlsx` is the Day-1 seed. Claude Code should write the parser against this file as the reference fixture, then point the API client at it once Rankscale endpoints are confirmed.

---

## Parsing notes (gotchas the parser must handle)

1. **`-` sentinel for empty cells.** Treat as `NULL`, not the literal string `-`.
2. **Brand_citations can be a single URL or comma-separated.** Split on comma + whitespace.
3. **Visibility scores are 0–100 numerics, sometimes blank.** Cast to `numeric NULL`.
4. **`brand_rank` is sometimes an empty string when `brand_found = 'no'`.** Always store `NULL`, not 0.
5. **Empty competitor cells** (rank3_brandname = "-") mean that rank doesn't exist for that query. Skip those when inserting into `rankscale_competitors`.
6. **Timestamps are UTC ISO 8601 with `.541Z` suffix.** Parse via `new Date()` or `Date.parse`; store as `timestamptz`.
7. **Query strings may contain commas, apostrophes, accents.** Use parameterized queries; never string-concat into SQL.
8. **The header row uses `rank1_brandname` not `rank1.brandname`** — underscore-separated, no dots.

---

## Refresh cadence

- **Weekly cron:** `0 4 * * 1` (Monday 4am UTC) per project. Triggers a new Rankscale audit, polls for completion, downloads, parses, writes a new `rankscale_runs` row.
- **Manual refresh:** "Re-run AEO audit" button on `/geo` triggers an out-of-cycle run.
- **Historical preservation:** every run keeps its own row. The UI shows latest by default; a "compare to last week" toggle pulls the previous run.
