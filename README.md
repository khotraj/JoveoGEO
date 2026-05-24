# Career Site Cockpit

Multi-tenant SEO + GEO Command Center for career sites. Turns the manual audit workflow (Screaming Frog + Ahrefs + Rankscale + GSC + GA4 + Gemini + Sheets) into a single screen-shareable Command Center.

→ **Full architecture:** [docs/01_PLAN.md](docs/01_PLAN.md)
→ **Session brief (read every time):** [docs/CLAUDE.md](docs/CLAUDE.md)
→ **v3 visual reference:** [docs/reference/v3-mockup.html](docs/reference/v3-mockup.html)

## Quick start

```bash
cp .env.example .env.local   # Fill in values from Plan/02_SETUP.md
npm install
npm run dev                  # http://localhost:3000
```

## Build sequence

| Slice | Status | Description |
|-------|--------|-------------|
| 0 | ✅ Done | Day-0 setup — all API keys acquired |
| 1 | 🔄 In Progress | Walking skeleton — Next.js + auth + shell + SQL migration |
| 2 | ⏳ | Live Mode for Banfield (GSC + GA4 + Box 1 Traffic) |
| 3 | ⏳ | Recommendations spine + Visible-for |
| 4 | ⏳ | GEO box via Rankscale |
| 5 | ⏳ | Discovery Mode (the money moment) |
| 6 | ⏳ | Polish + Generate features |
