/**
 * Stazioni meteo-idro regionali via WFS OGC.
 * Forma generica: regione_opendata.stazioni_wfs.
 */
import {
  COMUNE,
  getComuneBbox,
  isFeatureEnabled,
} from "@/lib/comune-config";
import { fetchUa } from "@/lib/http-ua";

export const STAZIONI_FONTE = "Rete meteo-idro regionale (WFS OGC)";

export type StazioneValore = {
  nome: string;
  codice: string;
  tipo: string;
  lat: number | null;
  lon: number | null;
  quota: number | null;
  grandezza: string;
  valore: number | null;
  unita: string;
  quando: string | null;
};

export type StazioniData = {
  stazioni: StazioneValore[];
  note: string | null;
};

function pickNum(props: Record<string, unknown>, keys: string[]): number | null {
  for (const k of keys) {
    const found = Object.keys(props).find(
      (p) => p.toLowerCase() === k.toLowerCase(),
    );
    if (!found) continue;
    const n = Number(props[found]);
    if (Number.isFinite(n)) return n;
  }
  return null;
}

function pickStr(props: Record<string, unknown>, keys: string[]): string {
  for (const k of keys) {
    const found = Object.keys(props).find((p) =>
      p.toLowerCase().includes(k.toLowerCase()),
    );
    if (!found) continue;
    const v = props[found];
    if (v != null && String(v).trim()) return String(v).trim();
  }
  return "";
}

async function getFeature(base: string, typeName: string, bbox: string, srs: string) {
  const qs = new URLSearchParams({
    service: "WFS",
    version: "1.1.0",
    request: "GetFeature",
    typeName,
    outputFormat: "application/json",
    srsName: srs || "EPSG:4326",
    bbox,
  });
  const url = `${base.replace(/\?.*$/, "")}?${qs.toString()}`;
  const res = await fetchUa(url, { timeoutMs: 25_000 });
  if (!res.ok) return [];
  const json = (await res.json()) as {
    features?: Array<{
      geometry?: { coordinates?: number[] };
      properties?: Record<string, unknown>;
    }>;
  };
  return json.features ?? [];
}

export async function buildStazioni(): Promise<StazioniData> {
  if (!isFeatureEnabled("stazioni_regionali")) {
    return {
      stazioni: [],
      note: "Modulo spento (features.stazioni_regionali). Configura regione_opendata.stazioni_wfs.",
    };
  }
  const cfg = COMUNE.regione_opendata.stazioni_wfs;
  if (!cfg.base_url || cfg.layer_stazioni.length === 0) {
    return {
      stazioni: [],
      note: "Manca regione_opendata.stazioni_wfs.base_url / layer_stazioni.",
    };
  }
  const b = getComuneBbox();
  const bbox = `${b.lonMin},${b.latMin},${b.lonMax},${b.latMax},${cfg.srs || "EPSG:4326"}`;
  const out: StazioneValore[] = [];
  try {
    for (const layer of cfg.layer_stazioni) {
      const feats = await getFeature(cfg.base_url, layer, bbox, cfg.srs);
      for (const f of feats) {
        const p = f.properties ?? {};
        const coords = f.geometry?.coordinates;
        out.push({
          nome: pickStr(p, ["nome", "name", "denominazione", "stazione"]),
          codice: pickStr(p, ["codice", "id", "station", "cod_staz"]),
          tipo: layer,
          lat: coords && coords.length >= 2 ? Number(coords[1]) : pickNum(p, ["lat", "latitude"]),
          lon: coords && coords.length >= 2 ? Number(coords[0]) : pickNum(p, ["lon", "longitude"]),
          quota: pickNum(p, ["quota", "quota_m", "elev", "altezza"]),
          grandezza: pickStr(p, ["grandezza", "variabile", "parametro"]) || layer,
          valore: pickNum(p, ["valore", "value", "misura", "pioggia", "vel", "temp"]),
          unita: pickStr(p, ["unita", "unit", "um"]),
          quando: pickStr(p, ["data", "ora", "timestamp", "time"]) || null,
        });
      }
    }
    for (const layer of cfg.layer_valori) {
      const feats = await getFeature(cfg.base_url, layer, bbox, cfg.srs);
      for (const f of feats) {
        const p = f.properties ?? {};
        const codice = pickStr(p, ["codice", "id", "station", "cod_staz"]);
        const match = out.find((s) => codice && s.codice === codice);
        const valore = pickNum(p, ["valore", "value", "misura", "pioggia", "vel", "temp"]);
        const quando = pickStr(p, ["data", "ora", "timestamp", "time"]) || null;
        if (match) {
          if (valore != null) match.valore = valore;
          if (quando) match.quando = quando;
          const g = pickStr(p, ["grandezza", "variabile"]);
          if (g) match.grandezza = g;
        }
      }
    }
  } catch (err) {
    return {
      stazioni: [],
      note: `WFS non raggiungibile: ${err instanceof Error ? err.message : "errore"}`,
    };
  }
  return {
    stazioni: out,
    note:
      out.length === 0
        ? "Nessuna stazione nel bbox comunale. Verifica layer e srs."
        : null,
  };
}
