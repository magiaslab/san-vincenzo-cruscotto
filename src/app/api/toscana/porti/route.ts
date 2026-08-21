import { NextResponse } from "next/server";
import {
  COMUNE_DI,
  COMUNE_NOME,
  COMUNE_PROVINCIA,
  COMUNE_REGIONE,
  COMUNE_SAN_VINCENZO_URL,
  ISTAT_CODE,
} from "@/lib/constants";
import { isFeatureEnabled, isUpstreamDeploy } from "@/lib/comune-config";

const CACHE_DURATION = 86400;
const WEBCAM_UPSTREAM = "https://lnx.comune.sanvincenzo.li.it/webcam/";

export async function GET() {
  if (!isFeatureEnabled("porto")) {
    return NextResponse.json(
      { disponibile: false, error: "Modulo porto disattivato per questo comune" },
      { status: 404 },
    );
  }

  try {
    const webcamUrl = isUpstreamDeploy() ? WEBCAM_UPSTREAM : COMUNE_SAN_VINCENZO_URL;
    const data = {
      comune: COMUNE_NOME,
      istat: ISTAT_CODE,
      portualita: {
        presente: true,
        tipo: "Porto turistico",
        nome: `Porto di ${COMUNE_NOME}`,
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
      provincia: COMUNE_PROVINCIA,
      regione: COMUNE_REGIONE,
      contatti: {
        comune_url: COMUNE_SAN_VINCENZO_URL,
        webcam_url: webcamUrl,
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
          nome: `${COMUNE_DI} — WebCam`,
          url: webcamUrl,
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
