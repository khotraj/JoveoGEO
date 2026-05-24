# CLAUDE.md — Career Site Cockpit (North-Star Brief)

> **Read this every session.** It is the single source of truth for the *why*, the *what*, and the *how we don't deviate*. When you make architectural or product decisions during a session, **append** to the Decision Log at the bottom — never silently drift.

---

## §1. The product in one paragraph

The Career Site Cockpit is a multi-tenant web app that automates the manual SEO + GEO audit + execution-tracking workflow our team runs for career-site clients. It turns the workflow into a single screen-shareable Command Center: three boxes (Traffic, Visible-for, GEO) + a Recommendations Inbox sidecar. It runs in **two modes** sharing one app shell — **Live Mode** (GSC + GA4 + Rankscale + Suggestions Sheet wired up; Banfield is the first Live tenant) and **Discovery Mode** (URL-only intelligence: site fetch → sitemap → job-board scrape → SERP-based competitor discovery → Ahrefs keyword overlap → Claude-driven recommendations). Built on Next.js (App Router) + Supabase + Vercel + Anthropic Claude. Visual language is the v3 mockup, exactly. Multi-tenant from day one.

## §2. The 3-Box mental model (non-negotiable)

These are the **only** top-level concepts the user navigates by. Everything else is either a hub (Overview), a filter (Recommendations is the un-pivoted view of `recommendations` records), or a detail view of an item inside a box.

1. **Traffic** — Human + Bot lanes, drill-downs to AI sources & off-site sources, GSC + Pillar insights band.
2. **Visible-for** — Technical / Content / Off-Page health rings + Wave 1 / Wave 2 / Wave 3 tower of blocks + Issues drawer + tasks list. *This is the "activity tracker" surface.*
3. **GEO** — AI Share of Voice + Unbranded Prompt Visibility Grid + Citation tracking + Brand mentions feed. *Powered by Rankscale.*

**Rule:** If a feature can't be located in one of these three boxes (or in Overview/Recommendations as a hub/filter), it doesn't belong in MVP.

## §3. Personas (who uses this and how)

- **Operator** (Raj + Joveo SEO/GEO team) — the only logged-in user in MVP. Magic-link auth, restricted to `@joveo.com`. Reads everything, resolves recommendations, runs Discovery, manages connections.
- **Client** — does *not* log in during MVP. Sees the Cockpit over operator's screen-share during demos & QBRs.

## §4. The two modes

**Live Mode.** GSC + GA4 OAuth grants in place for that property. All 3 boxes populated with real data. Sync cadence: GSC nightly, GA4 nightly, Rankscale weekly, Suggestions Sheet daily / on-demand.

**Discovery Mode.** Operator pastes a URL, optionally uploads a job-titles CSV. Background pipeline (cron-driven) does the rest in ~5–10 min:
1. `crawling` — fetch root HTML, infer company/country/sector via Claude.
2. `fetching_sitemap` — read `/sitemap.xml`, populate `sitemap_urls`.
3. `scraping_jobs` — Playwright/Screaming Frog → titles + locations into `scraped_jobs`.
4. `running_serp` — SerpAPI/Serper queries on `role + location`, top-5 non-aggregator competitors emerge.
5. `fetching_ahrefs` — Ahrefs API: tenant + each competitor keywords + keyword gap.
6. `inferring` — 3 Claude passes: pillar clustering, audit issues draft, recommendation draft.
7. `generating_recs` — write `issues / recommendations / waves / keyword_pillars`; compute wave grades.
8. `done` — Realtime broadcast, UI navigates to populated tenant.

**Rule:** UI never branches on `project.mode`. Every widget reads from the data tables. Discovery widgets just have fewer joins available. Write `if (gsc_queries_daily has rows for this project)` not `if (mode === 'discovery')`.

## §5. Stack invariants

- **Framework:** Next.js 15+ App Router. Server Components for data fetching, Client Components only where interaction demands.
- **DB & auth:** Supabase (Postgres + Auth + Realtime + Storage). Row-Level Security on `project_id` on every tenant-scoped table.
- **Auth restriction:** magic link, `@joveo.com` only (enforced in code via Supabase Auth Hook if the plan doesn't natively support).
- **Hosting:** Vercel (Next.js server + Route Handlers + Cron).
- **Inference:** Provider-agnostic via `/lib/llm/index.ts`. **Current default: Google Gemini** (`gemini-flash-latest` for fast/cheap, `gemini-2.5-pro` for deep). Anthropic Claude is a supported alternative provider — code never assumes one or the other. Selection happens via `LLM_PROVIDER` env (`gemini` | `anthropic`).
- **Model env vars:** `LLM_MODEL_FAST`, `LLM_MODEL_DEEP`, `LLM_MODEL_CHEAP`. Never hardcode model strings inside prompts/routes. The LLM client reads env, applies retries, validates output via Zod.
- **Styling:** Tailwind with `theme.extend` containing the v3 tokens (see §10 of `01_PLAN.md`). Use CSS variables (`var(--ink-2)`, `var(--indigo-tint)`) — match the v3 file 1:1.
- **Typography:** Inter for UI, JetBrains Mono for numbers/codes. Use `font-mono` Tailwind class on metric values; never use Inter for KPI digits.
- **OAuth tokens:** stored encrypted in `oauth_tokens.{access_token_enc, refresh_token_enc}` using `pgsodium`. Never log them. Never expose them through PostgREST. Read via `SECURITY DEFINER` Postgres function.

## §6. Architectural rules ("never do X")

- **Never write `if (mode === 'discovery')` in UI code.** Always check whether the underlying data exists.
- **Never inline a Claude prompt in a route handler.** All prompts live in `/lib/llm/prompts/*.ts`, are versioned, and have a corresponding Zod schema for output parsing.
- **Never parse a Claude response without Zod validation.** A failure-to-parse retries once, then surfaces as `error` in the originating record. We do not persist hallucinated structure.
- **Never write to a table from the browser.** All mutations go through Server Actions or Route Handlers with auth context applied.
- **Never log a secret.** No tokens, no OAuth codes, no API keys in console or in DB logs.
- **Never break the 3-box taxonomy.** Adding a feature outside Traffic / Visible-for / GEO / Recommendations / Overview / Discover requires a Decision Log entry and consensus.
- **Never let a Discovery run cost more than $5 in API spend.** Hard cap in the pipeline; budget tracking in `discovery_runs.cost_usd`.
- **Never recreate v3 design from scratch.** Lift the styles from `/Givaudan GEO Command Center - v3.html` exactly. The mockup file lives in the project context folder and is the canonical reference.

## §7. Data model summary (full schema in `01_PLAN.md` §4)

Core spine:
- `tenants → projects → connections → oauth_tokens` (identity)
- `discovery_runs` drives the Discovery pipeline state machine
- `sitemap_urls / scraped_jobs / serp_results / competitors / ahrefs_keywords / keyword_pillars` are Discovery's writable layer
- `gsc_queries_daily / gsc_pages_daily / gsc_coverage / ga4_sessions_daily / ga4_conversions_daily` are Live Mode's GSC+GA4 layer
- `rankscale_runs / rankscale_prompts / rankscale_citations` is the GEO box's data
- `recommendations / issues / waves / insights_band / mentions_feed` is the universal currency

**The most important shape rule:** `recommendations` is one table. The Wave drawer inside Visible-for filters by `wave_number`. The Recommendations Inbox is unfiltered with chip filters by `kind/status`. The Traffic Insights Band's "Add to Tracker" inserts into the same table. There is one source of truth for "things to do."

## §8. Visual language — v3 tokens (extract; full set in `01_PLAN.md` §10)

```
--bg: #FAFAFB        --surface: #FFFFFF
--ink: #0A0A0F (titles)    --ink-3: #4B5263 (body)    --ink-4: #6B7280 (labels)
--indigo: #5B5BD6 (primary)    --indigo-tint: #EEF2FF (chips/hovers)
--green: #16A34A / --amber: #D97706 / --red: #DC2626 (status)
brand-mark: linear-gradient(135deg, #5B5BD6, #7C3AED)
font: 'Inter' UI, 'JetBrains Mono' numbers
motion: cubic-bezier(.34,1.56,.64,1) spring, cubic-bezier(.4,0,.2,1) ease
```

## §9. The Claude inference touchpoints (the only places we call the API)

| Where | Tier (env model) | Output schema lives in |
|---|---|---|
| Discovery: company inference | FAST | `/lib/llm/prompts/infer-company.ts` |
| Discovery: pillar clustering | FAST | `/lib/llm/prompts/cluster-pillars.ts` |
| Discovery: audit issues draft | FAST | `/lib/llm/prompts/draft-issues.ts` |
| Discovery: recommendation draft | FAST | `/lib/llm/prompts/draft-recs.ts` |
| Post-GSC-sync: insights band | FAST | `/lib/llm/prompts/insights-band.ts` |
| "Generate Page Brief" button | DEEP | `/lib/llm/prompts/page-brief.ts` |
| "Generate Executive Briefing" button | DEEP | `/lib/llm/prompts/exec-briefing.ts` |
| Per-mention sentiment | CHEAP | `/lib/llm/prompts/sentiment.ts` |

Tier → current model (Gemini default):
- FAST → `gemini-flash-latest`
- DEEP → `gemini-2.5-pro`
- CHEAP → `gemini-flash-latest` (same as FAST in Gemini's lineup)

If `LLM_PROVIDER=anthropic`: FAST=`claude-sonnet-4-6`, DEEP=`claude-opus-4-6`, CHEAP=`claude-haiku-4-5-20251001`.

Any new touchpoint = new file in `/lib/llm/prompts/`, new Zod schema, new entry in this table.

## §10. Current sprint focus

> **Update this every time you start a new session.** Be specific. "Working on auth" is bad. "Wiring `/api/connect/gsc/callback` and the property picker UI" is good.

- [ ] **Slice 0 — Day-0 setup (Raj).** Following `02_SETUP.md`. Blocked on completion before Claude Code starts.
- [ ] **Slice 1 — Walking skeleton.** Next.js scaffold, design tokens, auth, top bar + master nav, SQL migration `0001_init.sql`, Banfield project seed.
- [ ] **Slice 2 — Live Mode for Banfield, Box 1.** GSC + GA4 OAuth, Overview KPI strip, Traffic screen Human/Bot lanes + Insights Band.
- [ ] Slice 3 — Recommendations spine + Visible-for.
- [ ] Slice 4 — GEO via Rankscale.
- [ ] Slice 5 — Discovery Mode (the money moment).
- [ ] Slice 6 — Polish + Generate features.

## §11. Open questions (revisit weekly)

1. **Rankscale API endpoints** — sample export shape is known (see `/docs/RANKSCALE_INGEST.md`). API endpoint names still need confirmation by hitting `https://rankscale.ai/api/v1/...` with the key. Until confirmed, manual-upload mode is the fallback.
2. **Ahrefs API tier specifics** — current tier is `standard`. Confirm which endpoints we actually have access to (esp. Keyword Gap, which is often Advanced/Enterprise).
3. **GSC property type for Banfield**: URL prefix `https://jobs.banfield.com/` vs domain property `sc-domain:banfield.com`. Code should detect at OAuth callback.
4. **Screaming Frog MCP on localhost (`127.0.0.1:11435`)** — runs on Raj's laptop only. Cannot be hit from Vercel cron. Options: (a) Cloudflare Tunnel, (b) Cloud Run deployment, (c) Playwright crawler on Cloud Run as fallback. **Current decision:** Playwright fallback for production, SF MCP for local dev only.
5. **Soft-delete tenants** — needed before we run public Discovery demos.
6. **Audit log / activity stamps** — schema supports it, UI deferred.
7. **Anthropic key** — not yet procured; Gemini is the current default inference. Add Anthropic if we want a fallback or comparison.

## §12. Demo storyboard (the bar for "MVP done")

Five beats, ~5 minutes, runs cleanly twice in a row on a fresh-cached browser:

1. **Open Banfield Overview** — KPI strip, 3 abstraction cards. "Here's your career site as we see it."
2. **Click Visible-for** — Wave tower animates, real Banfield issues drawer (CSR, expired-job 404s, AI-bot allowlist). One-click into Issue → linked Fix with CMS steps.
3. **Click GEO** — SOV bars, prompt grid, citations, mentions. "Here's where AI sees you."
4. **+ New Project → paste a fresh prospect URL → Discovery progress runs live** — the money moment.
5. **Recommendations Inbox → Wave 2 → click a fix → "Generate Page Brief"** — Claude produces a 700-word brief.

Anything beyond the storyboard is post-MVP.

---

## §13. Decision Log (append-only)

> Every architectural or product decision made during a session goes here as a one-paragraph entry. Date, decision, reasoning, who decided. **Never delete entries; mark superseded ones explicitly.**

### 2026-05-24 — Stack: Next.js + Supabase + Vercel + Anthropic
Decided by Raj. Vercel domain, Supabase Auth, Google Cloud for OAuth. Anthropic Claude as the only inference layer (no OpenAI). All three already accessible.

### 2026-05-24 — Visual language: v3 mockup verbatim
Decided by Raj. The HTML at `/Givaudan GEO Command Center - v3.html` is the source of truth. No redesign. Reimplement tokens, components, and layouts 1:1 in React.

### 2026-05-24 — Two modes (Live + Discovery), one app shell
Decided by Raj. Discovery Mode is a first-class product capability, not a fallback view. Background pipeline driven by Vercel Cron + Supabase Realtime. URL → populated tenant in ~5–10 min.

### 2026-05-24 — Recommendations is one table
Decided by Raj. Wave drawers in Visible-for are filtered views of `recommendations WHERE wave_number = N`. Inbox is unfiltered with chip filters. Single source of truth. No duplicated state.

### 2026-05-24 — `@joveo.com` only, magic link, no client login in MVP
Decided by Raj. Operators log in, clients view over screen-share. Pre-MVP team size: small (Raj + 2–3). Activity stamps deferred; schema supports.

### 2026-05-24 — Banfield is the first Live tenant
Decided by Raj. Raj has GSC + GA4 access on his Joveo Google account. Seed `recommendations` from the Mars Vet Health master plan (11 fixes spanning Wave 1 tech, Wave 2 content, Wave 3 off-page).

### 2026-05-24 — Rankscale via API key with manual-upload fallback
Decided by Raj. Use Rankscale's "Generate API Key" path. Sample export at `Context/rankscale-sample-export-banfield.*` defines our parser shape. If endpoint shape differs, swap implementation; interface in `/lib/sources/rankscale.ts`.

### 2026-05-24 — Build sequence: 6 vertical slices
Slice 0 (Raj setup) → Slice 1 (walking skeleton) → Slice 2 (Live Banfield Box 1) → Slice 3 (Recs + Visible-for) → Slice 4 (GEO) → Slice 5 (Discovery) → Slice 6 (polish + Generate). Each slice ships a demo-able milestone.

### 2026-05-24 — Inference layer: Gemini-first, provider-agnostic
Decided by Raj. Gemini API key in hand (`GEMINI_API_KEY`). Code abstracts behind `/lib/llm/index.ts` with `LLM_PROVIDER` env (`gemini` default). Tiered models (FAST/DEEP/CHEAP) selected from env, not hardcoded. Anthropic can be swapped in by changing one env var if/when key is procured.

### 2026-05-24 — Banfield tracker structure adopted as-is
Raj's existing workbook (`MVP Data/Banfield · Invisible Funnel Tracker (Joveo Organic, May 2026).xlsx`) is the source of truth, not the synthetic spec from `04_SUGGESTIONS_SHEET_SPEC.md` v1. Sheet has 5 tabs: Banfield Performance (KPI time-series), Snapshot (baseline), Master Tracker (77 rows = the recs spine, columns BF-ID/Task/Layer/Wave/Week/Priority/Effort/Owner/ETA/Status/Dependencies/Impact/Source/Joveo Comments/Client Comments/Completed Date/Doc Link), Top 30 Active Sprint (derived view), Milestone Calendar. Dashboard ingest adapts to this schema. See `/docs/04_SUGGESTIONS_SHEET_SPEC.md` (revised).

### 2026-05-24 — Rankscale export shape captured from real May 23 file
140 columns: run metadata + engine context + tenant brand presence + visibility scores + top-16 competitor breakdown (7 cols × 16 ranks). Normalized into 3 Postgres tables: `rankscale_runs`, `rankscale_prompts`, `rankscale_competitors`. Parser written against the May 23 sample as Day-1 fixture. See `/docs/RANKSCALE_INGEST.md`.

### 2026-05-24 — Screaming Frog: manual export uploads, no MCP in production
Production path: Raj runs SF locally → exports crawl (CSV/XLSX) → drops the file into Supabase Storage at `screaming-frog-exports/{project_id}/{timestamp}.xlsx` via a drag-drop zone on `/settings/connections/screaming-frog`. Dashboard parses the export (URL list, status codes, indexability, schema flags, internal link graph depth, title/meta/H1 lengths, page bytes, TTFB) into the existing `sitemap_urls` + a new `crawl_findings` table. Discovery's `scraping_jobs` stage uses a thin Playwright fetch for net-new tenants where no SF export exists yet; when an SF export is present, it supersedes the Playwright signal. SF MCP at localhost is unused.

### 2026-05-24 — Inference default: Gemini-only for MVP
Confirmed. `LLM_PROVIDER=gemini` is the default. Anthropic provider stays in the adapter as a swap option, not wired by default. Cost ceiling: $50/week on Gemini Flash + $50/week on Gemini Pro (~10 Discovery runs/wk + 30 briefs).

### 2026-05-24 — Secrets policy
`Plan/02_SETUP.md` is the only document that ever holds key values, and it is **gitignored**. `.env.local` (local) and Vercel Project Envs (prod) are the only places secrets live. See `/docs/SECURITY_FIRST.md`.

### 2026-05-24 — Tooling: Cursor + Claude Code
Both used on the same repo. `CLAUDE.md` is the source of truth for both. Cursor reads a `.cursorrules` file at the repo root that points back at `CLAUDE.md`. See `/docs/05_CURSOR_AND_CLAUDE_CODE.md`.

<!-- Append new entries below this line as decisions are made. -->


@docs/CLAUDE.md
