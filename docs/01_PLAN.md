# Career Site SEO + GEO Command Center — Architecture & Build Plan

**Author's note (Raj reading this):** This is the document you hand to anyone — yourself in three weeks, a developer joining, a Joveo exec asking "what is this?" It is opinionated. Where there's a choice, the recommended path is called out and the alternatives are footnoted, not buried.

---

## 0. Executive Summary

We are building a multi-tenant web app that turns the **manual SEO + GEO + GEO-audit workflow** Raj currently runs (Screaming Frog + Ahrefs + Rankscale + GSC + GA4 + Claude + Google Sheets) into a single, screen-shareable **Command Center** — exactly the v3 mockup Raj has already designed.

The product has **two modes** that share one app shell:

1. **Live Mode** — for tenants where we have OAuth into Google Search Console + Google Analytics 4. Banfield is the first Live Mode tenant. The Command Center pulls real GSC/GA4 every night, fuses it with Rankscale's AEO data, and presents the v3 surface against real numbers.

2. **Discovery Mode** — for prospects where we have *nothing but a career-site URL*. Background workers fetch the site, read the sitemap, scrape the job board, identify the company + country + sector, run SERP queries on `role + location` to identify top-5 competitors, hit Ahrefs for keyword overlap, and produce a credible Command Center surface within minutes. "Nothing is entirely impossible" — we gray out only what's truly blocked (e.g., GSC-only widgets), not entire screens.

The **3-Box mental model** from Raj's Productize doc is the product's spine:

- **Box 1 — Traffic** (Human + Bot lanes, drill-downs to AI sources & off-site sources, GSC + Pillar insights band)
- **Box 2 — Visible-for** (Technical / Content / Off-Page health rings + Wave 1 / Wave 2 / Wave 3 tower-of-blocks + Issues + tasks)
- **Box 3 — GEO** (AI Share of Voice + Unbranded Prompt Visibility Grid + Citation tracking + Brand mentions feed — powered by Rankscale)

Plus a **Recommendations Inbox** (sidecar, equal weight to the 3 boxes) that's the single source of truth for every actionable fix surfaced from any box. Wave drawers inside Visible-for are filtered views of this same list.

The MVP demo target: a real Banfield Live Mode tenant + a Discovery Mode tenant created from a URL in front of the audience. v3 design language **exactly** (refined light cockpit, Inter + JetBrains Mono, indigo→purple brand mark). Built on Next.js (App Router) + Supabase + Vercel + Anthropic Claude API + Ahrefs + Rankscale + SerpAPI + Screaming Frog MCP. Multi-tenant from day one.

---

## 1. Product North Star

### 1.1 What problem this solves

A career-site SEO + GEO audit today takes Raj's team **2–4 weeks** of manual stitching across Screaming Frog crawls, Ahrefs exports, Semrush queries, Rankscale runs, GSC + GA4 pulls, Google searches, manual Reddit/Glassdoor reads, and Claude conversations — culminating in a Keyword Pillar Strategy doc, a SEO & GEO Enhancement Audit doc, an Executive Briefing deck, and per-listing JD Suggestion dossiers. The "deliverable" is a stack of artifacts. The next iteration restarts the manual pull.

The Command Center collapses that cycle to **continuous**. The artifacts become living views, not snapshots. The work shifts from "produce a PDF" to "resolve a queue."

### 1.2 The 3-Box mental model (verbatim from the Productize doc)

> "1. Traffic box / 2. Visible for box - Activity tracker / 3. GEO box"

These three boxes are the **only** top-level concepts the user is allowed to navigate by. Every other surface — Overview, Recommendations Inbox, Issue Inspector, Fix Detail, Discovery Mode setup — is either a hub (Overview), a filter over one of the boxes (Recommendations is just `box ∈ {Traffic, Visible-for, GEO}` un-pivoted), or a detail view of an item inside a box.

This constraint is what keeps the product mentally cheap. **If a feature can't be located inside one of the 3 boxes, it doesn't belong in MVP.**

### 1.3 Personas

| Persona | Role | What they do in the app | Mode in MVP |
|---|---|---|---|
| **Operator** (Raj + Joveo SEO/GEO team) | Read everything, resolve recommendations, configure tenants, run Discovery, connect GSC/GA4 | Logs in via Supabase magic link. Day-to-day user. | Read + write |
| **Client TA leadership** | View their own Command Center for transparency | Does **not** log in during MVP. Sees the Command Center over Raj's screen-share during demos & QBRs. | Read-only (post-MVP) |
| **Joveo exec** | Sees the demo, asks the questions | Does not interact. Reacts. | N/A |

### 1.4 Two modes — when to use which

**Live Mode** (Banfield in MVP):
- We have GSC OAuth and GA4 OAuth grants from the client's Google account, with property-level access for that career site.
- All 3 boxes are fully populated with real data.
- Sync cadence: GSC nightly, GA4 nightly, Rankscale on its own schedule, Suggestions Sheet on edit (or daily).
- Visible widgets: every widget in the v3 mockup.

**Discovery Mode** (any prospect, any URL):
- The operator pastes a career-site URL (and optionally uploads a CSV of job titles).
- Background workers do everything else over ~5–15 minutes.
- All 3 boxes are populated with derivable data; the rest is graded "Estimated" or grayed with a clear "Connect GSC to unlock" prompt.
- Sync cadence: re-run on demand or weekly.
- **Discovery Mode IS the demo "magic moment."** A URL goes in, and a Command Center comes out.

---

## 2. Demo Storyboard (5-minute walkthrough)

The demo flow Raj runs in front of a client. This dictates what must work and in what order.

**Beat 1 — "Here's your career site as we see it" (60s).** Open the app to the Banfield tenant. Overview screen. KPI strip: Monthly Organic Visits, AI Visibility (Unbranded), Branded/Unbranded split, Paid-Equivalent Leak. Three abstraction cards (Traffic / Visible-for / GEO) with quick numbers. Tagline: "this is what we found and we have a 12-week plan."

**Beat 2 — "Here's what's broken and what to fix" (90s).** Click Visible-for. The Wave 1 / 2 / 3 tower of blocks animates in (Wave 1 green for Sitemap & Schemas, amber for Load Time, gray for the rest). Issues drawer opens — three actual Banfield issues: client-side rendering on 2,329 URLs, 14,985 expired-job 404s, missing AI-bot allowlist. Each issue has a "What people see" and "What AI sees" panel. One click into an Issue → "View linked fix" → the Recommendations Inbox opens to that fix with the literal CMS steps.

**Beat 3 — "Here's where AI sees you (and where it doesn't)" (60s).** Click GEO. AI Share of Voice horizontal bars: VCA 23.1%, NVA 19.8%, Vetcor 16.3%, Banfield 14.2%, MedVet 8.7%, Thrive 4.5%. Unbranded Prompt Grid: 8–10 prompts × 4 engines (ChatGPT / Perplexity / Google AIO / Gemini) showing rank pills (#1 / #3 / —). Citation tracking strip (Wikipedia / Glassdoor / Reddit / LinkedIn / DVM360 with Owned/Partial/Risk/Missing badges). Brand mentions feed showing real recent items.

**Beat 4 — "This works for anyone, not just Banfield" (90s).** Top-right "+ New Project" → paste `jobs.touchmark.com` or a prospect's URL → click Create. The app navigates to the Discovery Mode progress page with a real animated pipeline ("Fetching site… Reading sitemap… Found 47 job listings… Identifying competitors via SERP… Pulling Ahrefs keyword overlap… Generating recommendations…"). 5–8 minutes later (we cheat by pre-running it 10 minutes before the demo if needed), the tenant is fully populated and we navigate into it. **This is the money moment.**

**Beat 5 — "Wave 2 turns into real artifacts" (60s).** Back to Banfield → Recommendations Inbox → filter by Wave 2 → click "Vet Assistant Jobs hub". The Fix Detail shows the CMS path ("Site Pages → /careers/vet-assistant-jobs → Create new pillar page"), the keyword pillar this serves, the projected impact (+842 clicks/mo at current CTR), and a "Generate page brief" button that calls Claude and produces a 700-word optimized draft following the LATAM JD Suggestions structure. Optional: also show "Generate Executive Briefing PDF" which composes the Touchmark-style briefing from live data.

That's the demo. Everything in the build plan exists to make these five beats real.

---

## 3. System Architecture

### 3.1 High-level shape

```
┌──────────────────────────────────────────────────────────────────────┐
│                       Browser (Operator on Vercel URL)                │
│                                                                      │
│   Next.js (App Router) — React 19 — Tailwind w/ v3 design tokens     │
│   ─────────────────────────────────────────────────────────────────  │
│   /                   → Overview                                     │
│   /traffic            → Box 1                                        │
│   /visible/[wave]     → Box 2 (waves are tabs inside the screen)     │
│   /geo                → Box 3                                        │
│   /recommendations    → Sidecar inbox                                │
│   /recommendations/[id] → Fix detail                                 │
│   /issues/[id]        → Issue inspector                              │
│   /discover           → Discovery mode setup + progress              │
│   /settings/connections → GSC, GA4, Rankscale, Sheets connections    │
└──────────────────────────────────────────────────────────────────────┘
                  │                                  ▲
                  │  RSC fetches + server actions    │ live updates via
                  ▼                                  │ Supabase Realtime
┌──────────────────────────────────────────────────────────────────────┐
│              Vercel (Next.js server + Route Handlers + Cron)         │
│                                                                      │
│  /api/auth/[…]        — Supabase Auth (magic link, @joveo.com only)  │
│  /api/connect/gsc     — GSC OAuth callback                           │
│  /api/connect/ga4     — GA4 OAuth callback                           │
│  /api/connect/sheets  — Sheets API OAuth callback                    │
│  /api/sync/gsc        — manual trigger (also called by cron)         │
│  /api/sync/ga4        — manual trigger                               │
│  /api/sync/rankscale  — pulls export, parses, writes                 │
│  /api/sync/sheets     — pulls Suggestions sheet                      │
│  /api/discover        — kicks off Discovery pipeline                 │
│  /api/discover/status — polls pipeline progress                      │
│  /api/claude/insight  — generates insight cards for Traffic band     │
│  /api/claude/brief    — generates Page Brief / Exec Briefing         │
│                                                                      │
│  Vercel Cron:                                                        │
│    0 2 * * *  → /api/sync/all  (nightly GSC + GA4 sync per tenant)   │
│    0 4 * * 1  → /api/sync/rankscale (weekly Rankscale pull)          │
│    */15 * * * * → /api/discover/tick (drives Discovery workers)      │
└──────────────────────────────────────────────────────────────────────┘
                  │                                  ▲
                  ▼                                  │
┌──────────────────────────────────────────────────────────────────────┐
│  Supabase: Postgres + Auth + Realtime + Storage + Edge Functions     │
│                                                                      │
│  Tables (see § Data Model):                                          │
│    tenants, projects, connections, oauth_tokens,                     │
│    gsc_queries_daily, gsc_pages_daily, gsc_coverage,                 │
│    ga4_sessions_daily, ga4_conversions_daily,                        │
│    rankscale_runs, rankscale_prompts, rankscale_citations,           │
│    sitemap_urls, scraped_jobs, serp_results, competitors,            │
│    ahrefs_keywords, keyword_pillars, recommendations, fixes,         │
│    waves, tasks, insights_band, mentions_feed                        │
│                                                                      │
│  Storage buckets: rankscale-exports/, screaming-frog-crawls/         │
│  RLS: by tenant_id everywhere; only @joveo.com auth                  │
└──────────────────────────────────────────────────────────────────────┘
                  ▲                                  ▲
                  │                                  │
   ┌──────────────┴───────┐         ┌────────────────┴────────────┐
   │ External read APIs   │         │ External write/inference     │
   │                      │         │                              │
   │  • GSC API           │         │  • Anthropic Claude API      │
   │  • GA4 Data API      │         │     (Sonnet 4.6 default,     │
   │  • Google Sheets API │         │      Opus 4.6 for briefs)    │
   │  • Ahrefs API v3     │         │  • (optional) image gen      │
   │  • Rankscale API     │         │                              │
   │  • SerpAPI (Serper)  │         │                              │
   │  • Screaming Frog    │         │                              │
   │    MCP / fallback    │         │                              │
   │    Cloud Run crawler │         │                              │
   └──────────────────────┘         └──────────────────────────────┘
```

### 3.2 Why these choices

**Next.js (App Router) over a separate API + SPA.** One repo, one deploy, one auth context. Server Components let us fetch from Supabase server-side and stream the v3 dense layouts without prop-drilling. Route Handlers cover the API surface without a separate Express/FastAPI server. The whole stack ships in one Vercel project.

**Supabase over Vercel Postgres alone.** Three things Supabase brings that we'd otherwise hand-build: (a) magic-link auth restricted to `@joveo.com` for free, (b) Row-Level Security policies on `tenant_id` so a misrouted query can't leak data across tenants, (c) Realtime channels so the Discovery Mode progress page can subscribe to status updates without polling. Supabase Storage also gives us a versioned bucket for Rankscale exports and Screaming Frog crawl files.

**Vercel Cron over a separate scheduler.** Vercel Cron is enough for our cadence (nightly GSC/GA4 syncs, weekly Rankscale pull, 15-minute Discovery tick). If we outgrow it (each job > 60s on Hobby/Pro), the Discovery long-running steps become **Supabase Edge Functions** or **Cloud Run jobs** triggered by the cron, with state in Postgres. Not Day 1.

**Claude over OpenAI.** Per Raj's instruction. Sonnet 4.6 is the default for cheap insight generation and recommendation reasoning; Opus 4.6 is used only for high-stakes long-context generation (Executive Briefings, multi-page Pillar Strategy drafts). Anthropic key in Vercel env.

**Ahrefs over Semrush.** Ahrefs has a cleaner API and Raj already has access. Semrush is optional later for cross-checks.

**SerpAPI / Serper.dev** for SERP querying in Discovery Mode. Both work; Serper is cheaper. Confirm in `02_SETUP.md`.

**Screaming Frog MCP** if available; else a thin **Cloud Run crawler** using Playwright. The crawl emits a JSON of URLs + status codes + schema presence + title/meta/H1 lengths + internal link graph — that's what Discovery Mode actually needs.

### 3.3 What's explicitly out of scope for MVP

- ATS integration (conversion to Hired stage). Career Site Analytics V2 has this; we don't need it for the GEO Cockpit MVP.
- Server log ingestion (the Bot lane's non-Googlebot crawl data). v3 shows this prominently — we render the panel with available signal (Googlebot crawl from GSC, AI-bot UA list from a static config + Rankscale's AEO data), and a "Connect log source" affordance for later.
- Slack/email digests. Easy to add later. Not Day 1.
- Client-facing read-only mode. Same.
- Mobile responsive beyond "doesn't break." Demo is on desktop.

---

## 4. Data Model

Postgres schema in Supabase. Tenant-scoped throughout via Row Level Security. Date fields are `timestamptz`. IDs are UUIDs except where natural keys exist (e.g., GSC query strings).

### 4.1 Tenancy & identity

```
tenants
  id uuid PK, name text, created_at, created_by uuid → auth.users
  -- only one tenants row for now ("Joveo"); kept for future multi-org

users (managed by Supabase Auth; we mirror role)
  id uuid PK (= auth.users.id), email text, role enum('operator','admin'), tenant_id → tenants

projects
  id uuid PK, tenant_id → tenants, slug text unique,
  display_name text, root_url text, mode enum('live','discovery'),
  company_name text, country_code text, sector text, language_codes text[],
  created_at, last_synced_at, last_discovery_run_id uuid

connections
  id uuid PK, project_id → projects, provider enum('gsc','ga4','sheets','rankscale','ahrefs'),
  status enum('not_connected','connecting','connected','error','expired'),
  external_property_id text,   -- e.g. GSC site URL, GA4 property ID
  last_synced_at, last_error text, scopes text[],
  created_by → users

oauth_tokens
  id uuid PK, connection_id → connections,
  access_token_enc bytea,  -- pgsodium encrypted
  refresh_token_enc bytea,
  expires_at, scope text
```

**Note:** OAuth tokens are encrypted at rest using **pgsodium** (Supabase's column-level encryption). Never log them, never expose them through PostgREST. Server-only access via a `SECURITY DEFINER` function.

### 4.2 Discovery Mode artifacts

```
discovery_runs
  id uuid PK, project_id → projects,
  status enum('queued','crawling','scraping_jobs','running_serp',
              'fetching_ahrefs','inferring','generating_recs','done','error'),
  progress_pct int, started_at, completed_at,
  error_step text, error_message text

sitemap_urls
  id uuid PK, project_id, url text, last_modified, found_in_sitemap text,
  status_code int, page_type enum('home','role','location','evp','blog','jd','other')

scraped_jobs
  id uuid PK, project_id, source_url text,
  job_title text, location_city text, location_region text, location_country text,
  posted_at, scraped_at, raw_html_storage_path text

serp_results
  id uuid PK, project_id, query text, location text, engine enum('google'),
  serp_json jsonb,  -- the raw SerpAPI response
  scraped_at

competitors
  id uuid PK, project_id, root_url text, brand_name text,
  detected_via text,  -- 'serp_overlap' | 'ahrefs_top_traffic' | 'manual'
  serp_overlap_count int, ahrefs_keyword_count int, ahrefs_domain_rating int,
  rank_priority int  -- 1-5, only top-5 kept
```

### 4.3 SEO/AEO inputs

```
gsc_queries_daily
  id bigserial PK, project_id, date date, query text,
  impressions int, clicks int, ctr numeric, position numeric,
  device enum('desktop','mobile','tablet'), country text, page text NULL,
  UNIQUE (project_id, date, query, device, country, page)

gsc_pages_daily
  id bigserial PK, project_id, date date, page text,
  impressions int, clicks int, ctr numeric, position numeric,
  UNIQUE (project_id, date, page)

gsc_coverage
  id bigserial PK, project_id, captured_at,
  state enum('indexed','crawled_not_indexed','discovered_not_indexed',
             'redirect','blocked_robots','soft_404','not_found_404',
             'duplicate_no_canonical','alternate_canonical','other'),
  count int, examples text[]

ga4_sessions_daily
  id bigserial PK, project_id, date date,
  sessions int, users int, new_users int, engagement_time_avg_sec numeric,
  bounce_rate numeric, source text, medium text, campaign text NULL

ga4_conversions_daily
  id bigserial PK, project_id, date date,
  event_name text, count int, conversion_value numeric NULL

rankscale_runs
  id uuid PK, project_id, run_started_at, run_finished_at,
  status enum('queued','running','done','error'),
  export_storage_path text,  -- bucket: rankscale-exports/
  raw_summary jsonb

rankscale_prompts
  id bigserial PK, project_id, run_id → rankscale_runs,
  prompt text, engine enum('chatgpt','perplexity','aio','gemini','claude'),
  brand_appears bool, rank int NULL, snippet text NULL, captured_at

rankscale_citations
  id bigserial PK, project_id, run_id → rankscale_runs,
  source text,  -- 'wikipedia','glassdoor','reddit','linkedin','dvm360','other'
  url text, status enum('owned','partial','risk','missing'),
  notes text, captured_at

ahrefs_keywords
  id bigserial PK, project_id,
  keyword text, country text, volume int, kd int,
  position int NULL, our_url text NULL, captured_at,
  pillar_id uuid NULL → keyword_pillars

keyword_pillars
  id uuid PK, project_id,
  name text,  -- 'Branded Fortress','Role Head','Salary/Day-in-life',
              -- 'Location Hubs','Role×Location','AI-answer/FAQ',
              -- 'Benefits/EVP','Editorial Blog','Competitive Terms'
  governance_class enum('FORT','DEFEND','EXCL','DIFF','SR','NEW')
```

### 4.4 The Recommendations spine (the heart of the app)

```
waves
  id uuid PK, project_id,
  wave_number int CHECK (wave_number IN (1,2,3)),
  grade text,        -- 'A','B+','B','C+','C' — drives the v3 tower header
  blocks jsonb       -- the tower-of-blocks state: [{label, shaded:bool, color}]

issues
  id uuid PK, project_id,
  category enum('seo_technical','seo_content','seo_off_page',
                'geo_visibility','geo_citation','cwv','schema'),
  severity enum('critical','high','medium','low'),
  title text, user_sees text, ai_sees text,
  pages text[] NULL,
  cwv jsonb NULL,    -- {lcp,fcp,cls} per page where relevant
  detected_at, source enum('gsc','ga4','rankscale','sf_crawl','sheet','claude','manual'),
  status enum('open','in_progress','resolved','wontfix')

recommendations
  id uuid PK, project_id,
  wave_number int CHECK (wave_number IN (1,2,3)),
  kind enum('quick','seasonal','competitor','evp','technical','content','off_page'),
  title text,
  page_url text NULL, cms_path text NULL,
  impact_text text,  -- '+842 clicks/mo at current CTR'
  impact_score int,  -- 1-100 used for sorting
  effort enum('XS','S','M','L'),
  owner text NULL, eta date NULL,
  status enum('open','scheduled','in_progress','done','wontfix'),
  fix_steps jsonb,   -- [{text, cms_path?}]
  resolves_issue_ids uuid[],
  evidence_source enum('joveo_internal','client_audit','pillar_strategy',
                        'gfj_best_practice','manual'),
  pillar_id uuid NULL → keyword_pillars,
  created_at, last_modified_at

insights_band  -- the "GSC + Pillar insights" cards on the Traffic screen
  id uuid PK, project_id,
  category enum('seasonal','quick_win','competitor','content_gap'),
  title text, body text, projected_impact text,
  generated_by enum('claude','rule_based','manual'),
  source_query text NULL,
  added_to_tracker bool default false,
  recommendation_id uuid NULL → recommendations,
  generated_at

mentions_feed  -- the GEO box "Brand mentions" widget
  id bigserial PK, project_id,
  source text, url text, title text, snippet text,
  sentiment enum('positive','neutral','negative','unclear') NULL,
  tag enum('opportunity','win','risk') NULL,
  captured_at
```

### 4.5 Two things this schema gets right

**(a) `recommendations` is the universal currency.** Wave drawers in Visible-for are `WHERE wave_number = 1` filtered views. The Recommendations Inbox is unfiltered. The "Add to Tracker" buttons everywhere insert into this table. The Traffic-band insight cards become recommendations the moment a user clicks "Add." No duplication of state.

**(b) `mode` lives on `projects`, not on individual tables.** A project flips from Discovery → Live by connecting GSC/GA4, and *every* widget reads from the same tables. Discovery widgets just have fewer joins available. We never write `if (mode === 'discovery')` branches in UI — we write `if (gsc_queries_daily has rows for this project)`. That keeps the UI honest.

### 4.6 Indexes (the ones that matter for v3 perf)

- `gsc_queries_daily` on `(project_id, date DESC, impressions DESC)` — every Traffic screen query
- `gsc_pages_daily` on `(project_id, date DESC, page)`
- `recommendations` on `(project_id, wave_number, status, impact_score DESC)`
- `recommendations` on `(project_id, kind, status, created_at DESC)` — for the Inbox filters
- `issues` on `(project_id, severity, status)`
- `rankscale_prompts` on `(project_id, engine, brand_appears, captured_at DESC)`
- `competitors` on `(project_id, rank_priority)`

---

## 5. The Discovery Mode Pipeline

This is the cron-driven choreography that turns a URL into a populated tenant. It's the demo's money moment, so it has to be both fast and visibly interesting (the progress page is a feature, not a screen we hide).

### 5.1 Pipeline stages

The `discovery_runs` row has a `status` column that walks this path:

```
queued
  ↓  /api/discover/tick picks it up
crawling                 — fetch root URL HTML, infer company + country + sector via Claude
  ↓
fetching_sitemap         — read /sitemap.xml (+ /sitemap_index.xml), populate sitemap_urls
  ↓
scraping_jobs            — for each /jobs/* or /careers/* URL, scrape title + location
                            (Screaming Frog MCP if available, else Playwright on Cloud Run)
  ↓
running_serp             — for each (top-20 most common role) × (top-5 most common city):
                            SerpAPI 'role + location' → store results
                            Score domains by appearance frequency
                            Top-5 non-aggregator (not Indeed/Glassdoor/LinkedIn) = competitors
  ↓
fetching_ahrefs          — Ahrefs API:
                            - tenant's domain: organic keywords, top pages
                            - each competitor: organic keywords, top pages
                            - keyword gap (tenant vs each competitor)
  ↓
inferring                — Claude pass 1: cluster Ahrefs keywords into 9 standard pillars
                            (Branded Fortress / Role Head / Salary / Location Hubs /
                             Role×Location / AI-answer / EVP / Editorial / Competitive)
                            Claude pass 2: from sitemap + crawl signal, draft 5–10 audit
                                            issues (CSR, expired-job 404s, missing schema, etc.)
                            Claude pass 3: from pillar gaps + competitor keywords, draft
                                            Wave-2 page recommendations (X city pages, Y role pages, blog topics)
  ↓
generating_recs          — Insert into issues + recommendations + waves + keyword_pillars
                            Compute wave grades (A/B+/B/C+/C) from issue severity counts
                            Build the tower-of-blocks state per wave
  ↓
done                     — Realtime broadcast 'discovery.done' → UI navigates to /overview
```

### 5.2 What each stage costs

| Stage | Time | Cost per run |
|---|---|---|
| crawling (root URL + ~30 nav links) | 5–15 s | ~$0 (Vercel) + 1 Claude call (~$0.01) |
| fetching_sitemap | 2–10 s | ~$0 |
| scraping_jobs | 30s–5 min (depends on board size, capped at 200 JDs in MVP) | Playwright on Cloud Run: ~$0.01–0.05 |
| running_serp | 1–3 min | SerpAPI: 100 queries × $0.003 = $0.30 / Serper: $0.10 |
| fetching_ahrefs | 30s–2 min | Ahrefs API: ~10–20 calls (within plan quota) |
| inferring (3 Claude passes) | 30s–1 min | Sonnet: ~$0.10–0.30 / Opus for heavy ones: ~$0.50 |
| generating_recs | 5–15 s | ~$0 |
| **Total** | **~5–10 min wall-clock** | **~$0.50–1.50 per Discovery run** |

These costs are tractable. Per tenant, after first run, weekly Rankscale + nightly GSC/GA4 syncs are essentially free (GSC/GA4 APIs are free up to quotas; Rankscale is on subscription).

### 5.3 Failure handling

Every stage is idempotent. The `discovery_runs` row checkpoints. If a stage fails, the cron re-picks it up on the next tick and retries from the failed stage (with exponential backoff, max 3 retries, then status=`error`).

Discovery results are versioned by `last_discovery_run_id` on the project. A new run doesn't blow away the old data — it inserts a new run + writes recommendations under that run ID. The UI shows the latest run's data, with a "Re-run discovery" button.

---

## 6. GSC + GA4 Connection Flow

The pattern Raj specified: "Connect GSC" button in the UI → OAuth popup → user must have access to the property → returns connected. Same as how Ahrefs does it. The operator (Raj) is the one with the Google account that has access to the Banfield properties.

### 6.1 OAuth client setup

We register **one** OAuth client in Google Cloud (the one Raj is using) with:
- **Authorized JavaScript origins:** the Vercel domain.
- **Authorized redirect URIs:** `https://<vercel-domain>/api/connect/gsc/callback` and `…/api/connect/ga4/callback` and `…/api/connect/sheets/callback`.
- **Scopes:**
  - GSC: `https://www.googleapis.com/auth/webmasters.readonly`
  - GA4: `https://www.googleapis.com/auth/analytics.readonly`
  - Sheets: `https://www.googleapis.com/auth/spreadsheets.readonly`

### 6.2 Flow

1. Operator clicks **Connect GSC** on `/settings/connections` for a project (or in the new-project wizard if Live Mode).
2. App opens a popup at `accounts.google.com/o/oauth2/v2/auth?…` with `state` = `{project_id, provider}` and `access_type=offline&prompt=consent` (to get a refresh token).
3. Google redirects to `/api/connect/gsc/callback?code=…&state=…`.
4. The handler exchanges code for tokens, fetches the list of GSC properties the user has access to, presents a property picker in the UI (if multiple), stores `external_property_id` + encrypted tokens in `oauth_tokens`, sets `connections.status = 'connected'`.
5. The handler kicks off `/api/sync/gsc?project_id=…` for the first sync. Vercel cron handles subsequent nightly syncs.

### 6.3 Sync mechanics

**GSC nightly sync** (`/api/sync/gsc`):
- Pulls `last_synced_at - 3 days` to today (re-pulling the last 3 days because GSC backfills).
- Uses Search Analytics API: `query`, `page`, `device`, `country` dimensions, `date` rows.
- Top 25,000 rows per dimension combo per day (GSC max).
- Upserts into `gsc_queries_daily` and `gsc_pages_daily` (the unique constraints handle dedupe).
- Also pulls Coverage report → upsert into `gsc_coverage`.
- Updates `connections.last_synced_at`.

**GA4 nightly sync** (`/api/sync/ga4`):
- Uses Data API `runReport` with date range `last_synced_at - 1 day` to today.
- Dimensions: `date, sessionSource, sessionMedium, sessionCampaignName, deviceCategory, country`.
- Metrics: `sessions, totalUsers, newUsers, engagedSessions, averageSessionDuration, bounceRate, conversions`.
- Separate report for conversion events → `ga4_conversions_daily`.

Both syncs are wrapped in try/catch, log errors to `connections.last_error`, and surface them in the UI as a yellow banner ("GSC sync failed yesterday — retry").

---

## 7. Rankscale Ingest

Rankscale gives us three ways to get data, per Raj's description: **Looker Studio integration**, **search term execution records**, and **API key generation**. We use the API as primary, with a manual upload fallback for any export Rankscale doesn't expose programmatically.

### 7.1 The contract (to be verified in `02_SETUP.md`)

We assume Rankscale offers:
- `POST /audits` — trigger a run for a property (returns `run_id`).
- `GET /audits/{run_id}` — poll status.
- `GET /audits/{run_id}/export` — download CSV/JSON with prompts + engine ranks + citations.

If any of these doesn't exist as described, the fallback is:
- Operator runs the audit in the Rankscale UI.
- Operator downloads the export.
- Operator drag-drops it into a `/settings/connections/rankscale` upload zone in our app.
- Our handler parses + writes into `rankscale_runs / rankscale_prompts / rankscale_citations`.

### 7.2 Sync cadence

Weekly cron: `0 4 * * 1` (Monday 4am UTC). For each project where Rankscale is connected, kick off a run, wait (or schedule check), pull the export, parse, upsert.

### 7.3 Parser expectations (placeholder until we see actual export shape)

CSV columns we expect (or rename to):
```
prompt, engine (chatgpt|perplexity|aio|gemini|claude),
brand_appears (true|false), rank (int|null), snippet
```

Citation export:
```
source (wikipedia|glassdoor|reddit|linkedin|...), url,
status (owned|partial|risk|missing), notes
```

This shape feeds the v3 GEO box directly: prompt grid pivots `prompt × engine → rank`; citation tracking strip groups by `source` with `status` badges.

---

## 8. Suggestions Sheet Ingest

The Banfield Suggestions Sheet is a Google Sheet Raj maintains. The dashboard reads it via the Sheets API on a daily cron (or on-demand "Refresh" button).

The full column-level spec lives in **`04_SUGGESTIONS_SHEET_SPEC.md`**. Summary:

- One sheet per project; tab names = `wave_1_tech / wave_2_content / wave_3_off_page`.
- Column headers map 1:1 to `recommendations` table columns.
- Sync mode: upsert by `(project_id, external_id)` where `external_id` is a stable string Raj writes in column A.

---

## 9. Claude Inference Touchpoints

Every place Claude is called from the app. Keeping this list explicit prevents Claude calls from sprawling into "magical" features we can't reason about.

| Touchpoint | When | Model | Input | Output | Cost/call |
|---|---|---|---|---|---|
| Company inference | Discovery `crawling` stage | Sonnet 4.6 | Root URL HTML (truncated 30KB) | `{company_name, country, sector, evp_signals[], languages[]}` | $0.01–0.03 |
| Keyword pillar clustering | Discovery `inferring` stage | Sonnet 4.6 | Ahrefs keywords list (up to 2000) | `{pillars: [{name, gov_class, keywords[]}]}` | $0.05–0.15 |
| Audit issue draft | Discovery `inferring` stage | Sonnet 4.6 | Sitemap + crawl JSON | `{issues: [{title, severity, user_sees, ai_sees, pages}]}` | $0.05–0.10 |
| Recommendation draft | Discovery `inferring` stage | Sonnet 4.6 | Pillar gaps + competitor keywords | `{recommendations: [{wave, kind, title, impact_text, fix_steps}]}` | $0.10–0.30 |
| Insights band cards | After each GSC sync | Sonnet 4.6 | Last 30d GSC delta + pillar doc | 3 cards: seasonal, quick win, competitor delta | $0.02–0.05 |
| "Generate Page Brief" | Operator clicks button on Fix Detail | Opus 4.6 | Pillar + competitor pages + target keywords | 700–900 word brief in LATAM JD structure | $0.20–0.50 |
| "Generate Executive Briefing" | Operator clicks button on Overview | Opus 4.6 | All current data | Touchmark-style 8–12 page briefing (Markdown → PDF) | $0.50–1.50 |
| Mention sentiment | Per `mentions_feed` row | Haiku 4.5 | Snippet text | `{sentiment, tag}` | $0.001 |

**Operational rules:**
- All Claude calls go through `/lib/llm/claude.ts` (single client, retries, observable, schema-validated outputs via Zod).
- Every prompt is templated in `/lib/llm/prompts/*.ts` — never inlined in route handlers. This keeps prompts versioned and reviewable.
- Every Claude response is parsed against a Zod schema. Failure → retry once, then surface as `error` in the originating row (we never persist hallucinated structure).

---

## 10. Visual Design Language

Raj said: "I want the v3 aesthetic and design exactly." So this is **reimplementation**, not redesign. The v3 HTML mockup at `/Givaudan GEO Command Center - v3.html` is the source of truth.

### 10.1 Design tokens (extracted from v3)

```css
/* tokens.css — drop into Tailwind config as theme.extend, or use as CSS vars */
:root {
  --bg:        #FAFAFB;  --bg-2:      #F4F4F7;
  --surface:   #FFFFFF;  --surface-2: #F9FAFC;
  --line:      #E5E7EB;  --line-2:    #EEF0F3;  --line-soft: #F3F4F6;
  --ink:       #0A0A0F;  --ink-2: #1F2330; --ink-3: #4B5263;
  --ink-4: #6B7280; --ink-5: #9CA3AF; --ink-6: #D1D5DB;

  --indigo:      #5B5BD6; --indigo-2: #4338CA;
  --indigo-soft: #818CF8; --indigo-tint: #EEF2FF;

  --amber: #D97706; --amber-tint: #FEF3C7;
  --green: #16A34A; --green-tint: #DCFCE7;
  --red:   #DC2626; --red-tint:   #FEE2E2;
  --purple:#7C3AED; --purple-tint:#F3E8FF;
  --cyan:  #0891B2;

  --r-sm: 10px; --r-md: 14px; --r-lg: 18px; --r-xl: 24px; --r-2xl: 28px;

  --sh-1: 0 1px 2px rgba(15,23,42,.04),  0 0 0 1px rgba(15,23,42,.04);
  --sh-2: 0 4px 14px rgba(15,23,42,.05), 0 0 0 1px rgba(15,23,42,.04);
  --sh-3: 0 18px 48px -12px rgba(15,23,42,.12), 0 0 0 1px rgba(15,23,42,.04);
  --sh-glow: 0 0 0 4px rgba(91,91,214,.12);

  --spring: cubic-bezier(.34,1.56,.64,1);
  --ease:   cubic-bezier(.4,0,.2,1);
}
```

### 10.2 Typography

- **UI body:** `Inter`, 12–14px for body, 10.5–11px for labels, 600–700 for emphasis.
- **Numbers / metric values / monospace tags:** `JetBrains Mono` with `font-feature-settings: "zero"`.
- **Brand mark:** 30×30px rounded square with `linear-gradient(135deg, #5B5BD6, #7C3AED)`, "G" or project initial in 13px 800-weight white.
- **Section headers:** uppercase, 10.5–11px, 700-weight, letter-spacing .04–.08em, in `--ink-4`.
- **KPI values:** 24–32px, 700-weight, `--ink`. Small unit suffix at 13px in `--ink-3`.

### 10.3 Motion

- **Hover lift** on cards/KPIs: `transform: translateY(-2px); transition: .14s var(--spring);`
- **Card hover** scales 1.005 + shadow upgrades from `--sh-1` to `--sh-2`/`--sh-3`. Border softens to `#C7CFFF` (indigo-soft hint).
- **Tab transitions:** 250ms `var(--ease)`.

### 10.4 The brand mark per project

Each project gets a 2-letter mark with a deterministic gradient seed from the project's brand color or a hash of the project slug. Banfield → "BA" with the canonical indigo→purple gradient. Touchmark → "TM" with a slightly cooler variant. This keeps multi-tenant visually distinct without us having to source logos.

### 10.5 Component inventory

These are the React components we lift directly from v3. The file `/Givaudan GEO Command Center - v3.html` is the reference implementation.

| Component | Used on | Notes |
|---|---|---|
| `<TopBar/>` | All screens | Logo + project switcher + "Last 30 days" range + "vs prev 30d" toggle + Export + Share |
| `<MasterNav/>` | All screens | Tab cluster: Overview / Traffic / Visible-for / GEO / Recommendations |
| `<KpiStrip/>` | Overview | 4 KPIs, each with `label/value/delta/trend` |
| `<AbstractionCard/>` | Overview, deep-link to box | 3 cards: Traffic / Visible-for / GEO |
| `<SnapshotColumn/>` | Overview | Strengths / Gaps / Top priorities |
| `<TwoLaneTraffic/>` | Traffic | Human + Bot rows with mono numbers + rev-tip hover |
| `<LandingDistributionBar/>` | Traffic | Stacked bar: JR / Locations / EVP / Blog |
| `<KeywordCloud/>` | Traffic drilldown | s1–s5 sizing |
| `<AISourcesList/>` | Traffic drilldown | ChatGPT / Perplexity / Gemini / AIO with cite events |
| `<OffSiteSourcesList/>` | Traffic drilldown | Wikipedia / Glassdoor / Reddit / LinkedIn / industry sources |
| `<InsightsBand/>` | Traffic | 3 cards w/ "Add to Tracker" |
| `<HealthRing/>` | Visible-for | 3 rings: Technical / Content / Off-Page |
| `<WaveTower/>` | Visible-for | The tower-of-blocks UI from the Productize doc |
| `<IssueRow/>` | Visible-for | Collapsible, expands to user_sees / ai_sees panes |
| `<WaveTasksList/>` | Visible-for | Wave 1/2/3 tasks |
| `<SOVBars/>` | GEO | Horizontal share-of-voice bars |
| `<PromptGrid/>` | GEO | prompt × engine → rank pill matrix |
| `<CitationStrip/>` | GEO | Owned / Partial / Risk / Missing badges per source |
| `<MentionsFeed/>` | GEO | Feed cards w/ sentiment + opp/win/risk tags |
| `<RecommendationsTable/>` | Recommendations inbox | Filter chips + sort by impact |
| `<FixDetail/>` | /recommendations/[id] | Numbered steps w/ CMS paths, side panel |
| `<IssueInspector/>` | /issues/[id] | User sees / AI sees / pages / CWV table |
| `<DiscoveryProgress/>` | /discover | The animated pipeline view |

---

## 11. Repo Layout

```
career-site-cockpit/
├── README.md                          # link to /docs/01_PLAN.md
├── CLAUDE.md                          # north-star brief (== /Plan/03_CLAUDE.md)
├── package.json
├── next.config.ts
├── tsconfig.json
├── tailwind.config.ts                 # extends with v3 tokens
├── .env.example                       # all envs documented
├── /docs/
│   ├── 01_PLAN.md                     # this file
│   ├── 02_SETUP.md
│   ├── 04_SUGGESTIONS_SHEET_SPEC.md
│   ├── adr/                           # Architectural Decision Records
│   │   ├── 0001-nextjs-app-router.md
│   │   ├── 0002-supabase-postgres-rls.md
│   │   ├── 0003-rankscale-ingest-strategy.md
│   │   └── …
│   └── runbooks/                      # what to do when X breaks
│       ├── gsc-sync-failing.md
│       ├── rankscale-export-empty.md
│       └── discovery-stuck.md
├── /app/                              # Next.js App Router
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── callback/route.ts
│   ├── (operator)/
│   │   ├── layout.tsx                 # TopBar + MasterNav
│   │   ├── page.tsx                   # Overview
│   │   ├── traffic/page.tsx
│   │   ├── visible/[wave]/page.tsx
│   │   ├── geo/page.tsx
│   │   ├── recommendations/page.tsx
│   │   ├── recommendations/[id]/page.tsx
│   │   ├── issues/[id]/page.tsx
│   │   ├── discover/page.tsx
│   │   └── settings/connections/page.tsx
│   └── api/
│       ├── auth/[...supabase]/route.ts
│       ├── connect/{gsc,ga4,sheets}/callback/route.ts
│       ├── sync/{all,gsc,ga4,rankscale,sheets}/route.ts
│       ├── discover/route.ts
│       ├── discover/tick/route.ts        # cron-driven
│       ├── discover/status/[id]/route.ts
│       ├── claude/insight/route.ts
│       └── claude/brief/route.ts
├── /components/                       # all React components from § 10.5
│   ├── shell/                         # TopBar, MasterNav, BackBar
│   ├── overview/                      # KpiStrip, AbstractionCard, SnapshotColumn
│   ├── traffic/                       # TwoLaneTraffic, KeywordCloud, …
│   ├── visible/                       # HealthRing, WaveTower, IssueRow, …
│   ├── geo/                           # SOVBars, PromptGrid, …
│   ├── recommendations/               # RecommendationsTable, FixDetail
│   └── ui/                            # primitives (Card, Button, Pill)
├── /lib/
│   ├── db/                            # Supabase client + typed queries
│   │   ├── client.ts
│   │   ├── server.ts                  # service-role client
│   │   ├── queries/                   # one file per table family
│   │   └── types.ts                   # generated from Supabase schema
│   ├── llm/
│   │   ├── claude.ts                  # the only Anthropic client
│   │   └── prompts/                   # all prompt templates
│   │       ├── infer-company.ts
│   │       ├── cluster-pillars.ts
│   │       ├── draft-issues.ts
│   │       ├── draft-recs.ts
│   │       ├── insights-band.ts
│   │       ├── page-brief.ts
│   │       └── exec-briefing.ts
│   ├── sources/                       # external API adapters
│   │   ├── gsc.ts
│   │   ├── ga4.ts
│   │   ├── sheets.ts
│   │   ├── rankscale.ts
│   │   ├── ahrefs.ts
│   │   ├── serp.ts                    # SerpAPI / Serper wrapper
│   │   └── screaming-frog.ts          # MCP wrapper / Cloud Run crawler
│   ├── discovery/
│   │   ├── pipeline.ts                # the state machine
│   │   └── steps/{crawl,sitemap,jobs,serp,ahrefs,infer,generate}.ts
│   ├── design/
│   │   └── tokens.ts                  # v3 tokens as a JS object too
│   └── utils/
│       ├── dates.ts, currency.ts, urls.ts, …
├── /sql/
│   ├── 0001_init.sql                  # tables + RLS + indexes
│   ├── 0002_views.sql                 # aggregated views for KPIs
│   └── seed/
│       ├── banfield_recommendations.sql   # seeded from Mars master plan
│       └── design_tokens.sql              # if we want to store tokens server-side
└── /tests/
    ├── unit/
    └── e2e/                           # Playwright tests for the demo path
```

---

## 12. Prioritized Build Sequence

Per Raj: "we want to do everything as soon as possible help me list all things in a prioritized manner." Below is the order of operations. Each numbered item is roughly one chunk of work for Claude Code. Items inside the same numbered slice can be parallelized; the slices themselves are sequential.

### Slice 0 — Day 0 procurement & setup (Raj, ~2 hours)

Everything in `02_SETUP.md`. None of it is code. All of it is account creation, key generation, and copy-paste into Vercel env. **Claude Code cannot start until this is done.**

### Slice 1 — Walking skeleton (1–2 sessions)

1. Create the Next.js + Supabase + Vercel project. Push to GitHub. Deploy a "hello world" to a Vercel preview URL.
2. Drop in the v3 design tokens. Set up Tailwind config + global CSS.
3. Implement the auth flow: magic-link login restricted to `@joveo.com`. Logged-in users land on `/` (Overview).
4. Implement the TopBar + MasterNav shell. The 5 tabs (Overview / Traffic / Visible-for / GEO / Recommendations) navigate to empty pages with the right URL.
5. Run the SQL migration `0001_init.sql` against Supabase. RLS policies live from day 1.
6. Create the `projects` table seed for "Banfield" (live mode, root_url=`https://jobs.banfield.com`).

**Definition of done:** Raj logs in, sees the empty Cockpit shell with "Banfield" selected in the project switcher.

### Slice 2 — Live Mode for Banfield, Box 1 first (2–3 sessions)

7. GSC OAuth: `/api/connect/gsc/callback` + `/api/sync/gsc`. Manually trigger first sync for Banfield via a server action.
8. GA4 OAuth: same pattern. Manually trigger first sync.
9. Overview screen: `<KpiStrip/>` reads from `gsc_queries_daily` + `ga4_sessions_daily` aggregates. Real numbers.
10. Traffic screen: `<TwoLaneTraffic/>` (Human lane real, Bot lane partial), `<LandingDistributionBar/>` from `gsc_pages_daily` joined to `sitemap_urls.page_type`.
11. Insights Band: `/api/claude/insight` generates 3 cards from latest GSC delta. "Add to Tracker" inserts into `recommendations`.

**Definition of done:** Raj opens the app to live Banfield Traffic data. Insights cards populate. He can click "Add to Tracker" and the rec appears in Recommendations Inbox.

### Slice 3 — Recommendations spine + Visible-for (2 sessions)

12. Ingest Banfield Suggestions Sheet via Sheets API. Seeded with Wave 1 / Wave 2 / Wave 3 rows from the Mars master plan (using the spec in `04_SUGGESTIONS_SHEET_SPEC.md`).
13. `<RecommendationsTable/>` with filter chips (Wave, Kind, Status). Sort by `impact_score`.
14. `<FixDetail/>` with the numbered steps + CMS path side panel + "Mark scheduled" / "Mark done" actions.
15. Visible-for screen: `<HealthRing/>` (Technical / Content / Off-Page) + `<WaveTower/>` driven by `waves.blocks` JSON + wave tab switcher + `<WaveTasksList/>` filtered to that wave + `<IssueRow/>` rows from `issues` table.
16. `<IssueInspector/>` page with user_sees / ai_sees / pages / CWV table. "View linked fix" deep-links to Recommendations.

**Definition of done:** The Visible-for → Issue → Fix path is fully clickable on real Banfield data. Wave tower reflects real state.

### Slice 4 — GEO box via Rankscale (1–2 sessions)

17. Rankscale ingest: API path if available, file-upload fallback if not. Drop a sample Banfield Rankscale export into `/sql/seed/banfield_rankscale.json` for Day-1 demo if API is delayed.
18. GEO screen: `<SOVBars/>` + `<PromptGrid/>` + `<CitationStrip/>` + `<MentionsFeed/>` all reading from `rankscale_*` tables.
19. GEO Issues drawer (geo-01…geo-05 patterns from v3) wired to `issues WHERE category LIKE 'geo_%'`.

**Definition of done:** GEO box shows Banfield's actual AEO state from a live Rankscale pull (or a fresh manual export).

### Slice 5 — Discovery Mode (the money moment) (2–3 sessions)

20. Discovery wizard at `/discover`: URL input + optional job-titles CSV upload + Start button.
21. The pipeline: crawl → sitemap → jobs → SERP → Ahrefs → infer → generate. Each step in `/lib/discovery/steps/*`. Vercel Cron drives `/api/discover/tick`.
22. The progress page: subscribes to Supabase Realtime on `discovery_runs.status` updates. The animation makes each step visible: "Fetched 47 listings in Tampa, FL", "Top competitor: VCA (overlap 38)", etc.
23. On `done`, the user is auto-navigated to the new project's Overview, fully populated.

**Definition of done:** Raj pastes a fresh prospect URL → 8 minutes later → fully populated Cockpit tenant ready to demo.

### Slice 6 — Polish + Generate features (1–2 sessions)

24. "Generate Page Brief" button on Fix Detail → Opus call with LATAM JD structure → renders the brief in a side drawer with copy-to-clipboard + "Download .md" + "Send to Sheet".
25. "Generate Executive Briefing" button on Overview → Opus call → Touchmark-style briefing → renders inline + "Download PDF" (via Playwright PDF route handler).
26. Project switcher with the gradient brand marks. Multi-tenant feel.
27. End-to-end Playwright test that walks the demo storyboard (so we know it works before each pitch).

**Definition of done:** Raj can run the 5-beat demo storyboard cleanly from a cold open.

---

## 13. Open Questions & Known Risks

These are the things we should keep alive in `CLAUDE.md` under "Open questions" and revisit weekly.

1. **Rankscale API shape.** We don't yet know the exact endpoints, auth, or export format. Mitigation: build with a `RankscaleAdapter` interface so swapping implementations costs nothing. Confirm in setup, fall back to file upload if needed.

2. **Ahrefs API tier.** Different tiers expose different endpoints. The "Keyword Gap" endpoint specifically is on the Enterprise tier last we checked. Mitigation: if we don't have Gap, we replicate it ourselves by intersecting two `Organic Keywords` pulls.

3. **GSC property property-vs-URL prefix.** Banfield is `jobs.banfield.com` (subdomain). The OAuth grant must include the right verified property. Easy fix: confirm property type at connection time and show in the UI.

4. **Screaming Frog MCP availability.** If it's not stable on Vercel functions, we deploy a tiny Playwright crawler on Cloud Run. Architecturally same interface from the app's perspective.

5. **Vercel function timeouts.** Discovery's `running_serp` and `inferring` stages can exceed 60s. Mitigation: split into chunked tick-driven micro-steps with state in `discovery_runs` (already designed this way) OR deploy long-running steps as Supabase Edge Functions / Cloud Run jobs.

6. **Multi-tenant data partitioning under load.** RLS is correct but slow if not indexed by `project_id` aggressively. Mitigation: all hot queries already indexed by `project_id` (see § 4.6). Monitor in Supabase logs.

7. **Cost ceiling for Claude on Discovery runs.** $0.50–1.50 per run is fine for a demo, scary at 100/day. Mitigation: cap Discovery runs per tenant per day (e.g., 3) and require admin override beyond that.

8. **"What if the client asks who else has logged in."** Pre-MVP we have one operator (Raj). Once two more Joveo people log in we want activity stamps (`recommendations.last_modified_by`, `audit_log`). Schema already supports this; UI can be deferred.

9. **"What about the client's own brand mentions in places we don't crawl?"** Beyond MVP, we want Brand24 / Talkwalker / a custom Reddit watcher. For MVP, the mentions feed is whatever Rankscale gives us + a handful of seeded examples from the Mars master plan.

10. **Demo tenancy bleed.** If we demo Discovery Mode for a prospect live, their tenant exists in our DB. We need a "Soft-delete tenant" path before MVP ships, even if hidden behind a flag.

---

## 14. What "Done" Means for MVP

The MVP is done when **the 5-beat demo storyboard runs cleanly, twice in a row, on a fresh-cached browser, against:**
1. The real Banfield tenant (Live Mode, OAuth into GSC + GA4, real Rankscale export, real seeded recommendations from the Mars master plan).
2. A Discovery Mode tenant created during the demo from a URL the audience hasn't seen us pre-run.

Anything beyond that is post-MVP scope.

---
