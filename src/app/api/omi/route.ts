import { NextResponse } from "next/server";
import { ISTAT_CODE } from "@/lib/constants";
import { openDataEmpty, openDataOk } from "@/lib/opendata";
import { hasOmiPayload, OMI_FONTE, OMI_REVALIDATE_SECONDS, type OmiData } from "@/lib/omi";
import { loadOmiForConfiguredComune } from "@/lib/omi-server";

/** 30 giorni — Next richiede un letterale numerico. */
export const revalidate = 2592000;

const CACHE_CONTROL = `public, s-maxage=${OMI_REVALIDATE_SECONDS}, stale-while-revalidate=${OMI_REVALIDATE_SECONDS * 2}`;

export type { OmiData };

/**
 * Quotazioni OMI da snapshot `src/data/omi/{ISTAT}.json` o mirror ondata.
 * Nessun login Agenzia Entrate.
 */
export async function GET() {
  try {
    const data = await loadOmiForConfiguredComune();

    if (!data || !hasOmiPayload(data)) {
      return NextResponse.json(
        openDataEmpty<OmiData>({
          fonte: OMI_FONTE,
          note:
            `Snapshot OMI non presente per ISTAT ${ISTAT_CODE}. Esegui \`npm run omi:update\` (mirror ondata) e riprova.`,
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
