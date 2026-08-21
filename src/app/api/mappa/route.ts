import { NextRequest, NextResponse } from "next/server";
import { CATASTO_GEOJSON_URL, CIVICI_MAP_LIMIT, ISTAT_CODE } from "@/lib/constants";
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
        istat_code: ISTAT_CODE,
        catasto: {
          disponibile: true,
          url: CATASTO_GEOJSON_URL,
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
