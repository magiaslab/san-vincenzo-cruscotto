/** Tipi e costanti per il bot Telegram DAE. */

export const DAE_SEGNALAZIONI_PATH = "/data/dae-segnalazioni.geojson";

/** BBox San Vincenzo (allineata a scripts/sync-dae-geojson.mjs). */
export const DAE_BBOX = {
  lonMin: 10.48,
  latMin: 43.02,
  lonMax: 10.58,
  latMax: 43.12,
} as const;

export type DaeSegnalazioneStatus =
  | "pending"
  | "approved_overlay"
  | "rejected";

export type DaeSegnalazioneProps = {
  id: string;
  status: DaeSegnalazioneStatus;
  nome: string;
  ubicazione: string;
  accesso: string;
  indoor: boolean;
  telegram_user_id: number;
  telegram_username?: string;
  created_at: string;
  reviewed_at?: string;
  note_moderazione?: string;
  osm_url?: string;
};

export type DaeSegnalazioneFeature = {
  type: "Feature";
  geometry: { type: "Point"; coordinates: [number, number] };
  properties: DaeSegnalazioneProps;
};

export type DaeSegnalazioniCollection = {
  type: "FeatureCollection";
  features: DaeSegnalazioneFeature[];
  meta?: Record<string, unknown>;
};

export function inDaeBbox(lat: number, lon: number): boolean {
  return (
    lon >= DAE_BBOX.lonMin &&
    lon <= DAE_BBOX.lonMax &&
    lat >= DAE_BBOX.latMin &&
    lat <= DAE_BBOX.latMax
  );
}

export function haversineM(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

/** Marker nascosto nel messaggio bot per recuperare lat/lon dalla reply. */
export function encodeCoordMarker(lat: number, lon: number): string {
  return `⟦DAE:${lat.toFixed(6)},${lon.toFixed(6)}⟧`;
}

export function decodeCoordMarker(text: string): { lat: number; lon: number } | null {
  const m = text.match(/⟦DAE:(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)⟧/);
  if (!m) return null;
  const lat = Number(m[1]);
  const lon = Number(m[2]);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
  return { lat, lon };
}

export function newSegnalazioneId(): string {
  return `dae_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}
