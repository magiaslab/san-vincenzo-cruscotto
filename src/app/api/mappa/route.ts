import { NextRequest, NextResponse } from "next/server";
import { CIVICI_MAP_LIMIT } from "@/lib/constants";
import { getCachedDashboard } from "@/lib/dashboard";
import { buildMapLayers } from "@/lib/geo";

export const dynamic = "force-dynamic";
export const revalidate = 86400;

export async function GET(req: NextRequest) {
  try {
    const layersParam = req.nextUrl.searchParams.get("layers");
    const limit = Math.min(
      Number(req.nextUrl.searchParams.get("limit") ?? CIVICI_MAP_LIMIT),
      3000,
    );
    const offset = Math.max(Number(req.nextUrl.searchParams.get("offset") ?? 0), 0);

    const dashboard = await getCachedDashboard();
    const allLayers = buildMapLayers(dashboard, {
      civiciLimit: limit,
      civiciOffset: offset,
    });

    const requested = layersParam
      ? layersParam.split(",").map((s) => s.trim()).filter(Boolean)
      : Object.keys(allLayers);

    const layers: Record<string, unknown> = {};
    for (const name of requested) {
      if (name in allLayers) {
        layers[name] = allLayers[name];
      }
    }

    return NextResponse.json(
      {
        type: "FeatureCollectionBundle",
        layers,
        catasto: {
          disponibile: true,
          url: `https://cruscotto-italia.dati.gov.it/data/catasto_full/049018_ple.geojson.gz`,
          nota: "Layer catastale da caricare lato client (gzip GeoJSON, CORS aperto). File potenzialmente pesante.",
        },
      },
      {
        headers: {
          "Cache-Control": "s-maxage=86400, stale-while-revalidate=3600",
        },
      },
    );
  } catch (err) {
    console.error("Mappa error", err);
    return NextResponse.json(
      { error: "Impossibile preparare i layer geografici" },
      { status: 502 },
    );
  }
}
