import { NextResponse } from "next/server";
import { COMUNE_NOME, COMUNE_PROVINCIA } from "@/lib/constants";
import { isFeatureEnabled, isUpstreamDeploy } from "@/lib/comune-config";

const CACHE_DURATION = 3600; // 1 ora

const AREE_UPSTREAM = [
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
];

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
    // I nomi delle aree sono specifici del deploy ufficiale; nei fork non
    // riusiamo etichette di un altro comune.
    const upstream = isUpstreamDeploy();
    const aree = upstream ? AREE_UPSTREAM : [];

    const data = {
      anno: 2024,
      comune: COMUNE_NOME,
      provincia: COMUNE_PROVINCIA,
      aree_totali: aree.length,
      km_costa_controllati: upstream ? 4.2 : 0,
      classificazione_eccellente_pct: upstream ? 100 : null,
      superamenti_2024: upstream ? 0 : null,
      aree,
      fonte: {
        nome: "ARPAT - Agenzia Regionale Protezione Ambientale Toscana",
        url: "https://www.arpat.toscana.it/tema-ambientale/balneazione/",
        licenza: "Open Data",
      },
      note: upstream
        ? "Dati preliminari stagione 2024. Fonte: rapporti balneazione ARPAT."
        : `Placeholder ARPAT non disponibile per ${COMUNE_NOME}: configura una fonte regionale.`,
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
