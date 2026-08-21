#!/usr/bin/env node
/**
 * Sincronizza i DAE comunali da OpenAEDMap (export GeoJSON Italia),
 * filtrati sul bbox di `config/comune.json`.
 *
 * Uso: node scripts/sync-dae-geojson.mjs
 *      npm run dae:sync
 */
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const IT_GEOJSON_URL =
  "https://openaedmap.org/api/v1/countries/IT.geojson";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function bboxFromConfig(cfg) {
  const geo = cfg.geo ?? {};
  const b = geo.bbox;
  if (
    Array.isArray(b) &&
    b.length >= 4 &&
    b.slice(0, 4).every((n) => typeof n === "number")
  ) {
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

function outPathFromConfig(cfg) {
  const rel = String(cfg.urls?.dae_geojson || "/data/dae.geojson").replace(
    /^\//,
    "",
  );
  return path.join(__dirname, "..", "public", rel);
}

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

function toFeature(raw, bbox) {
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
    lon < bbox.lonMin ||
    lon > bbox.lonMax ||
    lat < bbox.latMin ||
    lat > bbox.latMax
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
        osmId != null ? `https://www.openstreetmap.org/node/${osmId}` : "",
      check_date: String(p.check_date ?? ""),
    },
  };
}

async function main() {
  const cfg = JSON.parse(
    await readFile(path.join(__dirname, "..", "config", "comune.json"), "utf8"),
  );
  const bbox = bboxFromConfig(cfg);
  const outFile = outPathFromConfig(cfg);
  const nome = cfg.nome || "comune";
  const ua =
    cfg.brand?.user_agent ||
    "Cruscotto-Comunale/1.0 (+https://github.com/magiaslab/san-vincenzo-cruscotto; dae:sync)";

  console.log("Scarico", IT_GEOJSON_URL);
  console.log("BBox", bbox, "→", outFile);
  const res = await fetch(IT_GEOJSON_URL, {
    headers: { "User-Agent": ua, Accept: "application/geo+json, application/json" },
  });
  if (!res.ok) {
    throw new Error(`OpenAEDMap HTTP ${res.status}`);
  }
  const json = await res.json();
  const features = (json.features ?? [])
    .map((f) => toFeature(f, bbox))
    .filter(Boolean)
    .sort((a, b) => Number(a.properties.osm_id) - Number(b.properties.osm_id));

  const payload = {
    type: "FeatureCollection",
    features,
    meta: {
      fonte: "OpenStreetMap / OpenAEDMap export",
      ambito: nome,
      n: features.length,
      bbox,
      source_url: IT_GEOJSON_URL,
      synced_at: new Date().toISOString(),
    },
  };

  await writeFile(outFile, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  console.log(`Scritti ${features.length} DAE in ${outFile}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
