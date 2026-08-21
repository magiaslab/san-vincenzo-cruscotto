import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { DAE_GEOJSON_PATH, OPENAEDMAP_URL } from "@/lib/constants";
import { getComuneBbox, inComuneBbox, isFeatureEnabled } from "@/lib/comune-config";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type RawFeature = {
  type: "Feature";
  geometry?: { type?: string; coordinates?: number[] };
  properties?: Record<string, unknown>;
};

function publicFileFromUrl(urlPath: string): string {
  const rel = urlPath.replace(/^\//, "");
  return path.join(process.cwd(), "public", rel);
}

/**
 * DAE del comune da GeoJSON locale (OpenStreetMap / OpenAEDMap),
 * filtrati sul bbox di `config/comune.json`.
 */
export async function GET() {
  if (!isFeatureEnabled("dae")) {
    return NextResponse.json(
      { type: "FeatureCollection", features: [], meta: { disponibile: false } },
      { status: 200 },
    );
  }

  const bbox = getComuneBbox();
  const filePath = publicFileFromUrl(DAE_GEOJSON_PATH || "/data/dae.geojson");

  try {
    const raw = await readFile(filePath, "utf8");
    const json = JSON.parse(raw) as {
      type?: string;
      features?: RawFeature[];
      meta?: Record<string, unknown>;
    };

    const features = (json.features ?? []).filter((f) => {
      const coords = f.geometry?.coordinates;
      if (
        f.geometry?.type !== "Point" ||
        !Array.isArray(coords) ||
        coords.length < 2 ||
        typeof coords[0] !== "number" ||
        typeof coords[1] !== "number"
      ) {
        return false;
      }
      const [lon, lat] = coords;
      return inComuneBbox(lat, lon);
    });

    return NextResponse.json(
      {
        type: "FeatureCollection",
        features,
        meta: {
          ...(json.meta ?? {}),
          bbox,
          fonte: "OpenStreetMap / OpenAEDMap (file locale; aggiornare con npm run dae:sync)",
          mappa_globale: OPENAEDMAP_URL,
          fetched_at: new Date().toISOString(),
          nota: "Dati volontari OSM: possono essere incompleti rispetto al censimento ufficiale 118.",
        },
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  } catch {
    return NextResponse.json(
      {
        type: "FeatureCollection",
        features: [],
        meta: {
          bbox,
          disponibile: false,
          fonte: "OpenStreetMap / OpenAEDMap",
          mappa_globale: OPENAEDMAP_URL,
          nota: `File ${DAE_GEOJSON_PATH} assente. Esegui \`npm run dae:sync\` per generarlo dal bbox comunale.`,
        },
      },
      {
        status: 200,
        headers: { "Cache-Control": "no-store" },
      },
    );
  }
}
