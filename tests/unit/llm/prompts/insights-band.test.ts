import { describe, it, expect } from "vitest";
import {
  InsightSchema,
  InsightsBandSchema,
  buildInsightsBandPrompt,
} from "@/lib/llm/prompts/insights-band";

const SAMPLE_PARAMS = {
  companyName: "Banfield Pet Hospital",
  siteUrl:     "https://jobs.banfield.com",
  topQueries:  [
    { query: "veterinary technician jobs", clicks: 420, impressions: 8200, position: 3.2 },
    { query: "banfield careers",           clicks: 310, impressions: 4100, position: 1.8 },
    { query: "vet jobs near me",           clicks: 190, impressions: 9800, position: 7.4 },
  ],
  topPages: [
    { page: "https://jobs.banfield.com/veterinary-technician", clicks: 540, position: 2.1 },
    { page: "https://jobs.banfield.com/",                       clicks: 310, position: 1.0 },
  ],
  dateRange: { from: "2026-04-24", to: "2026-05-24" },
};

describe("InsightSchema", () => {
  it("accepts a valid insight", () => {
    const result = InsightSchema.safeParse({
      category: "quick_win",
      title:    "Boost CTR on 'vet jobs near me'",
      body:     "Position 7.4 with 9800 impressions — a title rewrite could push CTR from 1.9% to 4%.",
      projected_impact: "+200 clicks/mo",
    });
    expect(result.success).toBe(true);
  });

  it("rejects unknown category", () => {
    const result = InsightSchema.safeParse({
      category: "unknown_type",
      title:    "some title",
      body:     "some body",
    });
    expect(result.success).toBe(false);
  });

  it("rejects title over 80 chars", () => {
    const result = InsightSchema.safeParse({
      category: "seasonal",
      title:    "x".repeat(81),
      body:     "body",
    });
    expect(result.success).toBe(false);
  });

  it("rejects body over 220 chars", () => {
    const result = InsightSchema.safeParse({
      category: "content_gap",
      title:    "title",
      body:     "x".repeat(221),
    });
    expect(result.success).toBe(false);
  });
});

describe("InsightsBandSchema", () => {
  it("accepts exactly 3 insights", () => {
    const insight = {
      category: "quick_win" as const,
      title:    "Test insight",
      body:     "Test body text for insight.",
    };
    const result = InsightsBandSchema.safeParse({ insights: [insight, insight, insight] });
    expect(result.success).toBe(true);
  });

  it("rejects fewer than 3 insights", () => {
    const insight = { category: "quick_win" as const, title: "T", body: "B" };
    const result = InsightsBandSchema.safeParse({ insights: [insight, insight] });
    expect(result.success).toBe(false);
  });

  it("rejects more than 3 insights", () => {
    const insight = { category: "seasonal" as const, title: "T", body: "B" };
    const result = InsightsBandSchema.safeParse({
      insights: [insight, insight, insight, insight],
    });
    expect(result.success).toBe(false);
  });
});

describe("buildInsightsBandPrompt", () => {
  it("includes the company name", () => {
    const prompt = buildInsightsBandPrompt(SAMPLE_PARAMS);
    expect(prompt).toContain("Banfield Pet Hospital");
  });

  it("includes the site URL", () => {
    const prompt = buildInsightsBandPrompt(SAMPLE_PARAMS);
    expect(prompt).toContain("https://jobs.banfield.com");
  });

  it("includes top query strings", () => {
    const prompt = buildInsightsBandPrompt(SAMPLE_PARAMS);
    expect(prompt).toContain("veterinary technician jobs");
    expect(prompt).toContain("banfield careers");
  });

  it("includes the date range", () => {
    const prompt = buildInsightsBandPrompt(SAMPLE_PARAMS);
    expect(prompt).toContain("2026-04-24");
    expect(prompt).toContain("2026-05-24");
  });

  it("requests exactly 3 insights in JSON", () => {
    const prompt = buildInsightsBandPrompt(SAMPLE_PARAMS);
    expect(prompt).toContain("exactly 3");
    expect(prompt).toContain("Return JSON only");
  });

  it("truncates to top 20 queries", () => {
    const manyQueries = Array.from({ length: 30 }, (_, i) => ({
      query:       `query ${i}`,
      clicks:      100 - i,
      impressions: 1000,
      position:    i + 1,
    }));
    const prompt = buildInsightsBandPrompt({ ...SAMPLE_PARAMS, topQueries: manyQueries });
    // query 20 should NOT appear (0-indexed, so query 19 is the last included)
    expect(prompt).not.toContain("query 20");
  });
});
