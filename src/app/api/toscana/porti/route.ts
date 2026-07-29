import { NextResponse } from "next/server";

const CACHE_DURATION = 86400;

export async function GET() {
  try {
    const data = {
      comune: "San Vincenzo",
      istat: "049018",
      portualita: {
        presente: true,
        tipo: "Porto turistico",
        nome: "Porto di San Vincenzo",
        posti_barca: 140,
        descrizione:
          "Porto turistico / approdo comunale sulla Costa degli Etruschi, con servizi per la nautica da diporto.",
        lat: 43.0915,
        lon: 10.5385,
      },
      ormeggio: {
        posti_barca: 140,
        max_lunghezza_m: null,
        fondali_m: null,
        note: "Dettaglio tecnico fondali/lunghezza massima: verificare con la gestione portuale locale.",
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
      regione: "Toscana",
      contatti: {
        comune_url: "https://www.comune.san-vincenzo.li.it/",
        webcam_url: "https://lnx.comune.sanvincenzo.li.it/webcam/",
      },
      contesto_regionale: {
        totale_posti_barca: 12641,
        porti_turistici: 8579,
        punti_ormeggio: 17550,
        approdi: 28,
      },
      fonti: [
        {
          nome: "Regione Toscana - Porti e Nautica",
          url: "https://www502.regione.toscana.it/geonetwork/",
          dataset: "RT 113 - Porti / Masterplan portualità turistica",
        },
        {
          nome: "Comune di San Vincenzo — WebCam",
          url: "https://lnx.comune.sanvincenzo.li.it/webcam/",
        },
        {
          nome: "VesselFinder (traffico AIS embed)",
          url: "https://www.vesselfinder.com/",
        },
      ],
      note: "Sezione aggregata: dati strutturali portuali, webcam ufficiali e mappa AIS embed. L'API VesselFinder a pagamento non è utilizzata.",
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
