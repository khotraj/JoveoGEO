import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createServiceClient } from "@/lib/db/server";
import { cookies } from "next/headers";
import { callLLM } from "@/lib/llm/index";
import { InsightsBandSchema, buildInsightsBandPrompt } from "@/lib/llm/prompts/insights-band";

/**
 * POST /api/claude/insight
 * Body: { project_id: string }
 * Generates 3 insight cards for the Insights Band using today's GSC data.
 * Idempotent — if cards already exist for today, returns cached cards.
 */
export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (c) => c.forEach(({ name, value, options }) => cookieStore.set(name, value, options)),
      },
    },
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  let body: { project_id?: string };
  try { body = await request.json(); } catch { return NextResponse.json({ error: "invalid body" }, { status: 400 }); }

  const { project_id } = body;
  if (!project_id) return NextResponse.json({ error: "project_id required" }, { status: 400 });

  const svc = createServiceClient();

  // Check for existing cards generated today
  const today = new Date().toISOString().slice(0, 10);
  const { data: existing } = await svc
    .from("insights_band")
    .select("*")
    .eq("project_id", project_id)
    .gte("generated_at", `${today}T00:00:00Z`)
    .order("generated_at", { ascending: false })
    .limit(3);

  if (existing && existing.length >= 3) {
    return NextResponse.json({ insights: existing, cached: true });
  }

  // Fetch top queries + pages for the last 30 days
  const { data: topQueries } = await svc
    .from("gsc_queries_daily")
    .select("query, clicks, impressions, position")
    .eq("project_id", project_id)
    .order("clicks", { ascending: false })
    .limit(25);

  const { data: topPages } = await svc
    .from("gsc_pages_daily")
    .select("page, clicks, position")
    .eq("project_id", project_id)
    .order("clicks", { ascending: false })
    .limit(10);

  if (!topQueries?.length) {
    return NextResponse.json({ error: "No GSC data yet — sync first" }, { status: 422 });
  }

  // Fetch project metadata for the prompt
  const { data: projectRaw } = await svc
    .from("projects")
    .select("display_name, root_url")
    .eq("id", project_id)
    .single();

  const project = projectRaw as { display_name: string | null; root_url: string | null } | null;

  const prompt = buildInsightsBandPrompt({
    companyName: project?.display_name ?? "this company",
    siteUrl:     project?.root_url ?? "",
    topQueries:  topQueries as Array<{ query: string; clicks: number; impressions: number; position: number }>,
    topPages:    (topPages ?? []) as Array<{ page: string; clicks: number; position: number }>,
    dateRange:   { from: new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10), to: today },
  });

  let output;
  try {
    output = await callLLM(prompt, InsightsBandSchema, { tier: "fast" });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: `LLM failed: ${msg}` }, { status: 500 });
  }

  // Persist new cards
  const records = output.insights.map((insight) => ({
    project_id,
    category:         insight.category,
    title:            insight.title,
    body:             insight.body,
    projected_impact: insight.projected_impact ?? null,
    source_query:     insight.source_query ?? null,
    generated_by:     "gemini",
  }));

  await svc.from("insights_band").insert(records);

  return NextResponse.json({ insights: records, cached: false });
}
