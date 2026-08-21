/**
 * Etichette potabilità e fontanelle del gestore idrico via WFS GeoServer.
 * Per San Vincenzo: ASA SpA (asamap.it, ATO 5 Toscana Costa).
 * Non è un catalogo CKAN: layer WFS non documentato, usato dalla mappa pubblica.
 */
import type { Feature, FeatureCollection, Geometry } from "geojson";
import {
  COMUNE,
  getComuneBbox,
  inComuneBbox,
  matchesComuneNome,
  type GestoreAcquaConfig,
} from "@/lib/comune-config";
import { HTTP_USER_AGENT } from "@/lib/constants";

export const ACQUA_FONTE = "ASA GeoServer WFS (etichette e fontanelle)";

const FETCH_MS = 20_000;

export type EtichettaAcqua = {
  id: string;
  cod_acq: string;
  acquedotto: string;
  comune: string;
  produttore: string;
  luogo_prel: string;
  distretto: string;
  note: string;
  documento: string;
};

export type FontanellaAcqua = {
  id: string;
  tipo: string;
  strada: string;
  ubicazione: string;
  alta_qualita: boolean;
  lon: number;
  lat: number;
};

export type AcquaData = {
  gestore: {
    nome: string;
    url: string;
    etichette_map_url: string;
    fontanelle_map_url: string;
    composizione_url: string;
    ait_opendata_url: string;
  };
  etichette: EtichettaAcqua[];
  fontanelle: FontanellaAcqua[];
  geojson: FeatureCollection;
};

type WfsFeature = {
  id?: string;
  type?: string;
  geometry?: Geometry | null;
  properties?: Record<string, unknown>;
};

function propStr(p: Record<string, unknown> | undefined, key: string): string {
  const v = p?.[key];
  return typeof v === "string" ? v.trim() : v == null ? "" : String(v).trim();
}

function escapeCql(value: string): string {
  return value.replace(/'/g, "''");
}

function wfsUrl(
  base: string,
  typeName: string,
  extra: Record<string, string>,
): string {
  const u = new URL(base);
  u.searchParams.set("service", "WFS");
  u.searchParams.set("version", "1.0.0");
  u.searchParams.set("request", "GetFeature");
  u.searchParams.set("typeName", typeName);
  u.searchParams.set("outputFormat", "application/json");
  u.searchParams.set("srsname", "EPSG:4326");
  for (const [k, v] of Object.entries(extra)) {
    if (v) u.searchParams.set(k, v);
  }
  return u.toString();
}

async function fetchWfs(
  url: string,
): Promise<{ features: WfsFeature[] }> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), FETCH_MS);
  try {
    const res = await fetch(url, {
      headers: {
        Accept: "application/json,application/vnd.geo+json,*/*",
        "User-Agent": HTTP_USER_AGENT,
      },
      signal: ctrl.signal,
      next: { revalidate: 21600 },
    });
    if (!res.ok) throw new Error(`wfs_http_${res.status}`);
    const json = (await res.json()) as { features?: WfsFeature[] };
    return { features: Array.isArray(json.features) ? json.features : [] };
  } finally {
    clearTimeout(timer);
  }
}

function bboxParam(): string {
  const b = getComuneBbox();
  return `${b.lonMin},${b.latMin},${b.lonMax},${b.latMax},EPSG:4326`;
}

async function fetchLayer(
  cfg: GestoreAcquaConfig,
  typeName: string,
): Promise<WfsFeature[]> {
  if (!cfg.geoserver_wfs || !typeName) return [];
  const nome = COMUNE.nome.trim().toUpperCase();
  const cql = `comune='${escapeCql(nome)}'`;
  try {
    const byName = await fetchWfs(
      wfsUrl(cfg.geoserver_wfs, typeName, { CQL_FILTER: cql }),
    );
    if (byName.features.length > 0) return byName.features;
  } catch {
    // fallback bbox
  }
  try {
    const byBbox = await fetchWfs(
      wfsUrl(cfg.geoserver_wfs, typeName, { bbox: bboxParam() }),
    );
    return byBbox.features.filter((f) => {
      const comune = propStr(f.properties, "comune");
      if (comune && matchesComuneNome(comune)) return true;
      const g = f.geometry;
      if (g?.type === "Point" && Array.isArray(g.coordinates)) {
        const [lon, lat] = g.coordinates as number[];
        return typeof lat === "number" && typeof lon === "number"
          ? inComuneBbox(lat, lon)
          : false;
      }
      return false;
    });
  } catch {
    return [];
  }
}

function parseEtichetta(f: WfsFeature): EtichettaAcqua | null {
  const p = f.properties ?? {};
  const id = propStr(p, "id") || String(f.id ?? "");
  const acquedotto = propStr(p, "acquedotto");
  if (!id && !acquedotto) return null;
  return {
    id: id || acquedotto,
    cod_acq: propStr(p, "cod_acq"),
    acquedotto,
    comune: propStr(p, "comune"),
    produttore: propStr(p, "produttore"),
    luogo_prel: propStr(p, "luogo_prel"),
    distretto: propStr(p, "distretto"),
    note: propStr(p, "note"),
    documento: propStr(p, "link"),
  };
}

function parseFontanella(f: WfsFeature, alta: boolean): FontanellaAcqua | null {
  const g = f.geometry;
  if (g?.type !== "Point" || !Array.isArray(g.coordinates)) return null;
  const [lon, lat] = g.coordinates as number[];
  if (typeof lon !== "number" || typeof lat !== "number") return null;
  const p = f.properties ?? {};
  const tipo = propStr(p, "tipo") || (alta ? "Fontanella alta qualità" : "Fontanella");
  return {
    id: propStr(p, "id") || String(f.id ?? `${lon},${lat}`),
    tipo,
    strada: propStr(p, "strada"),
    ubicazione: propStr(p, "ubicazione"),
    alta_qualita: alta || /alta\s*qualit/i.test(tipo) || Number(p.qualita) === 1,
    lon,
    lat,
  };
}

function toGeojson(
  etichette: WfsFeature[],
  fontanelle: WfsFeature[],
  fontanelleAq: WfsFeature[],
): FeatureCollection {
  const features: Feature[] = [];
  for (const f of etichette) {
    if (!f.geometry) continue;
    const e = parseEtichetta(f);
    features.push({
      type: "Feature",
      id: e?.id,
      geometry: f.geometry,
      properties: {
        kind: "etichetta",
        ...e,
      },
    });
  }
  for (const [list, alta] of [
    [fontanelle, false],
    [fontanelleAq, true],
  ] as const) {
    for (const f of list) {
      const p = parseFontanella(f, alta);
      if (!p || !f.geometry) continue;
      features.push({
        type: "Feature",
        id: p.id,
        geometry: f.geometry,
        properties: {
          kind: "fontanella",
          ...p,
        },
      });
    }
  }
  return { type: "FeatureCollection", features };
}

export function hasAcquaPayload(data: AcquaData | null): boolean {
  if (!data) return false;
  return (
    data.etichette.length > 0 ||
    data.fontanelle.length > 0 ||
    Boolean(data.gestore.nome || data.gestore.url)
  );
}

export async function buildAcquaData(): Promise<AcquaData | null> {
  const cfg = COMUNE.gestori.acqua;
  if (!cfg.geoserver_wfs && !cfg.nome && !cfg.url) return null;

  let etichetteF: WfsFeature[] = [];
  let fontF: WfsFeature[] = [];
  let fontAqF: WfsFeature[] = [];
  if (cfg.geoserver_wfs) {
    const [e, f, fa] = await Promise.all([
      fetchLayer(cfg, cfg.etichette_layer),
      fetchLayer(cfg, cfg.fontanelle_layer),
      fetchLayer(cfg, cfg.fontanelle_aq_layer),
    ]);
    etichetteF = e;
    fontF = f;
    fontAqF = fa;
  }

  const etichette = etichetteF
    .map(parseEtichetta)
    .filter((x): x is EtichettaAcqua => x != null);
  const fontanelle = [
    ...fontF.map((f) => parseFontanella(f, false)),
    ...fontAqF.map((f) => parseFontanella(f, true)),
  ].filter((x): x is FontanellaAcqua => x != null);

  return {
    gestore: {
      nome: cfg.nome,
      url: cfg.url,
      etichette_map_url: cfg.etichette_map_url,
      fontanelle_map_url: cfg.fontanelle_map_url,
      composizione_url: cfg.composizione_url,
      ait_opendata_url: cfg.ait_opendata_url,
    },
    etichette,
    fontanelle,
    geojson: toGeojson(etichetteF, fontF, fontAqF),
  };
}
