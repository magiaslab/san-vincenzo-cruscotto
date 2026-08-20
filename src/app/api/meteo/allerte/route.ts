import { NextResponse } from "next/server";
import {
  ALLERTA_METEO_APP_URL,
  ALLERTA_METEO_SV_API_URL,
  CFR_TOSCANA_URL,
  DPC_CRITICITA_REPO_URL,
  REGIONE_TOSCANA_ALLERTA_URL,
} from "@/lib/constants";
import {
  dettaglioLabel,
  fetchAllerteToscanaE2,
  labelColore,
  maxColore,
  rankColore,
  type AllertaColore,
  type ToscanaDayAlert,
  type ToscanaRischio,
} from "@/lib/allerte-toscana";

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

type MergedDettagli = {
  idraulico: string | null;
  temporali: string | null;
  idrogeologico: string | null;
  vento: string | null;
  mareggiate: string | null;
  neve: string | null;
  ghiaccio: string | null;
};

function emptyDettagli(): MergedDettagli {
  return {
    idraulico: null,
    temporali: null,
    idrogeologico: null,
    vento: null,
    mareggiate: null,
    neve: null,
    ghiaccio: null,
  };
}

function normalizeDpcDay(day: DayAlert | undefined) {
  const colore = String(day?.allerta?.colore ?? "verde").toLowerCase();
  const livello = Number(day?.allerta?.livello ?? 1);
  return {
    colore,
    descrizione: day?.allerta?.descrizione ?? "n.d.",
    livello: Number.isFinite(livello) ? livello : 1,
    attiva: colore !== "verde" && livello > 1,
    dettagli: {
      ...emptyDettagli(),
      idraulico: day?.dettagli?.idraulico ?? null,
      temporali: day?.dettagli?.temporali ?? null,
      idrogeologico: day?.dettagli?.idrogeologico ?? null,
    } satisfies MergedDettagli,
  };
}

function mergeDay(
  dpc: ReturnType<typeof normalizeDpcDay>,
  toscana: ToscanaDayAlert | null,
) {
  if (!toscana) {
    return {
      ...dpc,
      fonte: "dpc" as const,
      rischi_attivi: [] as ToscanaRischio[],
    };
  }

  const top = maxColore(dpc.colore, toscana.colore) as AllertaColore;
  const dettagli: MergedDettagli = { ...dpc.dettagli };

  (Object.keys(toscana.dettagli) as ToscanaRischio[]).forEach((rischio) => {
    const col = toscana.dettagli[rischio];
    const label = dettaglioLabel(col);
    // Preferisci il dettaglio regionale (più aggiornato / rischi extra)
    dettagli[rischio] = label;
  });

  return {
    colore: top,
    descrizione: labelColore(top),
    livello: rankColore(top),
    attiva: top !== "verde",
    dettagli,
    fonte:
      rankColore(toscana.colore) >= rankColore(dpc.colore)
        ? ("toscana" as const)
        : ("dpc" as const),
    rischi_attivi: toscana.rischi_attivi,
  };
}

/** Allerte meteo per San Vincenzo: DPC nazionale + bollettino Regione Toscana (zona E2). */
export async function GET() {
  try {
    const [dpcSettled, toscanaSettled] = await Promise.allSettled([
      fetch(ALLERTA_METEO_SV_API_URL, {
        headers: { Accept: "application/json" },
        next: { revalidate: 900 },
      }).then(async (res) => {
        if (!res.ok) throw new Error(`allertameteo.app HTTP ${res.status}`);
        const raw = (await res.json()) as Upstream;
        if (!raw?.success || !raw.data) {
          throw new Error("Risposta allerte DPC non valida");
        }
        return raw;
      }),
      fetchAllerteToscanaE2(),
    ]);

    const dpcRaw =
      dpcSettled.status === "fulfilled" ? dpcSettled.value : null;
    const toscana =
      toscanaSettled.status === "fulfilled" ? toscanaSettled.value : null;

    if (dpcSettled.status === "rejected") {
      console.error("Allerte DPC error", dpcSettled.reason);
    }
    if (toscanaSettled.status === "rejected") {
      console.error("Allerte Toscana error", toscanaSettled.reason);
    }

    if (!dpcRaw && !toscana) {
      throw new Error("Nessuna fonte allerte disponibile");
    }

    const dpcOggi = normalizeDpcDay(dpcRaw?.data?.oggi);
    const dpcDomani = normalizeDpcDay(dpcRaw?.data?.domani);
    const oggi = mergeDay(dpcOggi, toscana?.oggi ?? null);
    const domani = mergeDay(dpcDomani, toscana?.domani ?? null);
    const info = dpcRaw?.data?.bulletin_info ?? {};

    const homeColors = new Set(["giallo", "arancione", "rosso"]);
    const show_home_banner =
      (oggi.attiva && homeColors.has(oggi.colore)) ||
      (domani.attiva && homeColors.has(domani.colore));

    return NextResponse.json(
      {
        comune: dpcRaw?.data?.comune ?? "San Vincenzo",
        zona: dpcRaw?.data?.zona ?? toscana?.zona_label ?? "Etruria-Costa Nord",
        zona_codice: toscana?.zona ?? "E2",
        provincia: dpcRaw?.data?.provincia ?? "Livorno",
        regione: dpcRaw?.data?.regione ?? "Toscana",
        sigla: dpcRaw?.data?.sigla ?? "LI",
        oggi,
        domani,
        bollettino: {
          data: info.data_bollettino ?? toscana?.oggi.data ?? null,
          ora: info.ora_bollettino ?? null,
          label_oggi: info.label_oggi ?? (toscana ? `Oggi ${toscana.oggi.data}` : null),
          label_domani:
            info.label_domani ??
            (toscana ? `Domani ${toscana.domani.data}` : null),
          link_pdf: info.link_pdf ?? null,
        },
        toscana: toscana
          ? {
              oggi: toscana.oggi,
              domani: toscana.domani,
              fonte: toscana.fonte,
            }
          : null,
        riguarda_san_vincenzo: true,
        has_alert: oggi.attiva || domani.attiva,
        show_home_banner,
        fonti: [
          {
            nome: "CFR Toscana / Allerta Meteo Regione (mappe SIR zona E2)",
            url: REGIONE_TOSCANA_ALLERTA_URL,
          },
          {
            nome: "allertameteo.app (API comune / DPC)",
            url: ALLERTA_METEO_APP_URL,
          },
          {
            nome: "DPC — Bollettini di criticità (GitHub)",
            url: DPC_CRITICITA_REPO_URL,
          },
          {
            nome: "Centro Funzionale Regionale Toscana",
            url: CFR_TOSCANA_URL,
          },
        ],
        note:
          "Allerte aggregate da Protezione Civile nazionale e bollettino Regione Toscana (zona E2), inclusi vento, mareggiate, neve e ghiaccio.",
        _generated_at: new Date().toISOString(),
        _sources: {
          dpc: dpcRaw != null,
          toscana: toscana != null,
        },
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
      { error: "Impossibile recuperare le allerte meteo" },
      { status: 502 },
    );
  }
}
