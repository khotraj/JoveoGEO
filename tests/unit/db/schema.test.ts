import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";

const sql = readFileSync(join(process.cwd(), "sql/0001_init.sql"), "utf8");
const seed = readFileSync(join(process.cwd(), "sql/seed/banfield_project.sql"), "utf8");

describe("SQL migration 0001_init.sql — structure", () => {
  const REQUIRED_TABLES = [
    "tenants", "profiles", "projects", "connections", "oauth_tokens",
    "discovery_runs", "sitemap_urls", "scraped_jobs", "serp_results", "competitors",
    "gsc_queries_daily", "gsc_pages_daily", "gsc_coverage",
    "ga4_sessions_daily", "ga4_conversions_daily",
    "rankscale_runs", "rankscale_prompts", "rankscale_competitors", "rankscale_citations",
    "keyword_pillars", "ahrefs_keywords",
    "waves", "issues", "recommendations", "insights_band", "mentions_feed", "crawl_findings",
  ];

  it("contains all required tables", () => {
    for (const t of REQUIRED_TABLES) {
      expect(sql, `Missing table: ${t}`).toContain(`create table ${t}`);
    }
  });

  it("enables RLS on every table", () => {
    for (const t of REQUIRED_TABLES) {
      // Allow extra alignment spaces between table name and 'enable'
      expect(sql, `Missing RLS for: ${t}`).toMatch(
        new RegExp(`alter table ${t}\\s+enable row level security`)
      );
    }
  });

  it("all RLS enables come AFTER all table creates", () => {
    const lastCreate = sql.lastIndexOf("create table ");
    const firstRls   = sql.indexOf("enable row level security");
    expect(firstRls).toBeGreaterThan(lastCreate);
  });

  it("all policy creates come AFTER all RLS enables", () => {
    const lastRls    = sql.lastIndexOf("enable row level security");
    const firstPolicy = sql.indexOf("create policy");
    expect(firstPolicy).toBeGreaterThan(lastRls);
  });
});

describe("SQL migration — security", () => {
  it("oauth_tokens has deny-all policy", () => {
    expect(sql).toContain("deny direct oauth token access");
    expect(sql).toContain("on oauth_tokens for all using (false)");
  });

  it("oauth_tokens uses text columns for app-side ciphertext (not bytea)", () => {
    expect(sql).toContain("access_token_enc  text");
    expect(sql).toContain("refresh_token_enc text");
    expect(sql).not.toContain("access_token_enc   bytea");
  });

  it("no pgsodium extension (app-side encryption pattern)", () => {
    expect(sql).not.toContain("pgsodium");
  });

  it("get_connection_tokens SECURITY DEFINER function exists", () => {
    expect(sql).toContain("get_connection_tokens");
    expect(sql).toContain("security definer");
  });

  it("handle_new_user restricts to @joveo.com", () => {
    expect(sql).toContain("handle_new_user");
    expect(sql).toContain("@joveo.com");
  });
});

describe("SQL migration — data integrity", () => {
  it("discovery_runs has $5 cost cap constraint", () => {
    expect(sql).toContain("cost_usd <= 5");
  });

  it("ga4_sessions_daily handles NULL campaign with NULLS NOT DISTINCT", () => {
    expect(sql).toContain("nulls not distinct");
  });

  it("updated_at triggers on projects, connections, profiles", () => {
    expect(sql).toContain("projects_updated_at");
    expect(sql).toContain("connections_updated_at");
    expect(sql).toContain("profiles_updated_at");
  });

  it("recommendations has last_modified_at trigger", () => {
    expect(sql).toContain("recommendations_last_modified");
  });

  it("ahrefs_keywords has competitor_id for gap analysis", () => {
    expect(sql).toContain("competitor_id");
    expect(sql).toContain("competitor_id is not null"); // gap index
  });

  it("projects FK to discovery_runs added after discovery_runs exists", () => {
    const discoveryCreate = sql.indexOf("create table discovery_runs");
    const projectsFk = sql.indexOf("fk_projects_last_discovery_run");
    expect(projectsFk).toBeGreaterThan(discoveryCreate);
  });

  it("sitemap_urls has SF crawl fields", () => {
    expect(sql).toContain("is_indexable");
    expect(sql).toContain("response_time_ms");
    expect(sql).toContain("inlinks_count");
  });
});

describe("SQL migration — performance indexes", () => {
  it("has all critical indexes", () => {
    const INDEXES = [
      "idx_gsc_queries_project_date",
      "idx_recommendations_wave",
      "idx_recommendations_inbox",
      "idx_issues_severity",
      "idx_ahrefs_gap",
      "idx_projects_slug",
      "idx_sitemap_urls_project",
    ];
    for (const idx of INDEXES) {
      expect(sql, `Missing index: ${idx}`).toContain(idx);
    }
  });
});

describe("Banfield seed script", () => {
  it("uses stable Banfield UUID", () => {
    expect(seed).toContain("a0000000-0000-0000-0000-000000000001");
  });

  it("seeds all three waves", () => {
    expect(seed).toContain("wave_number, grade, blocks");
  });

  it("sets mode to live and correct root_url", () => {
    expect(seed).toContain("'live'");
    expect(seed).toContain("https://jobs.banfield.com");
  });

  it("errors if tenant not bootstrapped yet", () => {
    expect(seed).toContain("Joveo tenant not found");
  });
});
