import { NextResponse } from "next/server";
import { isComuneConfigured } from "@/lib/comune-config";
import { openDataEmpty, openDataOk } from "@/lib/opendata";
import {
  buildRischioData,
  hasRischioPayload,
  RISCHIO_FONTE,
  RISCHIO_REVALIDATE_SECONDS,
  type RischioData,
} from "@/lib/rischio";

/** 30 giorni — Next richiede un letterale numerico. */
export const revalidate = 2592000;

const CACHE_CONTROL = `public, s-maxage=${RISCHIO_REVALIDATE_SECONDS}, stale-while-revalidate=${RISCHIO_REVALIDATE_SECONDS * 2}`;

export type { RischioData };

/**
 * Proxy/cache sottile IdroGEO (PIR + dinamica litoranea).
 * Sempre HTTP 200: sezioni indipendenti; fallimento → empty-state.
 */
export async function GET() {
  if (!isComuneConfigured()) {
    return NextResponse.json(
      openDataEmpty<RischioData>({
        fonte: RISCHIO_FONTE,
        note: "Comune non configurato: nessun fetch IdroGEO.",
      }),
      { status: 200, headers: { "Cache-Control": "public, s-maxage=300" } },
    );
  }
  try {
    const data = await buildRischioData();

    if (!hasRischioPayload(data)) {
      return NextResponse.json(
        openDataEmpty<RischioData>({
          fonte: RISCHIO_FONTE,
          note:
            "Nessun indicatore IdroGEO disponibile al momento per il comune.",
          error: null,
        }),
        { status: 200, headers: { "Cache-Control": CACHE_CONTROL } },
      );
    }

    return NextResponse.json(
      openDataOk(data, {
        fonte: RISCHIO_FONTE,
        edizione: "PIR IdroGEO / dinamica litoranea ISPRA",
      }),
      { status: 200, headers: { "Cache-Control": CACHE_CONTROL } },
    );
  } catch (err) {
    console.error("API /api/rischio error", err);
    return NextResponse.json(
      openDataEmpty<RischioData>({
        fonte: RISCHIO_FONTE,
        error: "Impossibile recuperare i dati di rischio",
      }),
      {
        status: 200,
        headers: {
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
        },
      },
    );
  }
}
