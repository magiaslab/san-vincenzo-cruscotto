import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import {
  AUTOLINEE_GTFS_URL,
  CICLABILI_DATASET_URL,
  CICLABILI_GEOJSON_LIVE_URL,
  CICLABILI_GEOJSON_PATH,
  PEDONALI_DATASET_URL,
  PEDONALI_GEOJSON_LIVE_URL,
  PEDONALI_GEOJSON_PATH,
  REGIONE_TOSCANA_CKAN_API,
  RT_ORARITB_CKAN_ID,
  RT_ORARITB_DATASET_URL,
  TRASPORTI_GTFS_SV_PATH,
} from "@/lib/constants";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type FeatureCollection = {
  type: string;
  features?: unknown[];
};

async function readPublicJson<T>(publicPath: string): Promise<T | null> {
  try {
    const filePath = path.join(process.cwd(), "public", publicPath.replace(/^\//, ""));
    const raw = await readFile(filePath, "utf8");
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

async function fetchGeoJson(
  liveUrl: string,
  fallbackPath: string,
): Promise<{
  geojson: FeatureCollection | null;
  source: "live" | "local" | null;
  feature_count: number;
}> {
  try {
    const res = await fetch(liveUrl, {
      headers: { Accept: "application/geo+json, application/json" },
      next: { revalidate: 86400 },
    });
    if (res.ok) {
      const geojson = (await res.json()) as FeatureCollection;
      const n = Array.isArray(geojson.features) ? geojson.features.length : 0;
      if (n > 0) {
        return { geojson, source: "live", feature_count: n };
      }
    }
  } catch {
    // fallback sotto
  }
  const local = await readPublicJson<FeatureCollection>(fallbackPath);
  const n = Array.isArray(local?.features) ? local!.features.length : 0;
  return {
    geojson: local,
    source: local ? "local" : null,
    feature_count: n,
  };
}

/** Aggrega GTFS San Vincenzo + aree ciclabili/pedonali (open data Toscana). */
export async function GET() {
  try {
    const [gtfs, ciclabili, pedonali, ckan] = await Promise.all([
      readPublicJson<Record<string, unknown>>(TRASPORTI_GTFS_SV_PATH),
      fetchGeoJson(CICLABILI_GEOJSON_LIVE_URL, CICLABILI_GEOJSON_PATH),
      fetchGeoJson(PEDONALI_GEOJSON_LIVE_URL, PEDONALI_GEOJSON_PATH),
      fetch(
        `${REGIONE_TOSCANA_CKAN_API}/package_show?id=${RT_ORARITB_CKAN_ID}`,
        { next: { revalidate: 86400 } },
      )
        .then(async (r) => (r.ok ? ((await r.json()) as { result?: Record<string, unknown> }) : null))
        .catch(() => null),
    ]);

    if (!gtfs) {
      return NextResponse.json(
        { error: "Estratto GTFS locale non disponibile" },
        { status: 503 },
      );
    }

    const bus = (gtfs.bus as Record<string, unknown> | undefined) ?? {};
    const train = (gtfs.train as Record<string, unknown> | undefined) ?? {};
    const busStats = (bus.stats as Record<string, unknown> | undefined) ?? {};
    const trainStats = (train.stats as Record<string, unknown> | undefined) ?? {};

    const resources = Array.isArray(ckan?.result?.resources)
      ? (ckan!.result!.resources as Array<Record<string, unknown>>).map((r) => ({
          name: r.name ?? null,
          format: r.format ?? null,
          url: r.url ?? null,
          size: r.size ?? null,
        }))
      : [];

    return NextResponse.json(
      {
        generated_at: gtfs.generated_at ?? null,
        center: gtfs.center ?? null,
        kpi: {
          fermate_bus: busStats.stops ?? null,
          linee_bus: busStats.routes ?? null,
          stazioni_fs: trainStats.stops ?? null,
          partenze_fs_campione: trainStats.departures_listed ?? null,
          tratti_ciclabili: ciclabili.feature_count,
          aree_pedonali: pedonali.feature_count,
        },
        bus,
        train,
        ciclabili: {
          feature_count: ciclabili.feature_count,
          source: ciclabili.source,
          dataset_url: CICLABILI_DATASET_URL,
          geojson_path: CICLABILI_GEOJSON_PATH,
          geojson: ciclabili.geojson,
        },
        pedonali: {
          feature_count: pedonali.feature_count,
          source: pedonali.source,
          dataset_url: PEDONALI_DATASET_URL,
          geojson_path: PEDONALI_GEOJSON_PATH,
          geojson: pedonali.geojson,
        },
        catalog: {
          dataset_url: RT_ORARITB_DATASET_URL,
          title: (ckan?.result?.title as string | undefined) ?? "Orari trasporto pubblico",
          resources,
          autolinee_gtfs_url: AUTOLINEE_GTFS_URL,
        },
        note:
          "GTFS filtrato entro ~8 km (bus) / stazione S.Vincenzo (treni). Orari campione non filtrati per calendario giornaliero: verificare su Autolinee Toscane / Trenitalia.",
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=600",
        },
      },
    );
  } catch (err) {
    console.error("Trasporti API error", err);
    return NextResponse.json(
      { error: "Impossibile recuperare i dati trasporti" },
      { status: 502 },
    );
  }
}
