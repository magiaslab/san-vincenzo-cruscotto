import { NextResponse } from "next/server";
import { COMUNE_NOME } from "@/lib/constants";
import { COMUNE, isFeatureEnabled } from "@/lib/comune-config";

const CACHE_DURATION = 1800;

export async function GET() {
  if (!isFeatureEnabled("arpat_aria")) {
    return NextResponse.json(
      {
        disponibile: false,
        messaggio: "Modulo qualità aria regionale spento (features.arpat_aria).",
        stazioni_piu_vicine: [],
      },
      { status: 404 },
    );
  }

  const arpat = COMUNE.regione_opendata.arpat_base_url.trim();
  return NextResponse.json(
    {
      disponibile: false,
      messaggio: `Nessuna stazione hardcoded per ${COMUNE_NOME}. Collega l’open data ARPA della tua Regione.`,
      stazioni_piu_vicine: [],
      fonte: {
        nome: "ARPA regionale",
        url: arpat || "https://www.snpaambiente.it/",
      },
    },
    {
      headers: {
        "Cache-Control": `public, s-maxage=${CACHE_DURATION}, stale-while-revalidate`,
      },
    },
  );
}
