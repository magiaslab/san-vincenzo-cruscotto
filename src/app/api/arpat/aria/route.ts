import { NextResponse } from "next/server";

const CACHE_DURATION = 1800; // 30 minuti per dati aria

export async function GET() {
  try {
    // ARPAT non ha stazione a San Vincenzo
    // La stazione più vicina è Cecina o Livorno
    // Restituiamo un messaggio informativo
    
    const data = {
      disponibile: false,
      messaggio: "Nessuna stazione di rilevamento qualità aria presente nel comune di San Vincenzo",
      stazioni_piu_vicine: [
        {
          nome: "Cecina",
          distanza_km: 12,
          url: "https://www.arpat.toscana.it/temi-ambientali/aria/qualita-aria/dati-stazioni",
        },
        {
          nome: "Livorno - Cappiello",
          distanza_km: 35,
          url: "https://www.arpat.toscana.it/temi-ambientali/aria/qualita-aria/dati-stazioni",
        },
      ],
      note: "Per informazioni sulla qualità dell'aria consultare le stazioni ARPAT più vicine",
      fonte: {
        nome: "ARPAT - Agenzia Regionale Protezione Ambientale Toscana",
        url: "https://www.arpat.toscana.it/open-data/open-data-sulla-qualita-dellaria/",
        api_base: "https://www.arpat.toscana.it/opendata/",
      },
    };

    return NextResponse.json(data, {
      headers: {
        "Cache-Control": `public, s-maxage=${CACHE_DURATION}, stale-while-revalidate`,
      },
    });
  } catch (error) {
    console.error("Errore API ARPAT aria:", error);
    return NextResponse.json(
      { error: "Impossibile recuperare i dati qualità aria" },
      { status: 500 },
    );
  }
}
