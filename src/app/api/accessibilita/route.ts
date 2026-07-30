import { NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import { buildAccessibilitaPayload } from "@/lib/accessibilita";

/** Cache server 6h: evita di battere Overpass a ogni visita tab. */
export const revalidate = 21600;

const getCachedPayload = unstable_cache(
  async () => buildAccessibilitaPayload(6),
  ["accessibilita-overpass-v2"],
  { revalidate: 21600 },
);

export async function GET() {
  try {
    const payload = await getCachedPayload();
    return NextResponse.json(payload, {
      headers: {
        "Cache-Control": "public, s-maxage=21600, stale-while-revalidate=3600",
      },
    });
  } catch (err) {
    console.error("Accessibilità Overpass error", err);
    return NextResponse.json(
      {
        disponibile: false,
        error: "accessibilita_unavailable",
        message:
          "Impossibile interrogare OpenStreetMap (Overpass) per i punti di accessibilità.",
        disclaimer:
          "Dati OSM/Wheelmap volontari. Verifica sempre sulle fonti ufficiali del Comune.",
        punti: [],
        kpi: {
          n_totale: 0,
          n_wheelchair_yes: 0,
          n_wheelchair_limited: 0,
          n_wheelchair_no: 0,
          n_parking_disabled: 0,
          n_toilet_accessible: 0,
          n_con_nome: 0,
        },
      },
      {
        status: 502,
        headers: {
          "Cache-Control": "public, s-maxage=120, stale-while-revalidate=60",
        },
      },
    );
  }
}
