/**
 * Alberi monumentali MASAF — solo GeoJSON locale (niente XLS a runtime).
 * Aggiornare con: npm run alberi:sync
 */
import { readFile } from "node:fs/promises";
import path from "node:path";
import { COMUNE, isFeatureEnabled } from "@/lib/comune-config";

export const ALBERI_FONTE =
  "MASAF — Elenco degli alberi monumentali d’Italia (GeoJSON locale)";
export const ALBERI_GEOJSON_PATH = "/data/alberi-monumentali.geojson";

export type AlberoFeature = {
  type: "Feature";
  geometry: { type: "Point"; coordinates: [number, number] };
  properties: {
    nome?: string;
    specie?: string;
    comune?: string;
    localita?: string;
  };
};

export type AlberiData = {
  n: number;
  geojsonPath: string;
  features: AlberoFeature[];
  note: string | null;
};

export async function buildAlberiMonumentali(): Promise<AlberiData> {
  if (!isFeatureEnabled("alberi_monumentali")) {
    return {
      n: 0,
      geojsonPath: ALBERI_GEOJSON_PATH,
      features: [],
      note: "Modulo spento (features.alberi_monumentali).",
    };
  }
  try {
    const rel = ALBERI_GEOJSON_PATH.replace(/^\//, "");
    const raw = await readFile(path.join(process.cwd(), "public", rel), "utf8");
    const json = JSON.parse(raw) as {
      features?: AlberoFeature[];
    };
    const features = (json.features ?? []).filter(
      (f) =>
        f?.geometry?.type === "Point" &&
        Array.isArray(f.geometry.coordinates) &&
        f.geometry.coordinates.length >= 2,
    );
    return {
      n: features.length,
      geojsonPath: ALBERI_GEOJSON_PATH,
      features,
      note:
        features.length === 0
          ? `Nessun albero monumentale nel GeoJSON locale per ${COMUNE.nome}. Aggiornare con npm run alberi:sync.`
          : null,
    };
  } catch {
    return {
      n: 0,
      geojsonPath: ALBERI_GEOJSON_PATH,
      features: [],
      note: "File public/data/alberi-monumentali.geojson assente o illeggibile.",
    };
  }
}
