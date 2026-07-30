import { NextResponse } from "next/server";
import { openDataEmpty } from "@/lib/opendata";
import {
  RISCHIO_FONTE,
  RISCHIO_REVALIDATE_SECONDS,
  type RischioData,
} from "@/lib/rischio";

export const revalidate = RISCHIO_REVALIDATE_SECONDS;

const CACHE_CONTROL = `public, s-maxage=${RISCHIO_REVALIDATE_SECONDS}, stale-while-revalidate=${RISCHIO_REVALIDATE_SECONDS * 2}`;

/**
 * Stub IdroGEO: contratto OpenDataResult pronto.
 * Follow-up: fetch ISPRA e popolare `RischioData` (stesso scheletro di turismo).
 */
export async function GET() {
  try {
    return NextResponse.json(
      openDataEmpty<RischioData>({
        fonte: RISCHIO_FONTE,
        note:
          "Integrazione IdroGEO (ISPRA) in arrivo. I KPI rischio già in Territorio restano da Cruscotto Italia.",
        error: null,
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
