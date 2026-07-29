import { CIVICI_MAP_LIMIT } from "./constants";

export type GeoFeature = {
  type: "Feature";
  geometry: { type: "Point"; coordinates: [number, number] };
  properties: Record<string, unknown>;
};

export type FeatureCollection = {
  type: "FeatureCollection";
  features: GeoFeature[];
  meta?: Record<string, unknown>;
};

function pointFeature(
  lon: number,
  lat: number,
  properties: Record<string, unknown>,
): GeoFeature | null {
  if (
    typeof lon !== "number" ||
    typeof lat !== "number" ||
    Number.isNaN(lon) ||
    Number.isNaN(lat)
  ) {
    return null;
  }
  return {
    type: "Feature",
    geometry: { type: "Point", coordinates: [lon, lat] },
    properties,
  };
}

export function buildMapLayers(
  dashboard: Record<string, unknown>,
  options?: { civiciLimit?: number; civiciOffset?: number },
): Record<string, FeatureCollection> {
  const limit = options?.civiciLimit ?? CIVICI_MAP_LIMIT;
  const offset = options?.civiciOffset ?? 0;
  const layers: Record<string, FeatureCollection> = {};

  const anncsu = dashboard.anncsu as
    | {
        kpi?: { bbox?: unknown; n_civici?: number };
        punti?: Array<{
          lat: number;
          lon: number;
          odo?: string;
          civ?: string;
          esp?: string;
          quota?: number | null;
        }>;
      }
    | undefined;

  if (anncsu?.punti?.length) {
    const slice = anncsu.punti.slice(offset, offset + limit);
    const features = slice
      .map((p) =>
        pointFeature(p.lon, p.lat, {
          layer: "civici",
          odonimo: p.odo,
          civico: p.civ,
          esponente: p.esp,
          quota: p.quota,
        }),
      )
      .filter(Boolean) as GeoFeature[];

    layers.civici = {
      type: "FeatureCollection",
      features,
      meta: {
        total_in_payload: anncsu.punti.length,
        n_civici_kpi: anncsu.kpi?.n_civici,
        bbox: anncsu.kpi?.bbox,
        offset,
        limit,
        truncated: offset + limit < anncsu.punti.length,
        nota:
          "Il dashboard MCP espone un campione di civici georeferenziati; il totale comunale è in kpi.n_civici.",
      },
    };
  }

  const pun = dashboard.pun as
    | {
        punti?: Array<{
          lat: number;
          lon: number;
          id_evse?: string;
          indirizzo?: string;
          stato?: string;
          cpo?: string;
          potenza_w?: number;
          potenza_categoria?: string;
          corrente?: string;
        }>;
      }
    | undefined;

  if (pun?.punti?.length) {
    const features = pun.punti
      .map((p) =>
        pointFeature(p.lon, p.lat, {
          layer: "ev",
          id: p.id_evse,
          indirizzo: p.indirizzo,
          stato: p.stato,
          attivo: String(p.stato ?? "").toLowerCase().includes("attiv"),
          cpo: p.cpo,
          potenza_kw: p.potenza_w ? p.potenza_w / 1000 : null,
          categoria: p.potenza_categoria,
          corrente: p.corrente,
        }),
      )
      .filter(Boolean) as GeoFeature[];

    layers.ev = {
      type: "FeatureCollection",
      features,
      meta: { total: features.length },
    };
  }

  const beni = dashboard.beni_culturali as
    | {
        kpi?: { n_con_coordinate?: number };
        luoghi?: Array<{
          lat?: number;
          lon?: number;
          nome?: string;
          categoria?: string;
        }>;
      }
    | undefined;

  const nCoord = beni?.kpi?.n_con_coordinate ?? 0;
  if (nCoord > 0 && beni?.luoghi?.length) {
    const features = beni.luoghi
      .map((p) =>
        pointFeature(p.lon as number, p.lat as number, {
          layer: "beni",
          nome: p.nome,
          categoria: p.categoria,
        }),
      )
      .filter(Boolean) as GeoFeature[];
    layers.beni_culturali = {
      type: "FeatureCollection",
      features,
      meta: { n_con_coordinate: nCoord },
    };
  } else {
    layers.beni_culturali = {
      type: "FeatureCollection",
      features: [],
      meta: {
        n_con_coordinate: 0,
        disponibile: false,
        messaggio: "Nessun bene culturale MiC con coordinate per questo comune.",
      },
    };
  }

  const farmacie = (
    dashboard.sanita_mds as
      | {
          farmacie?: { punti?: Array<Record<string, unknown>> };
          parafarmacie?: { punti?: Array<Record<string, unknown>> };
        }
      | undefined
  )?.farmacie?.punti;
  const para = (
    dashboard.sanita_mds as
      | { parafarmacie?: { punti?: Array<Record<string, unknown>> } }
      | undefined
  )?.parafarmacie?.punti;

  const healthPoints = [...(farmacie ?? []), ...(para ?? [])];
  if (healthPoints.length) {
    const features = healthPoints
      .map((p) =>
        pointFeature(p.lon as number, p.lat as number, {
          layer: "sanita",
          nome: p.nome,
          tipo: p.tipo ?? "Parafarmacia",
          indirizzo: p.indirizzo,
        }),
      )
      .filter(Boolean) as GeoFeature[];
    layers.sanita = {
      type: "FeatureCollection",
      features,
      meta: { total: features.length },
    };
  }

  return layers;
}
