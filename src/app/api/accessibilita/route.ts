import { NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import { buildAccessibilitaPayload } from "@/lib/accessibilita";
import type { AccessibilitaPayload } from "@/lib/accessibilita";

/** ISR lungo solo quando ci sono punti; le risposte vuote non vanno “congelate”. */
export const revalidate = 21600;

const getCachedPayload = unstable_cache(
  async () => buildAccessibilitaPayload(6),
  ["accessibilita-overpass-v4"],
  { revalidate: 21600 },
);

function cacheControl(payload: AccessibilitaPayload): string {
  if (payload.kpi.n_totale > 0) {
    return "public, s-maxage=21600, stale-while-revalidate=3600";
  }
  return "public, s-maxage=60, stale-while-revalidate=30";
}

export async function GET() {
  try {
    let payload = await getCachedPayload();
    // Se la cache ha memorizzato uno snapshot vuoto (Overpass flaky), riprova a caldo
    if (payload.kpi.n_totale === 0) {
      payload = await buildAccessibilitaPayload(6);
    }
    return NextResponse.json(payload, {
      headers: { "Cache-Control": cacheControl(payload) },
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
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=30",
        },
      },
    );
  }
}
