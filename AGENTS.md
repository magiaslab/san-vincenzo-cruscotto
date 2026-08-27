# AGENTS.md

## Cursor Cloud specific instructions

**Project:** Cruscotto Comune — template Next.js 15 (App Router) + TypeScript
per dashboard di dati aperti comunali italiani, più minisito di documentazione.
Read-only: no local backend, no database, no auth, no required env vars.
KPI da AgID Cruscotto Italia MCP
(`https://cruscotto-italia-mcp.agid.workers.dev/mcp`). Le route `src/app/api/*`
sono proxy/cache.

**San Vincenzo** è il primo esemplare in produzione
(`https://www.cruscottosanvincenzo.it`), repo separato. Questo template non deve
reintrodurre dati hardcoded di quel comune.

**Standard commands:** `npm run dev` (port 3000, Turbopack), `npm run build`,
`npm run start`, `npm run lint`.

**Non-obvious notes:**
- Identità in `config/comune.json`. Placeholder ISTAT `000000` / nome
  `NomeComune` = comune non configurato: la dashboard mostra la guida, non
  chiama l’MCP.
- `site.mode=landing` → homepage minisito, dashboard su `/cruscotto`.
- Feature flags in `features.*` spengono tab e API.
- Smoke dopo config: `curl -s localhost:3000/api/kpi` con ISTAT reale.
- Quality gate: `npm run lint`. A11y: jsx-a11y + `docs/a11y-checklist.md`.
