#!/usr/bin/env node
/**
 * Snapshot dei dataset volatili in public/data/snapshot/YYYY-MM-DD.json.
 * Pensato per un workflow GitHub Actions disattivato (solo workflow_dispatch).
 *
 * Uso: SNAPSHOT_BASE_URL=http://localhost:3000 node scripts/snapshot.mjs
 */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const BASE = (process.env.SNAPSHOT_BASE_URL || "http://localhost:3000").replace(
  /\/$/,
  "",
);

const ENDPOINTS = [
  "/api/kpi",
  "/api/turismo",
  "/api/rifiuti",
  "/api/meteo/allerte",
  "/api/farmacie/turno",
  "/api/amministratori",
  "/api/terremoti",
  "/api/stazioni",
];

async function main() {
  const day = new Date().toISOString().slice(0, 10);
  const outDir = path.join(ROOT, "public/data/snapshot");
  await mkdir(outDir, { recursive: true });
  const payload = {
    giorno: day,
    base: BASE,
    raccolto_at: new Date().toISOString(),
    dataset: {},
  };
  for (const ep of ENDPOINTS) {
    try {
      const res = await fetch(`${BASE}${ep}`, { cache: "no-store" });
      payload.dataset[ep] = {
        status: res.status,
        body: res.ok ? await res.json() : await res.text(),
      };
    } catch (err) {
      payload.dataset[ep] = {
        status: 0,
        error: err instanceof Error ? err.message : String(err),
      };
    }
  }
  const file = path.join(outDir, `${day}.json`);
  await writeFile(file, `${JSON.stringify(payload)}\n`);
  console.log(`Snapshot ${day} → ${file}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
