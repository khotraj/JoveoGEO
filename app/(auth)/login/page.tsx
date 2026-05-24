"use client";

import { useState } from "react";
import { createClient } from "@/lib/db/client";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function LoginForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "sent" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/";
  const domainError = searchParams.get("error") === "domain";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.endsWith("@joveo.com")) {
      setErrorMsg("Only @joveo.com accounts can sign in.");
      setStatus("error");
      return;
    }
    setStatus("loading");
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/api/auth/callback?next=${encodeURIComponent(next)}` },
    });
    if (error) {
      setErrorMsg(error.message);
      setStatus("error");
    } else {
      setStatus("sent");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg)" }}>
      <div
        className="w-full max-w-sm rounded-[var(--r-xl)] p-8"
        style={{ background: "var(--surface)", boxShadow: "var(--sh-2)" }}
      >
        {/* Brand mark */}
        <div className="flex items-center gap-3 mb-8">
          <div
            className="w-9 h-9 rounded-[var(--r-md)] flex items-center justify-center text-white text-sm font-black"
            style={{ background: "linear-gradient(135deg, var(--indigo), var(--purple))" }}
          >
            J
          </div>
          <div>
            <div className="text-sm font-semibold" style={{ color: "var(--ink)" }}>Career Site Cockpit</div>
            <div className="text-xs" style={{ color: "var(--ink-4)" }}>by Joveo</div>
          </div>
        </div>

        {status === "sent" ? (
          <div>
            <h1 className="text-base font-semibold mb-2" style={{ color: "var(--ink)" }}>Check your email</h1>
            <p className="text-sm" style={{ color: "var(--ink-3)" }}>
              We sent a magic link to <strong>{email}</strong>. Click it to sign in.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <h1 className="text-base font-semibold mb-1" style={{ color: "var(--ink)" }}>Sign in</h1>
              <p className="text-xs" style={{ color: "var(--ink-4)" }}>@joveo.com accounts only</p>
            </div>

            {(status === "error" || domainError) && (
              <div
                className="text-xs rounded-[var(--r-sm)] px-3 py-2"
                style={{ background: "var(--red-tint)", color: "var(--red)" }}
              >
                {domainError ? "Only @joveo.com accounts can sign in." : errorMsg}
              </div>
            )}

            <input
              type="email"
              placeholder="you@joveo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full text-sm px-3 py-2 rounded-[var(--r-md)] outline-none focus:ring-2"
              style={{
                background: "var(--bg-2)",
                border: "1px solid var(--line)",
                color: "var(--ink)",
              }}
            />

            <button
              type="submit"
              disabled={status === "loading"}
              className="w-full text-sm font-semibold py-2 rounded-[var(--r-md)] text-white transition-opacity"
              style={{
                background: "linear-gradient(135deg, var(--indigo), var(--purple))",
                opacity: status === "loading" ? 0.7 : 1,
              }}
            >
              {status === "loading" ? "Sending…" : "Send magic link"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
