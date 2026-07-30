import { NextResponse } from "next/server";
import { openDataEmpty } from "@/lib/opendata";
import { OMI_FONTE, OMI_REVALIDATE_SECONDS, type OmiData } from "@/lib/omi";

export const revalidate = OMI_REVALIDATE_SECONDS;

const CACHE_CONTROL = `public, s-maxage=${OMI_REVALIDATE_SECONDS}, stale-while-revalidate=${OMI_REVALIDATE_SECONDS * 2}`;

/**
 * Stub OMI: contratto OpenDataResult pronto.
 * Follow-up: quotazioni Agenzia Entrate per San Vincenzo.
 */
export async function GET() {
  try {
    return NextResponse.json(
      openDataEmpty<OmiData>({
        fonte: OMI_FONTE,
        note:
          "Integrazione quotazioni OMI in arrivo. Nessun dato immobiliare comunale esposto ancora.",
        error: null,
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
