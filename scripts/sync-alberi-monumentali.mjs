#!/usr/bin/env node
/**
 * Produce public/data/alberi-monumentali.geojson dal bbox di config/comune.json.
 * Non scarica XLS MASAF a runtime: accetta un GeoJSON/CSV locale
 * (`--input`) oppure lascia una FeatureCollection vuota.
 *
 * Uso: node scripts/sync-alberi-monumentali.mjs
 *      node scripts/sync-alberi-monumentali.mjs --input path/alberi.geojson
 */
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const OUT = path.join(ROOT, "public/data/alberi-monumentali.geojson");

function bboxFromConfig(cfg) {
  const geo = cfg.geo ?? {};
  const b = geo.bbox;
  if (Array.isArray(b) && b.length >= 4) {
    return { lonMin: b[0], latMin: b[1], lonMax: b[2], latMax: b[3] };
  }
  const center = Array.isArray(geo.map_center) ? geo.map_center : [43.085, 10.54];
  const lat = Number(center[0]);
  const lon = Number(center[1]);
  const km = Math.max(Number(geo.bbox_radius_km) || 8, 1);
  const dLat = km / 111;
  const cos = Math.cos((lat * Math.PI) / 180);
  const dLon = km / (111 * Math.max(Math.abs(cos), 0.2));
  return {
    lonMin: lon - dLon,
    latMin: lat - dLat,
    lonMax: lon + dLon,
    latMax: lat + dLat,
  };
}

function inBbox(lon, lat, bbox) {
  return lon >= bbox.lonMin && lon <= bbox.lonMax && lat >= bbox.latMin && lat <= bbox.latMax;
}

async function main() {
  const cfg = JSON.parse(
    await readFile(path.join(ROOT, "config/comune.json"), "utf8"),
  );
  const bbox = bboxFromConfig(cfg);
  const argI = process.argv.indexOf("--input");
  const input = argI >= 0 ? process.argv[argI + 1] : null;
  let features = [];

  if (input) {
    const raw = JSON.parse(await readFile(input, "utf8"));
    const src = Array.isArray(raw.features) ? raw.features : [];
    for (const f of src) {
      const c = f?.geometry?.coordinates;
      if (!Array.isArray(c) || c.length < 2) continue;
      if (inBbox(Number(c[0]), Number(c[1]), bbox)) features.push(f);
    }
  }

  const fc = {
    type: "FeatureCollection",
    name: "alberi-monumentali",
    meta: {
      comune: cfg.nome,
      n: features.length,
      generated_at: new Date().toISOString(),
      nota: input
        ? `Filtrato sul bbox da ${input}`
        : "Nessun --input: collezione vuota. MASAF non va scaricato a runtime.",
    },
    features,
  };
  await writeFile(OUT, `${JSON.stringify(fc, null, 2)}\n`);
  console.log(`Scritti ${features.length} alberi in ${OUT}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
