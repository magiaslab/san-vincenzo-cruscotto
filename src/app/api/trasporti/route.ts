import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import {
  AUTOLINEE_GTFS_URL,
  CICLABILI_DATASET_URL,
  CICLABILI_GEOJSON_LIVE_URL,
  CICLABILI_GEOJSON_PATH,
  ISTAT_CODE,
  MAP_CENTER,
  PEDONALI_DATASET_URL,
  PEDONALI_GEOJSON_LIVE_URL,
  PEDONALI_GEOJSON_PATH,
  REGIONE_TOSCANA_CKAN_API,
  RT_ORARITB_CKAN_ID,
  RT_ORARITB_DATASET_URL,
  STAZIONE_FS_NOME,
  TRASPORTI_GTFS_SV_PATH,
} from "@/lib/constants";
import { COMUNE, isFeatureEnabled } from "@/lib/comune-config";
import { ensureWgs84GeoJson } from "@/lib/geo/reproject";
import { fetchOsmTplStops, haversineKm } from "@/lib/tpl-overpass";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type FeatureCollection = {
  type: string;
  features?: unknown[];
  crs?: unknown;
};

async function readPublicJson<T>(publicPath: string): Promise<T | null> {
  const rel = publicPath.replace(/^\//, "").trim();
  if (!rel) return null;
  try {
    const filePath = path.join(process.cwd(), "public", rel);
    const raw = await readFile(filePath, "utf8");
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function emptyGeo(): {
  geojson: FeatureCollection | null;
  source: "live" | "local" | null;
  feature_count: number;
} {
  return { geojson: null, source: null, feature_count: 0 };
}

async function fetchGeoJson(
  liveUrl: string,
  fallbackPath: string,
): Promise<{
  geojson: FeatureCollection | null;
  source: "live" | "local" | null;
  feature_count: number;
}> {
  if (!liveUrl.trim() && !fallbackPath.trim()) return emptyGeo();

  const local = fallbackPath.trim()
    ? ensureWgs84GeoJson(
        await readPublicJson<FeatureCollection>(fallbackPath),
      )
    : null;
  const localN = Array.isArray(local?.features) ? local!.features.length : 0;

  if (liveUrl.trim()) {
    try {
      const res = await fetch(liveUrl, {
        headers: { Accept: "application/geo+json, application/json" },
        next: { revalidate: 86400 },
      });
      if (res.ok) {
        const raw = (await res.json()) as FeatureCollection;
        const geojson = ensureWgs84GeoJson(raw);
        const n = Array.isArray(geojson?.features) ? geojson!.features.length : 0;
        if (n > 0) {
          return { geojson, source: "live", feature_count: n };
        }
      }
    } catch {
      // fallback locale
    }
  }

  return {
    geojson: local,
    source: local ? "local" : null,
    feature_count: localN,
  };
}

function gtfsBelongsToComune(gtfs: Record<string, unknown> | null): boolean {
  if (!gtfs) return false;
  const istat = String(gtfs.istat_code ?? "")
    .replace(/\D/g, "")
    .padStart(6, "0");
  if (istat && istat !== "000000") return istat === ISTAT_CODE;
  const c = gtfs.center as { lat?: unknown; lon?: unknown } | undefined;
  if (
    c &&
    typeof c.lat === "number" &&
    typeof c.lon === "number" &&
    Number.isFinite(c.lat) &&
    Number.isFinite(c.lon)
  ) {
    const [lat, lon] = MAP_CENTER;
    return haversineKm(lat, lon, c.lat, c.lon) <= 4;
  }
  return true;
}

async function loadOsmFallback(): Promise<{
  bus: Record<string, unknown>;
  train: Record<string, unknown>;
} | null> {
  try {
    const [lat, lon] = MAP_CENTER;
    const radius = Math.max(COMUNE.geo.bbox_radius_km || 8, 1);
    const osm = await fetchOsmTplStops(lat, lon, radius);
    return {
      bus: {
        agency: "OpenStreetMap",
        source: "overpass",
        radius_km: radius,
        stops: osm.bus,
        stats: { stops: osm.bus.length, routes: null },
      },
      train: {
        agency: "OpenStreetMap",
        source: "overpass",
        radius_km: radius,
        stops: osm.train,
        stats: { stops: osm.train.length },
      },
    };
  } catch (err) {
    console.warn("TPL Overpass fallback failed", err);
    return null;
  }
}

/** Aggrega GTFS locale (se del comune) + ciclabili/pedonali. Fallback OSM. */
export async function GET() {
  try {
    const wantCiclabili = isFeatureEnabled("ciclabili_pedonali");
    const [gtfsRaw, ciclabili, pedonali, ckan] = await Promise.all([
      readPublicJson<Record<string, unknown>>(TRASPORTI_GTFS_SV_PATH),
      wantCiclabili
        ? fetchGeoJson(CICLABILI_GEOJSON_LIVE_URL, CICLABILI_GEOJSON_PATH)
        : Promise.resolve(emptyGeo()),
      wantCiclabili
        ? fetchGeoJson(PEDONALI_GEOJSON_LIVE_URL, PEDONALI_GEOJSON_PATH)
        : Promise.resolve(emptyGeo()),
      REGIONE_TOSCANA_CKAN_API && RT_ORARITB_CKAN_ID
        ? fetch(
            `${REGIONE_TOSCANA_CKAN_API}/package_show?id=${RT_ORARITB_CKAN_ID}`,
            { next: { revalidate: 86400 } },
          )
            .then(async (r) =>
              r.ok
                ? ((await r.json()) as { result?: Record<string, unknown> })
                : null,
            )
            .catch(() => null)
        : Promise.resolve(null),
    ]);

    const gtfsOk = gtfsBelongsToComune(gtfsRaw);
    const gtfs = gtfsOk ? gtfsRaw : null;
    const osm = !gtfs ? await loadOsmFallback() : null;

    const bus =
      (gtfs?.bus as Record<string, unknown> | undefined) ??
      osm?.bus ??
      {};
    const train =
      (gtfs?.train as Record<string, unknown> | undefined) ??
      osm?.train ??
      {};
    const busStats = (bus.stats as Record<string, unknown> | undefined) ?? {};
    const trainStats =
      (train.stats as Record<string, unknown> | undefined) ?? {};

    const resources = Array.isArray(ckan?.result?.resources)
      ? (ckan!.result!.resources as Array<Record<string, unknown>>).map(
          (r) => ({
            name: r.name ?? null,
            format: r.format ?? null,
            url: r.url ?? null,
            size: r.size ?? null,
          }),
        )
      : [];

    const fonteTpl = gtfs
      ? "gtfs_locale"
      : osm
        ? "openstreetmap"
        : null;

    return NextResponse.json(
      {
        generated_at: gtfs?.generated_at ?? new Date().toISOString(),
        center: gtfs?.center ?? { lat: MAP_CENTER[0], lon: MAP_CENTER[1] },
        istat_code: ISTAT_CODE,
        fonte_tpl: fonteTpl,
        kpi: {
          fermate_bus: busStats.stops ?? (Array.isArray(bus.stops) ? bus.stops.length : null),
          linee_bus: busStats.routes ?? null,
          stazioni_fs: trainStats.stops ?? (Array.isArray(train.stops) ? train.stops.length : null),
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
          title:
            (ckan?.result?.title as string | undefined) ??
            "Orari trasporto pubblico",
          resources,
          autolinee_gtfs_url: AUTOLINEE_GTFS_URL,
        },
        note: gtfs
          ? `GTFS filtrato entro ~${COMUNE.geo.bbox_radius_km || 8} km (bus) / stazione ${STAZIONE_FS_NOME} (treni). Orari campione non filtrati per calendario giornaliero: verificare su Autolinee Toscane / Trenitalia.`
          : osm
            ? `Fermate da OpenStreetMap entro ~${COMUNE.geo.bbox_radius_km || 8} km dal centro mappa. Per orari TPL: \`npm run trasporti:gtfs\` (filtra il GTFS regionale sul comune).`
            : "Nessun estratto TPL disponibile. Imposta urls.trasporti_gtfs_local e lancia `npm run trasporti:gtfs`, oppure verifica la rete verso Overpass.",
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
