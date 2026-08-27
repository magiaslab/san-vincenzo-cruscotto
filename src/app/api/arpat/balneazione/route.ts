import { NextResponse } from "next/server";
import { COMUNE_NOME, COMUNE_PROVINCIA, HTTP_USER_AGENT } from "@/lib/constants";
import { COMUNE, isFeatureEnabled } from "@/lib/comune-config";

const CACHE_DURATION = 3600;

export async function GET() {
  if (!isFeatureEnabled("balneazione")) {
    return NextResponse.json(
      {
        disponibile: false,
        aree: [],
        error: "Modulo balneazione disattivato per questo comune",
      },
      { status: 404 },
    );
  }

  const arpat = COMUNE.regione_opendata.arpat_base_url.trim();
  return NextResponse.json(
    {
      anno: null,
      comune: COMUNE_NOME,
      provincia: COMUNE_PROVINCIA,
      aree_totali: 0,
      km_costa_controllati: 0,
      classificazione_eccellente_pct: null,
      superamenti_2024: null,
      aree: [],
      fonte: {
        nome: arpat ? "ARPA regionale" : "Qualità acque di bagno",
        url: arpat
          ? `${arpat.replace(/\/$/, "")}/tema-ambientale/balneazione/`
          : "https://www.salute.gov.it/",
        licenza: "Open Data",
      },
      note: `Nessun elenco spiagge hardcoded. Collega la fonte della tua Regione in regione_opendata (User-Agent: ${HTTP_USER_AGENT.slice(0, 40)}…).`,
    },
    {
      headers: {
        "Cache-Control": `public, s-maxage=${CACHE_DURATION}, stale-while-revalidate`,
      },
    },
  );
}
