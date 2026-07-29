import { NextResponse } from "next/server";

const CACHE_DURATION = 86400; // 24 ore

export async function GET() {
  try {
    // Dati porti Regione Toscana
    // San Vincenzo ha un porto turistico/approdo
    
    const data = {
      comune: "San Vincenzo",
      portualita: {
        presente: true,
        tipo: "Porto turistico",
        posti_barca: 140,
        descrizione: "Porto turistico con servizi per la nautica da diporto",
      },
      statistiche_toscana: {
        totale_posti_barca: 12641,
        porti_turistici: 8579,
        punti_ormeggio: 17550,
        approdi: 28,
      },
      servizi: [
        "Ormeggio",
        "Carburante",
        "Acqua",
        "Elettricità",
        "Servizi igienici",
        "Parcheggio",
      ],
      classificazione: "Approdo turistico comunale",
      provincia: "Livorno",
      fonte: {
        nome: "Regione Toscana - Porti e Nautica",
        url: "https://www502.regione.toscana.it/geonetwork/",
        dataset: "RT 113 - Porti",
        licenza: "Open Data",
      },
      note: "Dati estratti dal Masterplan portualità turistica Regione Toscana",
    };

    return NextResponse.json(data, {
      headers: {
        "Cache-Control": `public, s-maxage=${CACHE_DURATION}, stale-while-revalidate`,
      },
    });
  } catch (error) {
    console.error("Errore API porti:", error);
    return NextResponse.json(
      { error: "Impossibile recuperare i dati porti" },
      { status: 500 },
    );
  }
}
