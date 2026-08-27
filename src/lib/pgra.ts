/**
 * Pericolosità idraulica PAI/PGRA — ArcGIS REST.
 */
import { COMUNE, getComuneBbox, isFeatureEnabled } from "@/lib/comune-config";
import { fetchUa } from "@/lib/http-ua";

export const PGRA_FONTE = "Autorità di bacino — servizi ArcGIS REST PAI/PGRA";

export type PgraLayer = {
  cartella: string;
  nome: string;
  nFeatures: number;
  url: string;
  errore: string | null;
};

export type PgraData = {
  layers: PgraLayer[];
  note: string | null;
};

export async function buildPgra(): Promise<PgraData> {
  if (!isFeatureEnabled("pericolosita_idraulica")) {
    return {
      layers: [],
      note: "Modulo spento (features.pericolosita_idraulica). Configura regione_opendata.pgra_arcgis.",
    };
  }
  const cfg = COMUNE.regione_opendata.pgra_arcgis;
  if (!cfg.base_url || cfg.cartelle.length === 0) {
    return {
      layers: [],
      note: "Manca regione_opendata.pgra_arcgis.base_url / cartelle.",
    };
  }
  const b = getComuneBbox();
  const geometry = JSON.stringify({
    xmin: b.lonMin,
    ymin: b.latMin,
    xmax: b.lonMax,
    ymax: b.latMax,
    spatialReference: { wkid: 4326 },
  });
  const layers: PgraLayer[] = [];
  for (const cartella of cfg.cartelle) {
    const folderUrl = `${cfg.base_url.replace(/\/$/, "")}/${cartella}?f=json`;
    try {
      const res = await fetchUa(folderUrl, { timeoutMs: 20_000 });
      if (!res.ok) {
        layers.push({
          cartella,
          nome: cartella,
          nFeatures: 0,
          url: folderUrl,
          errore: `HTTP ${res.status}`,
        });
        continue;
      }
      const json = (await res.json()) as {
        services?: Array<{ name?: string; type?: string }>;
        error?: { message?: string };
      };
      const services = (json.services ?? []).filter(
        (s) => (s.type || "MapServer") === "MapServer",
      );
      if (services.length === 0) {
        layers.push({
          cartella,
          nome: cartella,
          nFeatures: 0,
          url: folderUrl,
          errore: json.error?.message ?? "Nessun MapServer in cartella.",
        });
        continue;
      }
      for (const svc of services.slice(0, 4)) {
        const name = String(svc.name ?? cartella);
        const qUrl = `${cfg.base_url.replace(/\/$/, "")}/${name}/MapServer/0/query`;
        const qs = new URLSearchParams({
          f: "json",
          where: "1=1",
          geometry,
          geometryType: "esriGeometryEnvelope",
          inSR: "4326",
          spatialRel: "esriSpatialRelIntersects",
          returnCountOnly: "true",
        });
        const q = await fetchUa(`${qUrl}?${qs.toString()}`, { timeoutMs: 20_000 });
        if (!q.ok) {
          layers.push({
            cartella,
            nome: name,
            nFeatures: 0,
            url: qUrl,
            errore: `query HTTP ${q.status}`,
          });
          continue;
        }
        const qj = (await q.json()) as { count?: number };
        layers.push({
          cartella,
          nome: name,
          nFeatures: typeof qj.count === "number" ? qj.count : 0,
          url: qUrl,
          errore: null,
        });
      }
    } catch (err) {
      layers.push({
        cartella,
        nome: cartella,
        nFeatures: 0,
        url: folderUrl,
        errore: err instanceof Error ? err.message : "errore",
      });
    }
  }
  return {
    layers,
    note:
      layers.length === 0
        ? "Nessun servizio ArcGIS interrogato."
        : "Conteggio feature che intersecano il bbox comunale (EPSG:4326).",
  };
}
