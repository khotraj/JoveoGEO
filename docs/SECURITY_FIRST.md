# SECURITY — Read this before pushing to GitHub

## The problem

`Plan/02_SETUP.md` now contains **live secrets** that were filled in during Day-0 setup:

- Supabase service-role key (database admin)
- Supabase DB password
- Google OAuth client secret
- Ahrefs API token
- Gemini API key
- Rankscale API key
- Serper.dev API key
- Screaming Frog MCP token (if set)

If this file lands in the public/private GitHub repo, anyone with repo access (or anyone who steals a laptop with the repo cloned) has full admin access to:
- Your entire Supabase Postgres database
- The Banfield GSC + GA4 OAuth flow
- All paid API quotas (Anthropic/Gemini, Ahrefs, Rankscale, Serper) — runaway bills possible

## The fix — three steps

### Step 1 — Don't commit `Plan/02_SETUP.md`

Add this to `.gitignore` at the repo root **before the first commit**:

```
# Plan docs containing secrets
Plan/02_SETUP.md

# Local environment
.env
.env.local
.env.production
*.env

# OS / editor
.DS_Store
.idea/
.vscode/
```

If `Plan/` is being committed but only some files inside it, use:

```
Plan/02_SETUP.md
```

The other Plan/ files (00_README.md, 01_PLAN.md, 03_CLAUDE.md, 04_SUGGESTIONS_SHEET_SPEC.md, 05_*, 06_*) are safe to commit — they contain no secrets.

### Step 2 — Move secrets out of `02_SETUP.md` into `.env.local`

The setup doc is a *worksheet*, not a config file. Once you've collected a key, the key itself belongs in:
- `.env.local` (for local dev — gitignored)
- Vercel Project Settings → Environment Variables (for prod — never in repo)

After moving each value to its proper home, **redact** the line in `02_SETUP.md`:

```diff
- AHREFS_API_TOKEN= 0wZGxoGrktr-wreJYdnBSXYtlvJRDGWL2vzaNjSG
+ AHREFS_API_TOKEN= ✅ in Vercel + .env.local (redacted)
```

This keeps the doc useful as a checklist (you can see *which* keys you have) without exposing the values.

### Step 3 — If the file has already been pushed to a remote: rotate every key in it

If `Plan/02_SETUP.md` has already been `git push`ed (even to a private repo), assume the keys are leaked. Rotate them all:

1. **Supabase** — Project Settings → API → "Rotate service role key", reset DB password.
2. **Google OAuth** — Credentials → delete the client, create a new one. Update Vercel envs + redirect URIs.
3. **Ahrefs** — API Profile → revoke + regenerate token.
4. **Gemini** — AI Studio → delete + create new API key.
5. **Rankscale** — Settings → API → revoke + regenerate.
6. **Serper.dev** — Dashboard → revoke + regenerate.
7. **Anthropic** (if added later) — same pattern.

Check `git log --all -p -- Plan/02_SETUP.md` to see exactly which keys were in which commit, so you know what to rotate.

## Going forward

- Every new key Claude Code asks for goes **straight to `.env.local` and Vercel**, never into a tracked doc.
- `02_SETUP.md` stays as a worksheet showing what you *need*, not what you *have*. Keep values redacted with `✅` markers.
- CLAUDE.md and code never log secrets. The `/lib/llm/claude.ts` (or `/lib/llm/gemini.ts`) wrapper masks any tokens before any log call.
- Periodic key rotation: every 90 days for OAuth client secrets, every 30 days for paid-API tokens if the budget allows.

## A safer pattern for collecting keys

Instead of pasting secrets into `02_SETUP.md`, paste them directly into:

**A. Local `.env.local` (one-time):**
```bash
# Run once at the repo root:
cp .env.example .env.local
# Then edit .env.local in your editor and paste values there.
# .env.local is in .gitignore — it never reaches GitHub.
```

**B. Vercel envs (production + preview):**
- Dashboard → Project → Settings → Environment Variables
- Add each key/value, scope to "Production" and "Preview" both
- Vercel encrypts at rest, only the running function can read

That way no document ever holds secrets in plaintext.
