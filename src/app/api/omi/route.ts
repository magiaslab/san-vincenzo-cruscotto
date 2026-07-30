import { NextResponse } from "next/server";
import { openDataEmpty, openDataOk } from "@/lib/opendata";
import {
  hasOmiPayload,
  loadOmiSnapshot,
  OMI_FONTE,
  OMI_REVALIDATE_SECONDS,
  type OmiData,
} from "@/lib/omi";

/** 30 giorni — Next richiede un letterale numerico. */
export const revalidate = 2592000;

const CACHE_CONTROL = `public, s-maxage=${OMI_REVALIDATE_SECONDS}, stale-while-revalidate=${OMI_REVALIDATE_SECONDS * 2}`;

export type { OmiData };

/**
 * Quotazioni OMI da snapshot locale (`src/data/omi`).
 * Nessun login Agenzia Entrate: mirror ondata filtrato per 049018.
 */
export async function GET() {
  try {
    const data = loadOmiSnapshot();

    if (!data || !hasOmiPayload(data)) {
      return NextResponse.json(
        openDataEmpty<OmiData>({
          fonte: OMI_FONTE,
          note:
            "Snapshot OMI non presente. Esegui `npm run omi:update` (mirror ondata) e riprova.",
          error: null,
        }),
        { status: 200, headers: { "Cache-Control": CACHE_CONTROL } },
      );
    }

    return NextResponse.json(
      openDataOk(data, {
        fonte: OMI_FONTE,
        edizione: data.semestre ?? undefined,
        note:
          "Valori di larga massima (OMI). Fonte: Agenzia Entrate – OMI via mirror ondata.",
      }),
      { status: 200, headers: { "Cache-Control": CACHE_CONTROL } },
    );
  } catch (err) {
    console.error("API /api/omi error", err);
    return NextResponse.json(
      openDataEmpty<OmiData>({
        fonte: OMI_FONTE,
        error: "Impossibile recuperare le quotazioni OMI",
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
