import { NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import { ISTAT_CODE } from "@/lib/constants";
import { isFeatureEnabled } from "@/lib/comune-config";
import { openDataEmpty, openDataOk } from "@/lib/opendata";
import {
  buildPercorsiData,
  hasPercorsiPayload,
  PERCORSI_FONTE,
  type PercorsiData,
} from "@/lib/percorsi";

export const revalidate = 21600;

const getCachedPercorsi = unstable_cache(
  async () => buildPercorsiData(),
  ["percorsi-osm-v1", ISTAT_CODE],
  { revalidate: 21600 },
);

export async function GET() {
  if (!isFeatureEnabled("ciclabili_pedonali")) {
    return NextResponse.json(
      openDataEmpty<PercorsiData>({
        fonte: PERCORSI_FONTE,
        note: "Modulo percorsi spento in config/comune.json (features.ciclabili_pedonali).",
      }),
      {
        status: 200,
        headers: { "Cache-Control": "public, s-maxage=300" },
      },
    );
  }

  try {
    let data = await getCachedPercorsi();
    if (!hasPercorsiPayload(data)) {
      data = await buildPercorsiData();
    }
    if (!hasPercorsiPayload(data)) {
      return NextResponse.json(
        openDataEmpty<PercorsiData>({
          fonte: PERCORSI_FONTE,
          note:
            "Nessun percorso OSM (relazioni bicycle/hiking o vie nominate) nel bbox comunale.",
        }),
        {
          status: 200,
          headers: {
            "Cache-Control": "public, s-maxage=60, stale-while-revalidate=30",
          },
        },
      );
    }
    return NextResponse.json(
      openDataOk(data, {
        fonte: PERCORSI_FONTE,
        note:
          "Relazioni OSM type=route (bicycle, mtb, hiking, foot) e piste/sentieri nominati nel bbox. Geometrie ritagliate al territorio. GPX da Overpass.",
      }),
      {
        status: 200,
        headers: {
          "Cache-Control":
            "public, s-maxage=21600, stale-while-revalidate=3600",
        },
      },
    );
  } catch (err) {
    console.error("API /api/percorsi error", err);
    return NextResponse.json(
      openDataEmpty<PercorsiData>({
        fonte: PERCORSI_FONTE,
        error: "Impossibile interrogare OpenStreetMap (Overpass) per i percorsi.",
      }),
      {
        status: 200,
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=30",
        },
      },
    );
  }
}
