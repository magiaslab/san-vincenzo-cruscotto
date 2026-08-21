/**
 * Percorsi ciclabili e pedonali da OpenStreetMap (relazioni route + vie nominate).
 * Filtrati sul bbox di `config/comune.json` — vale per qualsiasi comune.
 */
import { COMUNE_NOME } from "@/lib/constants";
import { getComuneBbox, type ComuneBbox } from "@/lib/comune-config";
import { fetchOverpass, overpassBbox, type OverpassElement } from "@/lib/overpass";
import { haversineKm } from "@/lib/tpl-overpass";

export const PERCORSI_FONTE = "OpenStreetMap / Waymarked Trails";

export const WAYMARKED_CYCLING_URL =
  "https://cycling.waymarkedtrails.org/" as const;
export const WAYMARKED_HIKING_URL =
  "https://hiking.waymarkedtrails.org/" as const;

export type PercorsoTipo = "bicycle" | "mtb" | "hiking" | "foot";

export type Percorso = {
  id: string;
  osm_type: "relation" | "way";
  osm_id: number;
  tipo: PercorsoTipo;
  nome: string;
  ref: string | null;
  rete: string | null;
  distanza_km: number | null;
  osm_url: string;
  waymarked_url: string | null;
  gpx_url: string;
};

export type PercorsiGeoJSON = {
  type: "FeatureCollection";
  features: Array<{
    type: "Feature";
    id: string;
    geometry: {
      type: "LineString" | "MultiLineString";
      coordinates: number[][] | number[][][];
    };
    properties: Percorso;
  }>;
};

export type PercorsiData = {
  percorsi: Percorso[];
  geojson: PercorsiGeoJSON;
  kpi: {
    n_totale: number;
    n_ciclo: number;
    n_mtb: number;
    n_pedo: number;
  };
  bbox: ComuneBbox;
  comune: string;
};

function classifyRoute(tags: Record<string, string>): PercorsoTipo | null {
  const r = (tags.route || "").toLowerCase();
  if (r === "bicycle") return "bicycle";
  if (r === "mtb") return "mtb";
  if (r === "hiking") return "hiking";
  if (r === "foot" || r === "walking") return "foot";
  const hw = (tags.highway || "").toLowerCase();
  if (hw === "cycleway" || tags.bicycle === "designated") return "bicycle";
  if (hw === "footway" || hw === "pedestrian" || tags.foot === "designated") {
    return "foot";
  }
  if (hw === "path" && tags.bicycle === "yes") return "bicycle";
  if (hw === "path") return "hiking";
  return null;
}

function lineFromGeom(
  geom: Array<{ lat: number; lon: number }> | undefined,
): number[][] | null {
  if (!geom || geom.length < 2) return null;
  const coords: number[][] = [];
  for (const p of geom) {
    if (typeof p.lat !== "number" || typeof p.lon !== "number") continue;
    coords.push([p.lon, p.lat]);
  }
  return coords.length >= 2 ? coords : null;
}

function lengthKm(coords: number[][]): number {
  let m = 0;
  for (let i = 1; i < coords.length; i++) {
    const a = coords[i - 1]!;
    const b = coords[i]!;
    m += haversineKm(a[1]!, a[0]!, b[1]!, b[0]!);
  }
  return m;
}

function multiLengthKm(parts: number[][][]): number {
  return parts.reduce((s, c) => s + lengthKm(c), 0);
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

function waymarkedUrl(tipo: PercorsoTipo, osmId: number): string {
  const base =
    tipo === "bicycle" || tipo === "mtb"
      ? WAYMARKED_CYCLING_URL
      : WAYMARKED_HIKING_URL;
  return `${base}#route?id=${osmId}&map=14`;
}

function gpxOverpassUrl(osmType: "relation" | "way", osmId: number): string {
  const q = `[out:gpx];${osmType}(${osmId});>>;out;`;
  return `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(q)}`;
}

function metaFromTags(
  osmType: "relation" | "way",
  osmId: number,
  tags: Record<string, string>,
  tipo: PercorsoTipo,
  distanzaKm: number | null,
): Percorso {
  const ref = (tags.ref || "").trim() || null;
  const nome =
    (tags.name || "").trim() ||
    (tags["name:it"] || "").trim() ||
    (ref ? `Percorso ${ref}` : null) ||
    (tipo === "bicycle" || tipo === "mtb"
      ? `Pista ciclabile ${osmId}`
      : `Sentiero ${osmId}`);
  return {
    id: `osm/${osmType}/${osmId}`,
    osm_type: osmType,
    osm_id: osmId,
    tipo,
    nome,
    ref,
    rete: (tags.network || "").trim() || null,
    distanza_km: distanzaKm != null ? round1(distanzaKm) : null,
    osm_url: `https://www.openstreetmap.org/${osmType}/${osmId}`,
    waymarked_url:
      osmType === "relation" ? waymarkedUrl(tipo, osmId) : null,
    gpx_url: gpxOverpassUrl(osmType, osmId),
  };
}

export async function buildPercorsiData(): Promise<PercorsiData> {
  const bbox = getComuneBbox();
  const bb = overpassBbox(bbox);
  const query = `[out:json][timeout:28];
(
  relation["type"="route"]["route"~"^(bicycle|mtb|hiking|foot|walking)$"](${bb});
)->.r;
(.r; rel(r.r);)->.r2;
.r2 out body;
way(r.r2)(${bb});
out geom;
(
  way["highway"="cycleway"]["name"](${bb});
  way["highway"="path"]["name"]["bicycle"~"^(yes|designated)$"](${bb});
  way["highway"="footway"]["name"](${bb});
  way["highway"="path"]["name"]["foot"~"^(yes|designated)$"](${bb});
);
out geom tags;`;

  const elements = await fetchOverpass(query);
  const relations = elements.filter((e) => e.type === "relation");
  const ways = elements.filter((e) => e.type === "way");
  const wayById = new Map<number, OverpassElement>();
  for (const w of ways) wayById.set(w.id, w);

  const memberWayIds = new Set<number>();
  const features: PercorsiGeoJSON["features"] = [];
  const seen = new Set<string>();

  for (const rel of relations) {
    const tags = rel.tags ?? {};
    const tipo = classifyRoute(tags);
    if (!tipo) continue;
    const parts: number[][][] = [];
    for (const m of rel.members ?? []) {
      if (m.type !== "way") continue;
      memberWayIds.add(m.ref);
      const way = wayById.get(m.ref);
      const line = lineFromGeom(way?.geometry);
      if (line) parts.push(line);
    }
    if (parts.length === 0) continue;
    const id = `osm/relation/${rel.id}`;
    if (seen.has(id)) continue;
    seen.add(id);
    const km = multiLengthKm(parts);
    const props = metaFromTags("relation", rel.id, tags, tipo, km);
    features.push({
      type: "Feature",
      id,
      geometry:
        parts.length === 1
          ? { type: "LineString", coordinates: parts[0]! }
          : { type: "MultiLineString", coordinates: parts },
      properties: props,
    });
  }

  for (const way of ways) {
    if (memberWayIds.has(way.id)) continue;
    const tags = way.tags ?? {};
    if (!(tags.name || "").trim()) continue;
    const tipo = classifyRoute(tags);
    if (!tipo) continue;
    const line = lineFromGeom(way.geometry);
    if (!line) continue;
    const id = `osm/way/${way.id}`;
    if (seen.has(id)) continue;
    seen.add(id);
    const props = metaFromTags("way", way.id, tags, tipo, lengthKm(line));
    features.push({
      type: "Feature",
      id,
      geometry: { type: "LineString", coordinates: line },
      properties: props,
    });
  }

  features.sort((a, b) => {
    const oa = a.properties.tipo.localeCompare(b.properties.tipo);
    if (oa !== 0) return oa;
    return a.properties.nome.localeCompare(b.properties.nome, "it");
  });

  const percorsi = features.map((f) => f.properties);
  const n_ciclo = percorsi.filter((p) => p.tipo === "bicycle").length;
  const n_mtb = percorsi.filter((p) => p.tipo === "mtb").length;
  const n_pedo = percorsi.filter(
    (p) => p.tipo === "hiking" || p.tipo === "foot",
  ).length;

  return {
    percorsi,
    geojson: { type: "FeatureCollection", features },
    kpi: {
      n_totale: percorsi.length,
      n_ciclo,
      n_mtb,
      n_pedo,
    },
    bbox,
    comune: COMUNE_NOME,
  };
}

export function hasPercorsiPayload(data: PercorsiData): boolean {
  return data.percorsi.length > 0;
}

export function percorsoColor(tipo: PercorsoTipo): string {
  switch (tipo) {
    case "bicycle":
      return "#008758";
    case "mtb":
      return "#117A65";
    case "hiking":
      return "#5B2C6F";
    default:
      return "#7D3C98";
  }
}
