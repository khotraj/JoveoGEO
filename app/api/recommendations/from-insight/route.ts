import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createServiceClient } from "@/lib/db/server";
import { cookies } from "next/headers";

const CATEGORY_TO_KIND: Record<string, string> = {
  seasonal:    "seasonal",
  quick_win:   "quick",
  competitor:  "competitor",
  content_gap: "content",
};

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

  let body: { insight_id?: string; project_id?: string };
  try { body = await request.json(); } catch { return NextResponse.json({ error: "invalid body" }, { status: 400 }); }

  const { insight_id, project_id } = body;
  if (!insight_id || !project_id) {
    return NextResponse.json({ error: "insight_id and project_id required" }, { status: 400 });
  }

  const svc = createServiceClient();

  const { data: insight } = await svc
    .from("insights_band")
    .select("id, title, body, category, projected_impact")
    .eq("id", insight_id)
    .single();

  if (!insight) return NextResponse.json({ error: "insight not found" }, { status: 404 });

  const { data: rec, error } = await svc
    .from("recommendations")
    .insert({
      project_id,
      wave_number: 2,
      kind:        CATEGORY_TO_KIND[insight.category] ?? "content",
      title:       insight.title,
      impact_text: insight.body,
      impact_score: 50,
      effort:      "M" as const,
      status:      "open" as const,
      evidence_source: `insights_band:${insight.id}`,
    })
    .select("id")
    .single();

  if (error || !rec) {
    return NextResponse.json({ error: error?.message ?? "insert failed" }, { status: 500 });
  }

  await svc
    .from("insights_band")
    .update({ added_to_tracker: true })
    .eq("id", insight_id);

  return NextResponse.json({ recommendation_id: rec.id });
}
