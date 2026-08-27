# AGENTS.md

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory) before writing any code. Heed deprecation notices.

<!-- END:nextjs-agent-rules -->

## Cursor Cloud specific instructions

**Project:** Cruscotto San Vincenzo — a single Next.js 16 (App Router) + TypeScript dashboard
of Italian open data. Read-only: no local backend, no database, no auth, and no required
environment variables. All data comes from remote public APIs (primarily the AgID
"Cruscotto Italia" MCP at `https://cruscotto-italia-mcp.agid.workers.dev/mcp`), and the
Next.js API routes under `src/app/api/*` are thin server-side proxies/caches.

**Standard commands** (see `package.json`): `npm run dev` (dev server on port 3000,
Turbopack by default), `npm run build`, `npm run start`, `npm run lint`. Node ≥ 20.9.

**Non-obvious notes:**
- The only process to run is the Next.js dev server (`npm run dev`). Everything else is a
  remote third-party HTTP API — there is nothing else to start locally.
- End-to-end functionality requires outbound internet egress. Without it, the page shell
  renders but core KPI data and map tiles (OpenStreetMap/CARTO) fail to load. Optional
  panels (weather, ARPAT, cultura, toscana, porto) degrade independently and are non-blocking.
- Quick smoke test that core data works: `curl -s localhost:3000/api/kpi` should return a
  JSON body with real demographics for San Vincenzo (ISTAT `049018`).
- No automated test framework is configured; `npm run lint` is the only quality gate beyond
  the build. Accessibility: jsx-a11y via ESLint + checklist in `docs/a11y-checklist.md`.
