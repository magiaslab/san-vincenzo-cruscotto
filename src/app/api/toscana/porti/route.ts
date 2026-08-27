import { NextResponse } from "next/server";
import {
  COMUNE_DI,
  COMUNE_NOME,
  COMUNE_PROVINCIA,
  COMUNE_REGIONE,
  COMUNE_SITO_URL,
  ISTAT_CODE,
  MAP_CENTER,
} from "@/lib/constants";
import { COMUNE, isFeatureEnabled } from "@/lib/comune-config";

const CACHE_DURATION = 86400;

export async function GET() {
  if (!isFeatureEnabled("porto")) {
    return NextResponse.json(
      { disponibile: false, error: "Modulo porto disattivato per questo comune" },
      { status: 404 },
    );
  }

  const webcamUrl = COMUNE.porto.webcam_page || COMUNE_SITO_URL;
  const data = {
    comune: COMUNE_NOME,
    istat: ISTAT_CODE,
    portualita: {
      presente: true,
      tipo: "Porto / approdo",
      nome: `Porto di ${COMUNE_NOME}`,
      posti_barca: null,
      descrizione: `Approdo di ${COMUNE_NOME}. Dati strutturali: configura fonti regionali nel fork (niente valori copiati da un altro comune).`,
      lat: MAP_CENTER[0],
      lon: MAP_CENTER[1],
    },
    ormeggio: {
      posti_barca: null,
      max_lunghezza_m: null,
      fondali_m: null,
      note: "Compila i dati portuali nel fork o lascia il modulo spento.",
    },
    servizi: [] as string[],
    classificazione: null,
    provincia: COMUNE_PROVINCIA,
    regione: COMUNE_REGIONE,
    contatti: {
      comune_url: COMUNE_SITO_URL,
      webcam_url: webcamUrl,
    },
    fonti: [
      {
        nome: `${COMUNE_DI}`,
        url: COMUNE_SITO_URL || webcamUrl,
      },
      {
        nome: "VesselFinder (traffico AIS embed)",
        url: "https://www.vesselfinder.com/",
      },
    ],
    note: "Modulo porto generico: niente capienza o webcam di un altro comune.",
  };

  return NextResponse.json(data, {
    headers: {
      "Cache-Control": `public, s-maxage=${CACHE_DURATION}, stale-while-revalidate`,
    },
  });
}
