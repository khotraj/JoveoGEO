/**
 * Shared OAuth helpers: token refresh and access-token retrieval.
 * Used by GSC and GA4 sync libraries.
 */
import { createServiceClient } from "@/lib/db/server";
import { encryptToken, decryptToken } from "@/lib/crypto/tokens";

export type Provider = "gsc" | "ga4";

interface TokenRow {
  access_token_enc:  string | null;
  refresh_token_enc: string | null;
  expires_at:        string | null;
}

/**
 * Returns a valid (non-expired) access token for the given project + provider.
 * Refreshes automatically if the stored token is within 5 minutes of expiry.
 * Throws if no connection exists or refresh fails.
 */
export async function getAccessToken(projectId: string, provider: Provider): Promise<string> {
  const supabase = createServiceClient();

  // Get connection ID
  const { data: conn, error: connErr } = await supabase
    .from("connections")
    .select("id, status")
    .eq("project_id", projectId)
    .eq("provider", provider)
    .single();

  if (connErr || !conn) throw new Error(`No ${provider} connection for project ${projectId}`);
  if (conn.status === "expired") throw new Error(`${provider} connection is expired — reconnect`);

  // Get tokens directly via service role (bypasses oauth_tokens deny-all policy)
  const { data: tokenRow, error: tokErr } = await supabase
    .from("oauth_tokens")
    .select("access_token_enc, refresh_token_enc, expires_at")
    .eq("connection_id", conn.id)
    .single<TokenRow>();

  if (tokErr || !tokenRow?.access_token_enc) {
    throw new Error(`No tokens stored for ${provider} connection`);
  }

  const accessToken   = decryptToken(tokenRow.access_token_enc);
  const expiresAt     = tokenRow.expires_at ? new Date(tokenRow.expires_at) : null;
  const fiveMinFromNow = new Date(Date.now() + 5 * 60 * 1000);

  // If token is still valid, return it immediately
  if (expiresAt && expiresAt > fiveMinFromNow) return accessToken;

  // Token expired or close — refresh it
  if (!tokenRow.refresh_token_enc) {
    // Mark connection as expired so UI shows reconnect prompt
    await supabase.from("connections").update({ status: "expired" }).eq("id", conn.id);
    throw new Error(`${provider} access token expired and no refresh token stored`);
  }

  const refreshToken = decryptToken(tokenRow.refresh_token_enc);

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type:    "refresh_token",
      refresh_token: refreshToken,
      client_id:     process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  });

  const refreshed = await res.json();

  if (refreshed.error) {
    await supabase.from("connections").update({ status: "expired", last_error: refreshed.error }).eq("id", conn.id);
    throw new Error(`Token refresh failed: ${refreshed.error_description ?? refreshed.error}`);
  }

  // Persist refreshed token (refresh_token may not be returned — keep old one if so)
  await supabase.from("oauth_tokens")
    .update({
      access_token_enc:  encryptToken(refreshed.access_token),
      refresh_token_enc: refreshed.refresh_token
        ? encryptToken(refreshed.refresh_token)
        : tokenRow.refresh_token_enc,
      expires_at: refreshed.expires_in
        ? new Date(Date.now() + refreshed.expires_in * 1000).toISOString()
        : null,
    })
    .eq("connection_id", conn.id);

  return refreshed.access_token as string;
}
