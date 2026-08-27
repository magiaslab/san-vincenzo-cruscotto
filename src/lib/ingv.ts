/**
 * Terremoti INGV — FDSN event, GeoJSON, filtro bbox comunale.
 */
import { COMUNE, getComuneBbox, isFeatureEnabled } from "@/lib/comune-config";
import { fetchUa } from "@/lib/http-ua";

export const INGV_FONTE = "INGV — Italian Seismological Instrumental and Parametric Data-Base (CC BY 4.0)";

export type Terremoto = {
  id: string;
  mag: number | null;
  luogo: string;
  profonditaKm: number | null;
  lat: number;
  lon: number;
  distanzaKm: number | null;
  quando: string;
  url: string | null;
};

export type TerremotiData = {
  raggioKm: number;
  eventi: Terremoto[];
  note: string | null;
};

function haversineKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371;
  const toR = (d: number) => (d * Math.PI) / 180;
  const dLat = toR(lat2 - lat1);
  const dLon = toR(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toR(lat1)) * Math.cos(toR(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(a)));
}

export async function buildTerremoti(): Promise<TerremotiData> {
  if (!isFeatureEnabled("terremoti")) {
    return { raggioKm: 0, eventi: [], note: "Modulo spento (features.terremoti)." };
  }
  const b = getComuneBbox();
  const pad = 0.15;
  const start = new Date();
  start.setFullYear(start.getFullYear() - 1);
  const starttime = start.toISOString().slice(0, 10);
  const qs = new URLSearchParams({
    format: "geojson",
    starttime,
    minlat: String(b.latMin - pad),
    maxlat: String(b.latMax + pad),
    minlon: String(b.lonMin - pad),
    maxlon: String(b.lonMax + pad),
    orderby: "time",
    limit: "50",
  });
  const url = `https://webservices.ingv.it/fdsnws/event/1/query?${qs.toString()}`;
  const res = await fetchUa(url, {
    headers: { Accept: "application/json" },
    timeoutMs: 25_000,
  });
  if (!res.ok) {
    return {
      raggioKm: COMUNE.geo.bbox_radius_km,
      eventi: [],
      note: `INGV ha risposto ${res.status}.`,
    };
  }
  const json = (await res.json()) as {
    features?: Array<{
      id?: string;
      geometry?: { coordinates?: number[] };
      properties?: Record<string, unknown>;
    }>;
  };
  const [clat, clon] = COMUNE.geo.map_center;
  const eventi: Terremoto[] = [];
  for (const f of json.features ?? []) {
    const coords = f.geometry?.coordinates;
    if (!coords || coords.length < 2) continue;
    const lon = Number(coords[0]);
    const lat = Number(coords[1]);
    const depth = coords.length > 2 ? Number(coords[2]) : null;
    const p = f.properties ?? {};
    const mag = Number(p.mag ?? p.magnitude);
    eventi.push({
      id: String(f.id ?? p.eventId ?? `${lat},${lon}`),
      mag: Number.isFinite(mag) ? mag : null,
      luogo: String(p.place ?? p.flynn_region ?? p.region ?? "—"),
      profonditaKm: depth != null && Number.isFinite(depth) ? depth : null,
      lat,
      lon,
      distanzaKm: haversineKm(clat, clon, lat, lon),
      quando: String(p.time ?? p.origin_time ?? ""),
      url: typeof p.url === "string" ? p.url : null,
    });
  }
  eventi.sort((a, b) => (b.quando > a.quando ? 1 : -1));
  return {
    raggioKm: COMUNE.geo.bbox_radius_km,
    eventi: eventi.slice(0, 30),
    note: eventi.length === 0 ? "Nessun evento INGV nell’ultimo anno nel raggio." : null,
  };
}
