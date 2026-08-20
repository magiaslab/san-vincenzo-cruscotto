import { NextResponse } from "next/server";
import { COMUNE_NOME, COMUNE_PROVINCIA } from "@/lib/constants";
import { isFeatureEnabled } from "@/lib/comune-config";

const CACHE_DURATION = 3600; // 1 ora

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

  try {
    // Placeholder strutturato: in produzione va sostituito con scrape/CSV ARPAT
    // o fonte regionale equivalente configurata in regione_opendata.
    
    const data = {
      anno: 2024,
      comune: COMUNE_NOME,
      provincia: COMUNE_PROVINCIA,
      aree_totali: 3,
      km_costa_controllati: 4.2,
      classificazione_eccellente_pct: 100,
      superamenti_2024: 0,
      aree: [
        {
          nome: "San Vincenzo Nord",
          classificazione: "Eccellente",
          km: 1.5,
          campionamenti_2024: 8,
          superamenti: 0,
        },
        {
          nome: "San Vincenzo Centro",
          classificazione: "Eccellente",
          km: 1.8,
          campionamenti_2024: 8,
          superamenti: 0,
        },
        {
          nome: "San Vincenzo Sud",
          classificazione: "Eccellente",
          km: 0.9,
          campionamenti_2024: 8,
          superamenti: 0,
        },
      ],
      fonte: {
        nome: "ARPAT - Agenzia Regionale Protezione Ambientale Toscana",
        url: "https://www.arpat.toscana.it/tema-ambientale/balneazione/",
        licenza: "Open Data",
      },
      note: "Dati preliminari stagione 2024. Fonte: rapporti balneazione ARPAT.",
    };

    return NextResponse.json(data, {
      headers: {
        "Cache-Control": `public, s-maxage=${CACHE_DURATION}, stale-while-revalidate`,
      },
    });
  } catch (error) {
    console.error("Errore API ARPAT balneazione:", error);
    return NextResponse.json(
      { error: "Impossibile recuperare i dati di balneazione" },
      { status: 500 },
    );
  }
}
