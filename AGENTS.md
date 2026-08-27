# AGENTS.md

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Cursor Cloud specific instructions

**Project:** Cruscotto Comune — template Next.js 16 (App Router) + TypeScript
per una dashboard di dati aperti comunali italiani. Read-only: no local
backend, no database, no auth, no required env vars. KPI da AgID Cruscotto
Italia MCP (`https://cruscotto-italia-mcp.agid.workers.dev/mcp`). Le route
`src/app/api/*` sono proxy/cache.

**Tre repo:** questo template da forkare; il minisito
`https://www.cruscottocomune.it` (repo a parte); San Vincenzo
(`https://www.cruscottosanvincenzo.it`) come primo esemplare. Non
reintrodurre dati hardcoded di quel comune.

**Standard commands:** `npm run dev` (port 3000, Turbopack default),
`npm run build`, `npm run start`, `npm run lint`. Node ≥ 20.9.

**Non-obvious notes:**
- Identità in `config/comune.json`. Placeholder ISTAT `000000` / nome
  `NomeComune` = comune non configurato: la dashboard mostra la guida, non
  chiama l’MCP.
- Homepage = dashboard. Il minisito di presentazione non vive qui.
- Feature flags in `features.*` spengono tab e API.
- Smoke dopo config: `curl -s localhost:3000/api/kpi` con ISTAT reale.
- Quality gate: `npm run lint`. A11y: jsx-a11y + `docs/a11y-checklist.md`.
- Aggiornamenti fork: `CHANGELOG.md` + `docs/aggiornamenti-upstream.md`.
