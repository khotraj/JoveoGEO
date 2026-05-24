# Screaming Frog Export Ingest

> Replaces the SF MCP design from `01_PLAN.md`. SF runs locally on Raj's machine; exports are uploaded to the dashboard.

## How operators feed SF data in

1. Operator opens Screaming Frog on their machine, crawls the target career site.
2. **Bulk Export → All Inlinks + Internal: HTML** (or **Reports → All Reports → All as XLSX**).
3. Save the file to disk.
4. In the dashboard: `/settings/connections/screaming-frog` → drag-drop zone → uploads to Supabase Storage at `screaming-frog-exports/{project_id}/{ISO-timestamp}.xlsx`.
5. A server action triggers `/api/sync/sf` which parses the file and writes to Postgres.

For Banfield's first ingest, drop the SF export into a folder on Raj's machine that the dashboard watches **once** (one-time bootstrap), or use the same drag-drop UI.

Folder convention if you want to pre-stage exports before the upload UI exists:
```
MVP Data/screaming-frog-exports/
  banfield/
    2026-05-24__banfield-internal-all.xlsx
    2026-05-24__banfield-issues.xlsx
```

## What columns we expect from a Screaming Frog "Internal All" export

SF's default Internal tab columns (the ones the parser uses):

| SF column | Maps to |
|---|---|
| `Address` | `sitemap_urls.url` |
| `Content Type` | filter to `text/html` only |
| `Status Code` | `crawl_findings.status_code` |
| `Status` | `crawl_findings.status_text` |
| `Indexability` | `crawl_findings.indexability` (`Indexable` / `Non-Indexable`) |
| `Indexability Status` | `crawl_findings.indexability_reason` |
| `Title 1` | `crawl_findings.title` |
| `Title 1 Length` | `crawl_findings.title_length` |
| `Meta Description 1` | `crawl_findings.meta_description` |
| `Meta Description 1 Length` | `crawl_findings.meta_description_length` |
| `H1-1` | `crawl_findings.h1` |
| `H1-1 Length` | `crawl_findings.h1_length` |
| `Canonical Link Element 1` | `crawl_findings.canonical_url` |
| `Word Count` | `crawl_findings.word_count` |
| `Crawl Depth` | `crawl_findings.crawl_depth` |
| `Inlinks` | `crawl_findings.inlinks_count` |
| `Outlinks` | `crawl_findings.outlinks_count` |
| `Response Time` | `crawl_findings.response_time_s` |
| `Size (bytes)` | `crawl_findings.size_bytes` |
| `Hash` | `crawl_findings.content_hash` (for change detection across runs) |
| `Structured Data` | `crawl_findings.structured_data_types` (JobPosting / Organization / FAQPage / BreadcrumbList) |

If you also export the "Reports → Crawl Overview" tab, we additionally pull:
- Total URLs, indexable %, non-indexable %, JS-rendered count, expired-job 404 count, orphan-page count.

## Postgres tables

```sql
crawl_runs
  id uuid PK,
  project_id uuid → projects,
  source enum('sf_export','playwright','sf_mcp'),
  uploaded_file_path text NULL,         -- Supabase Storage path
  total_urls int,
  indexable_count int,
  non_indexable_count int,
  expired_jobs_count int,
  orphan_pages_count int,
  imported_at timestamptz

crawl_findings
  id bigserial PK,
  project_id uuid → projects,
  run_id uuid → crawl_runs,
  url text,
  status_code int,
  status_text text,
  indexability text,
  indexability_reason text,
  title text,
  title_length int,
  meta_description text,
  meta_description_length int,
  h1 text,
  h1_length int,
  canonical_url text,
  word_count int,
  crawl_depth int,
  inlinks_count int,
  outlinks_count int,
  response_time_s numeric,
  size_bytes int,
  content_hash text,
  structured_data_types text[],
  page_type enum('home','role','location','evp','blog','jd','other') NULL,
  UNIQUE (run_id, url)
```

`sitemap_urls` from the original plan stays, populated from the same export's URL list (with `found_in_sitemap` left NULL when SF found it via crawl-not-sitemap).

## How the dashboard uses crawl findings

- **Visible-for / Technical Health ring score**: weighted blend of `indexable_count / total_urls`, `expired_jobs_count` (inverse), `orphan_pages_count` (inverse), schema coverage (`structured_data_types` containing JobPosting on JD pages, etc.).
- **Wave 1 issue rows**: derived rules over crawl_findings (e.g., `status_code = 404 AND url LIKE '%/jobs/%'` → "Expired job 404s" issue with affected page count).
- **Discovery Mode**: when no SF export exists for a tenant, Playwright does a smaller crawl. When an SF export lands later, it supersedes the Playwright data on next ingest.

## Parsing notes (gotchas)

1. SF's XLSX has the data on a sheet named like `Internal_All` or `internal_all`. Probe by sheet name pattern.
2. Row 1 is the header; data starts row 2.
3. Empty cells in numeric columns are `""` not `0`. Treat as `NULL`.
4. `Structured Data` is a comma- or semicolon-separated string. Split.
5. SF exports can be 100MB+. Parse in chunks via `xlsx`'s `readFile({ sheetRows: ..., sheets: [...] })` or stream.
6. Crawl-depth `0` = root. Use `<= 2` as "near root" filter for the v3 traffic-distribution bar.

## Refresh cadence

- Operator drives. Whenever you re-crawl in SF, upload the new export. A "Re-run technical audit" button on `/visible/1` (Wave 1) makes this one click + drag-drop.
- Each upload writes a new `crawl_runs` row. Historical comparison: "Tech Health went from C+ to B between May 23 and June 1 — here's what changed" is a v2 feature, not MVP.
