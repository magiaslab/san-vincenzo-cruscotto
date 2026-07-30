import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { OPENAEDMAP_URL } from "@/lib/constants";

export const dynamic = "force-static";
export const revalidate = 86400;

type RawFeature = {
  type: "Feature";
  geometry?: { type?: string; coordinates?: number[] };
  properties?: Record<string, unknown>;
};

/**
 * DAE del comune da export GeoJSON locale (OpenStreetMap / OpenAEDMap),
 * filtrato sul territorio di San Vincenzo.
 */
export async function GET() {
  try {
    const filePath = path.join(
      process.cwd(),
      "public",
      "data",
      "dae-san-vincenzo.geojson",
    );
    const raw = await readFile(filePath, "utf8");
    const json = JSON.parse(raw) as {
      type?: string;
      features?: RawFeature[];
      meta?: Record<string, unknown>;
    };

    const features = (json.features ?? []).filter((f) => {
      const coords = f.geometry?.coordinates;
      return (
        f.geometry?.type === "Point" &&
        Array.isArray(coords) &&
        coords.length >= 2 &&
        typeof coords[0] === "number" &&
        typeof coords[1] === "number"
      );
    });

    return NextResponse.json(
      {
        type: "FeatureCollection",
        features,
        meta: {
          ...(json.meta ?? {}),
          fonte: "OpenStreetMap / OpenAEDMap (file locale)",
          mappa_globale: OPENAEDMAP_URL,
          fetched_at: new Date().toISOString(),
          nota: "Dati volontari OSM: possono essere incompleti rispetto al censimento ufficiale 118.",
        },
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=3600",
        },
      },
    );
  } catch (err) {
    console.error("DAE geojson error", err);
    return NextResponse.json(
      { error: "Impossibile caricare i DAE dal file locale" },
      { status: 500 },
    );
  }
}
