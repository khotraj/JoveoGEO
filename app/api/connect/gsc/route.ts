import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { randomBytes } from "crypto";

const GSC_SCOPES = [
  "https://www.googleapis.com/auth/webmasters.readonly",
  "openid",
  "email",
].join(" ");

export async function GET(request: NextRequest) {
  const { origin, searchParams } = new URL(request.url);
  const projectId = searchParams.get("project_id");
  if (!projectId) {
    return NextResponse.redirect(`${origin}/settings/connections?error=missing_project`);
  }

  // Verify session
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
  if (!user) return NextResponse.redirect(`${origin}/login`);

  // CSRF state: random hex + project_id
  const state = `${randomBytes(16).toString("hex")}:${projectId}`;

  const params = new URLSearchParams({
    client_id:     process.env.GOOGLE_CLIENT_ID!,
    redirect_uri:  `${origin}/api/connect/gsc/callback`,
    response_type: "code",
    scope:         GSC_SCOPES,
    access_type:   "offline",
    prompt:        "consent",  // always return refresh_token
    state,
  });

  const response = NextResponse.redirect(
    `https://accounts.google.com/o/oauth2/v2/auth?${params}`,
  );
  response.cookies.set("gsc_oauth_state", state, {
    httpOnly: true,
    secure:   process.env.NODE_ENV === "production",
    maxAge:   600,
    path:     "/",
    sameSite: "lax",
  });
  return response;
}
