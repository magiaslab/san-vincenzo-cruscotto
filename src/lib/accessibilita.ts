import {
  COMUNE_NOME,
  COMUNE_SAN_VINCENZO_URL,
  MAP_CENTER,
  OSM_COPYRIGHT_URL,
} from "@/lib/constants";

export const WHEELMAP_URL =
  "https://wheelmap.org/it/map#/?lat=43.085&lng=10.54&zoom=14" as const;
export const ISTAT_DISABILITA_CIFRE_URL =
  "https://www.disabilitaincifre.istat.it/" as const;
export const COMUNE_STALLI_DISABILI_URL =
  `${COMUNE_SAN_VINCENZO_URL}Servizi/Disciplina-delle-riserve-di-stalli-di-sosta-personali-per-disabili-e-istituzione-sosta-gratuita-su-stalli-a-pagamento-per-disabili` as const;

export type AccessPoint = {
  id: string;
  osm_type: string;
  osm_id: number;
  lat: number;
  lon: number;
  nome: string | null;
  categoria: string;
  tipo:
    | "wheelchair"
    | "parking_disabled"
    | "toilet_accessible"
    | "other";
  wheelchair: string | null;
  indirizzo: string | null;
  tags: Record<string, string>;
  osm_url: string;
};

export type AccessibilitaPayload = {
  disponibile: boolean;
  aggiornato_at: string;
  comune: string;
  raggio_km: number;
  kpi: {
    n_totale: number;
    n_wheelchair_yes: number;
    n_wheelchair_limited: number;
    n_wheelchair_no: number;
    n_parking_disabled: number;
    n_toilet_accessible: number;
    n_con_nome: number;
  };
  punti: AccessPoint[];
  disclaimer: string;
  fonti: Array<{ label: string; url: string }>;
};

const DISCLAIMER =
  "Dati OpenStreetMap / Wheelmap basati su contributi volontari: possono essere incompleti o non aggiornati. Non sostituiscono i servizi ufficiali del Comune, della SDS o dell’Azienda USL. Segnala correzioni su OpenStreetMap o Wheelmap.";

const OVERPASS_ENDPOINTS = [
  "https://overpass.kumi.systems/api/interpreter",
  "https://overpass-api.de/api/interpreter",
] as const;

function buildQuery(lat: number, lon: number, radiusM: number): string {
  return `[out:json][timeout:60];
(
  node["wheelchair"](around:${radiusM},${lat},${lon});
  way["wheelchair"](around:${radiusM},${lat},${lon});
  node["amenity"="parking_space"]["parking_space"="disabled"](around:${radiusM},${lat},${lon});
  way["amenity"="parking_space"]["parking_space"="disabled"](around:${radiusM},${lat},${lon});
  node["capacity:disabled"](around:${radiusM},${lat},${lon});
  way["capacity:disabled"](around:${radiusM},${lat},${lon});
  node["amenity"="toilets"]["wheelchair"="yes"](around:${radiusM},${lat},${lon});
);
out center tags;`;
}

type OverpassElement = {
  type: string;
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat?: number; lon?: number };
  tags?: Record<string, string>;
};

function pickCategory(tags: Record<string, string>): string {
  return (
    tags.amenity ||
    tags.tourism ||
    tags.shop ||
    tags.leisure ||
    tags.highway ||
    tags.office ||
    tags.healthcare ||
    tags.historic ||
    "luogo"
  );
}

function classify(tags: Record<string, string>): AccessPoint["tipo"] {
  if (
    tags.parking_space === "disabled" ||
    (tags["capacity:disabled"] != null && tags["capacity:disabled"] !== "0")
  ) {
    return "parking_disabled";
  }
  if (tags.amenity === "toilets" && tags.wheelchair === "yes") {
    return "toilet_accessible";
  }
  if (tags.wheelchair) return "wheelchair";
  return "other";
}

function addressFrom(tags: Record<string, string>): string | null {
  const parts = [
    tags["addr:street"],
    tags["addr:housenumber"],
    tags["addr:city"] || tags["addr:place"],
  ].filter(Boolean);
  return parts.length ? parts.join(" ") : null;
}

function toPoint(el: OverpassElement): AccessPoint | null {
  const lat = el.lat ?? el.center?.lat;
  const lon = el.lon ?? el.center?.lon;
  if (typeof lat !== "number" || typeof lon !== "number") return null;
  const tags = el.tags ?? {};
  return {
    id: `${el.type}/${el.id}`,
    osm_type: el.type,
    osm_id: el.id,
    lat,
    lon,
    nome: tags.name || tags.operator || tags.brand || null,
    categoria: pickCategory(tags),
    tipo: classify(tags),
    wheelchair: tags.wheelchair ?? null,
    indirizzo: addressFrom(tags),
    tags,
    osm_url: `https://www.openstreetmap.org/${el.type}/${el.id}`,
  };
}

async function fetchOverpass(query: string): Promise<OverpassElement[]> {
  let lastErr: unknown;
  for (const endpoint of OVERPASS_ENDPOINTS) {
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
          Accept: "application/json",
          "User-Agent":
            "CruscottoSanVincenzo/1.0 (+https://www.cruscottosanvincenzo.it)",
        },
        body: `data=${encodeURIComponent(query)}`,
        next: { revalidate: 21600 },
      });
      if (!res.ok) throw new Error(`overpass_http_${res.status}`);
      const json = (await res.json()) as { elements?: OverpassElement[] };
      return Array.isArray(json.elements) ? json.elements : [];
    } catch (err) {
      lastErr = err;
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error("overpass_failed");
}

/** Keyword euristiche per evidenziare enti RUNTS rilevanti per inclusione/cura. */
export const RUNTS_INCLUSIONE_RE =
  /disabil|handicap|inclus|accessib|fragile|sostegno|sociale|cooperativa\s*sociale|auser|misericord|croce\s*rossa|fratres|avis|cura|invecchiamento|malat|volontar|ods|odv|aps|ets/i;

export function isRuntsInclusione(denom: string, sez?: string): boolean {
  const hay = `${denom} ${sez ?? ""}`;
  // Preferisci match tematici forti; sezioni ODV/APS/ETS da sole non bastano
  return /disabil|handicap|inclus|accessib|fragile|sostegno|auser|misericord|croce\s*rossa|fratres|avis|cura|invecchiamento|malat|oncolog|cooperativa\s*sociale/i.test(
    hay,
  );
}

export async function buildAccessibilitaPayload(
  radiusKm = 6,
): Promise<AccessibilitaPayload> {
  const [lat, lon] = MAP_CENTER;
  const radiusM = Math.round(radiusKm * 1000);
  const elements = await fetchOverpass(buildQuery(lat, lon, radiusM));
  const byId = new Map<string, AccessPoint>();
  for (const el of elements) {
    const p = toPoint(el);
    if (!p) continue;
    byId.set(p.id, p);
  }
  const punti = [...byId.values()].sort((a, b) => {
    const order = {
      parking_disabled: 0,
      toilet_accessible: 1,
      wheelchair: 2,
      other: 3,
    } as const;
    const d = order[a.tipo] - order[b.tipo];
    if (d !== 0) return d;
    return (a.nome ?? a.categoria).localeCompare(b.nome ?? b.categoria, "it");
  });

  const kpi = {
    n_totale: punti.length,
    n_wheelchair_yes: punti.filter((p) => p.wheelchair === "yes").length,
    n_wheelchair_limited: punti.filter((p) => p.wheelchair === "limited")
      .length,
    n_wheelchair_no: punti.filter((p) => p.wheelchair === "no").length,
    n_parking_disabled: punti.filter((p) => p.tipo === "parking_disabled")
      .length,
    n_toilet_accessible: punti.filter((p) => p.tipo === "toilet_accessible")
      .length,
    n_con_nome: punti.filter((p) => Boolean(p.nome)).length,
  };

  return {
    disponibile: punti.length > 0,
    aggiornato_at: new Date().toISOString(),
    comune: COMUNE_NOME,
    raggio_km: radiusKm,
    kpi,
    punti,
    disclaimer: DISCLAIMER,
    fonti: [
      { label: "OpenStreetMap", url: OSM_COPYRIGHT_URL },
      { label: "Wheelmap", url: WHEELMAP_URL },
      { label: "ISTAT Disabilità in cifre", url: ISTAT_DISABILITA_CIFRE_URL },
      {
        label: "Comune — stalli / CUDE",
        url: COMUNE_STALLI_DISABILI_URL,
      },
    ],
  };
}
