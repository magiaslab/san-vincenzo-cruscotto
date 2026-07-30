import { NextResponse } from "next/server";
import { buildAccessibilitaPayload } from "@/lib/accessibilita";

export const dynamic = "force-dynamic";
export const revalidate = 21600;

export async function GET() {
  try {
    const payload = await buildAccessibilitaPayload(6);
    return NextResponse.json(payload, {
      headers: {
        "Cache-Control": "s-maxage=21600, stale-while-revalidate=3600",
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
      { status: 502 },
    );
  }
}
