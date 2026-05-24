import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";

describe("SQL migration 0001_init.sql", () => {
  const sql = readFileSync(join(process.cwd(), "sql/0001_init.sql"), "utf8");

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
    for (const table of REQUIRED_TABLES) {
      expect(sql, `Missing table: ${table}`).toContain(`create table ${table}`);
    }
  });

  it("every table has row level security enabled", () => {
    for (const table of REQUIRED_TABLES) {
      expect(sql, `Missing RLS for: ${table}`).toContain(
        `alter table ${table} enable row level security`
      );
    }
  });

  it("oauth_tokens has no direct select policy (SECURITY DEFINER only)", () => {
    expect(sql).toContain("deny direct oauth token access");
    expect(sql).toContain("on oauth_tokens for all using (false)");
  });

  it("has pgsodium extension for token encryption", () => {
    expect(sql).toContain('create extension if not exists "pgsodium"');
  });

  it("has recommendations last_modified_at trigger", () => {
    expect(sql).toContain("recommendations_last_modified");
    expect(sql).toContain("update_last_modified");
  });

  it("has new user bootstrap trigger with @joveo.com restriction", () => {
    expect(sql).toContain("handle_new_user");
    expect(sql).toContain("@joveo.com");
  });

  it("has performance indexes on hot query paths", () => {
    expect(sql).toContain("idx_gsc_queries_project_date");
    expect(sql).toContain("idx_recommendations_wave");
    expect(sql).toContain("idx_recommendations_inbox");
  });
});

describe("Banfield seed script", () => {
  const seed = readFileSync(join(process.cwd(), "sql/seed/banfield_project.sql"), "utf8");

  it("contains stable Banfield project UUID", () => {
    expect(seed).toContain("a0000000-0000-0000-0000-000000000001");
  });

  it("seeds all three waves", () => {
    expect(seed).toContain("wave_number, grade, blocks");
    expect(seed).toMatch(/wave_number.*1.*'B'/s);
    expect(seed).toContain("C+");
    expect(seed).toContain("wave_number) do nothing");
  });

  it("sets mode to live", () => {
    expect(seed).toContain("'live'");
  });

  it("sets root_url to Banfield jobs site", () => {
    expect(seed).toContain("https://jobs.banfield.com");
  });
});
