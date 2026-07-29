# AGENTS.md

## Cursor Cloud specific instructions

**Project:** Cruscotto San Vincenzo — a single Next.js 15 (App Router) + TypeScript dashboard
of Italian open data. Read-only: no local backend, no database, no auth, and no required
environment variables. All data comes from remote public APIs (primarily the AgID
"Cruscotto Italia" MCP at `https://cruscotto-italia-mcp.agid.workers.dev/mcp`), and the
Next.js API routes under `src/app/api/*` are thin server-side proxies/caches.

**Standard commands** (see `package.json`): `npm run dev` (dev server on port 3000,
uses Turbopack), `npm run build`, `npm run start`, `npm run lint`.

**Non-obvious notes:**
- The only process to run is the Next.js dev server (`npm run dev`). Everything else is a
  remote third-party HTTP API — there is nothing else to start locally.
- End-to-end functionality requires outbound internet egress. Without it, the page shell
  renders but core KPI data and map tiles (OpenStreetMap/CARTO) fail to load. Optional
  panels (weather, ARPAT, cultura, toscana, porto) degrade independently and are non-blocking.
- Quick smoke test that core data works: `curl -s localhost:3000/api/kpi` should return a
  JSON body with real demographics for San Vincenzo (ISTAT `049018`).
- No automated test framework is configured; `npm run lint` is the only quality gate beyond
  the build.
