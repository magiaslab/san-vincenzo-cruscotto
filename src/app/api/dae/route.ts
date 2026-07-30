import { NextResponse } from "next/server";
import {
  DAE_BBOX,
  GITHUB_REPO_URL,
  OPENAEDMAP_URL,
  OVERPASS_API_URL,
} from "@/lib/constants";

export const dynamic = "force-dynamic";
export const revalidate = 3600;

type OverpassElement = {
  type: "node" | "way" | "relation";
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
};

function pickLabel(tags: Record<string, string>): string {
  return (
    tags.name ||
    tags["defibrillator:location"] ||
    tags["defibrillator:location:it"] ||
    tags.description ||
    tags["addr:street"] ||
    "DAE"
  );
}

/**
 * DAE pubblici georeferenziati su OpenStreetMap
 * (tag emergency=defibrillator) nel bbox di San Vincenzo.
 */
export async function GET() {
  const { south, west, north, east } = DAE_BBOX;
  const query = `[out:json][timeout:25];
(
  node["emergency"="defibrillator"](${south},${west},${north},${east});
  way["emergency"="defibrillator"](${south},${west},${north},${east});
  relation["emergency"="defibrillator"](${south},${west},${north},${east});
);
out center tags;`;

  try {
    const res = await fetch(OVERPASS_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
        Accept: "application/json",
        "User-Agent": `CruscottoSanVincenzo/1.0 (+${GITHUB_REPO_URL})`,
      },
      body: `data=${encodeURIComponent(query)}`,
      next: { revalidate: 3600 },
    });

    if (!res.ok) {
      throw new Error(`Overpass HTTP ${res.status}`);
    }

    const json = (await res.json()) as { elements?: OverpassElement[] };
    const features = (json.elements ?? [])
      .map((el) => {
        const lat = el.lat ?? el.center?.lat;
        const lon = el.lon ?? el.center?.lon;
        if (typeof lat !== "number" || typeof lon !== "number") return null;
        const tags = el.tags ?? {};
        return {
          type: "Feature" as const,
          geometry: {
            type: "Point" as const,
            coordinates: [lon, lat],
          },
          properties: {
            osm_type: el.type,
            osm_id: el.id,
            nome: pickLabel(tags),
            ubicazione:
              tags["defibrillator:location"] ||
              tags["defibrillator:location:it"] ||
              tags.description ||
              "",
            accesso: tags.access || tags.indoor || "",
            orari: tags.opening_hours || "",
            operatore: tags.operator || "",
            telefono: tags.phone || tags["emergency:phone"] || "",
            indoor: tags.indoor === "yes",
            osm_url: `https://www.openstreetmap.org/${el.type}/${el.id}`,
          },
        };
      })
      .filter((f): f is NonNullable<typeof f> => f != null);

    return NextResponse.json(
      {
        type: "FeatureCollection",
        features,
        meta: {
          fonte: "OpenStreetMap",
          tag: "emergency=defibrillator",
          mappa_globale: OPENAEDMAP_URL,
          fetched_at: new Date().toISOString(),
          nota: "Dati volontari OSM: possono essere incompleti rispetto al censimento ufficiale 118.",
        },
      },
      {
        headers: {
          "Cache-Control": "s-maxage=3600, stale-while-revalidate=1800",
        },
      },
    );
  } catch (err) {
    console.error("DAE Overpass error", err);
    return NextResponse.json(
      { error: "Impossibile caricare i DAE da OpenStreetMap" },
      { status: 502 },
    );
  }
}
