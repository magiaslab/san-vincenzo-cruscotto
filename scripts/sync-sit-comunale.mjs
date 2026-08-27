#!/usr/bin/env node
/**
 * Aggiorna i GeoJSON locali ciclabili/pedonali da urls.* in config/comune.json.
 *
 * Uso: node scripts/sync-sit-comunale.mjs
 */
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");

async function fetchJson(url) {
  const res = await fetch(url, {
    headers: { Accept: "application/json, application/geo+json, */*" },
  });
  if (!res.ok) throw new Error(`${url} → ${res.status}`);
  return res.json();
}

function localPath(rel) {
  return path.join(ROOT, "public", String(rel).replace(/^\//, ""));
}

async function main() {
  const cfg = JSON.parse(
    await readFile(path.join(ROOT, "config/comune.json"), "utf8"),
  );
  const urls = cfg.urls ?? {};
  const jobs = [
    [urls.ciclabili_geojson, urls.ciclabili_geojson_local],
    [urls.pedonali_geojson, urls.pedonali_geojson_local],
  ];
  for (const [remote, local] of jobs) {
    if (!remote || !local) {
      console.log("Salto: manca URL remoto o path locale");
      continue;
    }
    const json = await fetchJson(remote);
    const n = Array.isArray(json.features) ? json.features.length : 0;
    await writeFile(localPath(local), `${JSON.stringify(json)}\n`);
    console.log(`${local}: ${n} feature da ${remote}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
