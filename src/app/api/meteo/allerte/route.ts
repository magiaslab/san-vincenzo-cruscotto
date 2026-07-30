import { NextResponse } from "next/server";
import {
  ALLERTA_METEO_APP_URL,
  ALLERTA_METEO_SV_API_URL,
  CFR_TOSCANA_URL,
  DPC_CRITICITA_REPO_URL,
  REGIONE_TOSCANA_ALLERTA_URL,
} from "@/lib/constants";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type DayAlert = {
  allerta?: {
    colore?: string;
    descrizione?: string;
    livello?: number;
  };
  dettagli?: {
    idraulico?: string;
    temporali?: string;
    idrogeologico?: string;
  };
};

type Upstream = {
  success?: boolean;
  data?: {
    comune?: string;
    zona?: string;
    provincia?: string;
    regione?: string;
    sigla?: string;
    oggi?: DayAlert;
    domani?: DayAlert;
    bulletin_info?: {
      data_bollettino?: string;
      ora_bollettino?: string;
      label_oggi?: string;
      label_domani?: string;
      link_pdf?: string;
    };
  };
};

function normalizeDay(day: DayAlert | undefined) {
  const colore = String(day?.allerta?.colore ?? "verde").toLowerCase();
  const livello = Number(day?.allerta?.livello ?? 1);
  return {
    colore,
    descrizione: day?.allerta?.descrizione ?? "n.d.",
    livello: Number.isFinite(livello) ? livello : 1,
    attiva: colore !== "verde" && livello > 1,
    dettagli: {
      idraulico: day?.dettagli?.idraulico ?? null,
      temporali: day?.dettagli?.temporali ?? null,
      idrogeologico: day?.dettagli?.idrogeologico ?? null,
    },
  };
}

/** Allerte meteo-idro Protezione Civile per San Vincenzo (zona Etruria-Costa Nord). */
export async function GET() {
  try {
    const res = await fetch(ALLERTA_METEO_SV_API_URL, {
      headers: { Accept: "application/json" },
      next: { revalidate: 900 },
    });
    if (!res.ok) {
      throw new Error(`allertameteo.app HTTP ${res.status}`);
    }
    const raw = (await res.json()) as Upstream;
    if (!raw?.success || !raw.data) {
      throw new Error("Risposta allerte non valida");
    }

    const oggi = normalizeDay(raw.data.oggi);
    const domani = normalizeDay(raw.data.domani);
    const info = raw.data.bulletin_info ?? {};

    return NextResponse.json(
      {
        comune: raw.data.comune ?? "San Vincenzo",
        zona: raw.data.zona ?? "Etruria-Costa Nord",
        provincia: raw.data.provincia ?? "Livorno",
        regione: raw.data.regione ?? "Toscana",
        sigla: raw.data.sigla ?? "LI",
        oggi,
        domani,
        bollettino: {
          data: info.data_bollettino ?? null,
          ora: info.ora_bollettino ?? null,
          label_oggi: info.label_oggi ?? null,
          label_domani: info.label_domani ?? null,
          link_pdf: info.link_pdf ?? null,
        },
        riguarda_san_vincenzo: true,
        has_alert: oggi.attiva || domani.attiva,
        fonti: [
          {
            nome: "allertameteo.app (API comune)",
            url: ALLERTA_METEO_APP_URL,
          },
          {
            nome: "DPC — Bollettini di criticità (GitHub)",
            url: DPC_CRITICITA_REPO_URL,
          },
          {
            nome: "CFR Toscana / Allerta Meteo Regione",
            url: REGIONE_TOSCANA_ALLERTA_URL,
          },
          {
            nome: "Centro Funzionale Regionale Toscana",
            url: CFR_TOSCANA_URL,
          },
        ],
        note:
          "Dati nazionali Protezione Civile per la zona di allerta del comune. Per vento, mareggiate, neve e ghiaccio consultare anche il CFR Toscana.",
        _generated_at: new Date().toISOString(),
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=900, stale-while-revalidate=300",
        },
      },
    );
  } catch (err) {
    console.error("Allerte meteo error", err);
    return NextResponse.json(
      { error: "Impossibile recuperare le allerte Protezione Civile" },
      { status: 502 },
    );
  }
}
