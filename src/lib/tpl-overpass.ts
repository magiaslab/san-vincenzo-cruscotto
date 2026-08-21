/**
 * Fermate TPL da OpenStreetMap (Overpass) quando manca l’estratto GTFS locale.
 */
import { HTTP_USER_AGENT } from "@/lib/constants";

const OVERPASS_ENDPOINTS = [
  "https://overpass-api.de/api/interpreter",
  "https://lz4.overpass-api.de/api/interpreter",
  "https://z.overpass-api.de/api/interpreter",
] as const;

const OVERPASS_FETCH_MS = 22_000;

export type OsmTplStop = {
  stop_id: string;
  name: string | null;
  lat: number;
  lon: number;
  dist_km: number;
  routes_sample?: string[];
};

type OverpassElement = {
  type: string;
  id: number;
  lat?: number;
  lon?: number;
  tags?: Record<string, string>;
};

function haversineKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371;
  const p = Math.PI / 180;
  const a =
    Math.sin(((lat2 - lat1) * p) / 2) ** 2 +
    Math.cos(lat1 * p) *
      Math.cos(lat2 * p) *
      Math.sin(((lon2 - lon1) * p) / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

async function fetchOverpass(query: string): Promise<OverpassElement[]> {
  let lastErr: unknown;
  for (const endpoint of OVERPASS_ENDPOINTS) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), OVERPASS_FETCH_MS);
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
          Accept: "application/json",
          "User-Agent": HTTP_USER_AGENT,
        },
        body: `data=${encodeURIComponent(query)}`,
        signal: ctrl.signal,
        cache: "no-store",
      });
      if (!res.ok) throw new Error(`overpass_http_${res.status}`);
      const json = (await res.json()) as { elements?: OverpassElement[] };
      const elements = Array.isArray(json.elements) ? json.elements : [];
      if (elements.length === 0) {
        lastErr = new Error(`overpass_empty:${endpoint}`);
        continue;
      }
      return elements;
    } catch (err) {
      lastErr = err;
    } finally {
      clearTimeout(timer);
    }
  }
  if (
    lastErr instanceof Error &&
    String(lastErr.message).startsWith("overpass_empty:")
  ) {
    return [];
  }
  throw lastErr instanceof Error ? lastErr : new Error("overpass_failed");
}

function toStop(
  el: OverpassElement,
  lat0: number,
  lon0: number,
): OsmTplStop | null {
  const lat = el.lat;
  const lon = el.lon;
  if (typeof lat !== "number" || typeof lon !== "number") return null;
  const tags = el.tags ?? {};
  return {
    stop_id: `osm/${el.type}/${el.id}`,
    name: tags.name || tags.ref || null,
    lat,
    lon,
    dist_km: Math.round(haversineKm(lat0, lon0, lat, lon) * 100) / 100,
  };
}

export async function fetchOsmTplStops(
  lat: number,
  lon: number,
  radiusKm: number,
): Promise<{ bus: OsmTplStop[]; train: OsmTplStop[] }> {
  const radiusM = Math.round(Math.max(radiusKm, 1) * 1000);
  const query = `[out:json][timeout:25];
(
  node["highway"="bus_stop"](around:${radiusM},${lat},${lon});
  node["public_transport"="platform"]["bus"="yes"](around:${radiusM},${lat},${lon});
  node["amenity"="bus_station"](around:${radiusM},${lat},${lon});
  node["railway"="station"](around:${radiusM},${lat},${lon});
  node["railway"="halt"](around:${radiusM},${lat},${lon});
);
out body tags;`;

  const elements = await fetchOverpass(query);
  const bus: OsmTplStop[] = [];
  const train: OsmTplStop[] = [];
  const seen = new Set<string>();

  for (const el of elements) {
    const stop = toStop(el, lat, lon);
    if (!stop || seen.has(stop.stop_id)) continue;
    seen.add(stop.stop_id);
    const tags = el.tags ?? {};
    const isRail =
      tags.railway === "station" ||
      tags.railway === "halt" ||
      tags.train === "yes";
    if (isRail && tags.highway !== "bus_stop") train.push(stop);
    else bus.push(stop);
  }

  bus.sort((a, b) => a.dist_km - b.dist_km);
  train.sort((a, b) => a.dist_km - b.dist_km);
  return { bus, train };
}

export { haversineKm };
