import { NextResponse, type NextRequest } from "next/server";
import { createServiceClient } from "@/lib/db/server";
import { encryptToken } from "@/lib/crypto/tokens";
import { listProperties } from "@/lib/sources/gsc";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code  = searchParams.get("code");
  const state = searchParams.get("state");
  const storedState = request.cookies.get("gsc_oauth_state")?.value;

  if (!code || !state || state !== storedState) {
    return NextResponse.redirect(`${origin}/settings/connections?error=invalid_state`);
  }

  const projectId = state.split(":")[1];
  if (!projectId) {
    return NextResponse.redirect(`${origin}/settings/connections?error=malformed_state`);
  }

  try {
    // Exchange code for tokens
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id:     process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        redirect_uri:  `${origin}/api/connect/gsc/callback`,
        grant_type:    "authorization_code",
      }),
    });

    const tokens = await tokenRes.json();
    if (tokens.error) throw new Error(tokens.error_description ?? tokens.error);

    // Discover which GSC property to attach — prefer jobs.banfield.com
    const properties = await listProperties(tokens.access_token);
    const property =
      properties.find((p) => p.siteUrl.includes("jobs.banfield.com")) ??
      properties.find((p) => p.siteUrl.includes("banfield.com")) ??
      properties[0];

    const supabase = createServiceClient();

    // Upsert connection
    const { data: conn, error: connErr } = await supabase
      .from("connections")
      .upsert(
        {
          project_id:           projectId,
          provider:             "gsc",
          status:               "connected",
          external_property_id: property?.siteUrl ?? null,
          scopes:               ["https://www.googleapis.com/auth/webmasters.readonly"],
          last_error:           null,
        },
        { onConflict: "project_id,provider" },
      )
      .select("id")
      .single();

    if (connErr || !conn) throw connErr ?? new Error("connection upsert returned no row");

    // Store encrypted tokens (delete old first for idempotency)
    await supabase.from("oauth_tokens").delete().eq("connection_id", conn.id);
    const { error: tokErr } = await supabase.from("oauth_tokens").insert({
      connection_id:     conn.id,
      access_token_enc:  encryptToken(tokens.access_token),
      refresh_token_enc: tokens.refresh_token ? encryptToken(tokens.refresh_token) : null,
      expires_at:        tokens.expires_in
        ? new Date(Date.now() + tokens.expires_in * 1000).toISOString()
        : null,
      scope: tokens.scope ?? null,
    });

    if (tokErr) throw tokErr;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[GSC OAuth callback]", msg);
    const response = NextResponse.redirect(`${origin}/settings/connections?error=gsc_oauth_failed`);
    response.cookies.delete("gsc_oauth_state");
    return response;
  }

  const response = NextResponse.redirect(`${origin}/settings/connections?connected=gsc`);
  response.cookies.delete("gsc_oauth_state");
  return response;
}
