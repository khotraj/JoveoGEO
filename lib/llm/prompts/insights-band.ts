import { z } from "zod";

export const InsightSchema = z.object({
  category:         z.enum(["seasonal", "quick_win", "competitor", "content_gap"]),
  title:            z.string().max(80),
  body:             z.string().max(220),
  projected_impact: z.string().max(100).optional(),
  source_query:     z.string().optional(),
});

export const InsightsBandSchema = z.object({
  insights: z.array(InsightSchema).length(3),
});

export type InsightsBandOutput = z.infer<typeof InsightsBandSchema>;

export function buildInsightsBandPrompt(params: {
  companyName:  string;
  siteUrl:      string;
  topQueries:   Array<{ query: string; clicks: number; impressions: number; position: number }>;
  topPages:     Array<{ page: string; clicks: number; position: number }>;
  dateRange:    { from: string; to: string };
}): string {
  const queriesSummary = params.topQueries
    .slice(0, 20)
    .map((q) => `"${q.query}" (${q.clicks} clicks, pos ${q.position.toFixed(1)})`)
    .join("\n");

  const pagesSummary = params.topPages
    .slice(0, 10)
    .map((p) => `${p.page} (${p.clicks} clicks, pos ${p.position.toFixed(1)})`)
    .join("\n");

  return `You are an expert SEO analyst specialising in career sites. Analyse the following Google Search Console data for ${params.companyName} (${params.siteUrl}) covering ${params.dateRange.from} to ${params.dateRange.to}.

TOP QUERIES BY CLICKS:
${queriesSummary}

TOP LANDING PAGES BY CLICKS:
${pagesSummary}

Generate exactly 3 concise insight cards for a live SEO dashboard. Each card must:
- Surface a specific, non-obvious finding the operator can act on
- Have a title under 80 characters
- Have a body under 220 characters explaining the insight and the opportunity
- Include a projected_impact string if quantifiable (e.g. "+320 clicks/mo at current CTR")
- Classify as one of: seasonal, quick_win, competitor, content_gap

Focus on what's working, what's missing, and what seasonality patterns exist. Be specific — reference actual query strings or page paths where relevant. Do not give generic advice.

Return JSON only, no prose outside the JSON object.`;
}
