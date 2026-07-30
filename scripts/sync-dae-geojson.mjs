#!/usr/bin/env node
/**
 * Sincronizza i DAE comunali da OpenAEDMap (export GeoJSON Italia),
 * filtrati sul bbox di San Vincenzo (LI).
 *
 * Uso: node scripts/sync-dae-geojson.mjs
 *      npm run dae:sync
 */
import { writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const IT_GEOJSON_URL =
  "https://openaedmap.org/api/v1/countries/IT.geojson";

/** BBox ampia sul comune (lon_min, lat_min, lon_max, lat_max). */
const BBOX = {
  lonMin: 10.48,
  latMin: 43.02,
  lonMax: 10.58,
  latMax: 43.12,
};

const UA =
  "Cruscotto-San-Vincenzo/1.0 (+https://github.com/magiaslab/san-vincenzo-cruscotto; dae:sync)";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(
  __dirname,
  "..",
  "public",
  "data",
  "dae-san-vincenzo.geojson",
);

function pickLocation(tags) {
  return (
    tags["defibrillator:location:it"] ||
    tags["defibrillator:location"] ||
    tags["defibrillator:location:en"] ||
    tags.description ||
    tags.name ||
    ""
  );
}

function toFeature(raw) {
  const coords = raw?.geometry?.coordinates;
  if (
    !Array.isArray(coords) ||
    coords.length < 2 ||
    typeof coords[0] !== "number" ||
    typeof coords[1] !== "number"
  ) {
    return null;
  }
  const [lon, lat] = coords;
  if (
    lon < BBOX.lonMin ||
    lon > BBOX.lonMax ||
    lat < BBOX.latMin ||
    lat > BBOX.latMax
  ) {
    return null;
  }

  const p = raw.properties ?? {};
  const osmId = p["@osm_id"] ?? p.osm_id;
  const nome = pickLocation(p) || (osmId != null ? `DAE ${osmId}` : "DAE");

  return {
    type: "Feature",
    geometry: { type: "Point", coordinates: [lon, lat] },
    properties: {
      osm_type: p["@osm_type"] ?? "node",
      osm_id: osmId ?? null,
      nome: String(nome),
      ubicazione: String(pickLocation(p)),
      accesso: String(p.access ?? ""),
      orari: String(p.opening_hours ?? ""),
      operatore: String(p.operator ?? ""),
      telefono: String(p.phone ?? p["contact:phone"] ?? ""),
      indoor: p.indoor === "yes" || p.indoor === true,
      immagine: String(
        p.image ||
          (p["@photo_url"]
            ? `https://openaedmap.org${p["@photo_url"]}`
            : "") ||
          "",
      ),
      osm_url:
        osmId != null
          ? `https://www.openstreetmap.org/node/${osmId}`
          : "",
      check_date: String(p.check_date ?? ""),
    },
  };
}

async function main() {
  console.log("Scarico", IT_GEOJSON_URL);
  const res = await fetch(IT_GEOJSON_URL, {
    headers: { "User-Agent": UA, Accept: "application/geo+json, application/json" },
  });
  if (!res.ok) {
    throw new Error(`OpenAEDMap HTTP ${res.status}`);
  }
  const json = await res.json();
  const features = (json.features ?? [])
    .map(toFeature)
    .filter(Boolean)
    .sort((a, b) => Number(a.properties.osm_id) - Number(b.properties.osm_id));

  const out = {
    type: "FeatureCollection",
    features,
    meta: {
      fonte: "OpenStreetMap / OpenAEDMap export",
      ambito: "San Vincenzo (LI)",
      n: features.length,
      bbox: BBOX,
      source_url: IT_GEOJSON_URL,
      synced_at: new Date().toISOString(),
    },
  };

  await writeFile(OUT, `${JSON.stringify(out, null, 2)}\n`, "utf8");
  console.log(`Scritti ${features.length} DAE in ${OUT}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
