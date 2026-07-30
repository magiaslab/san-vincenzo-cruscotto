import { NextResponse } from "next/server";
import { getCachedKpi } from "@/lib/dashboard";
import {
  buildTurismoFlussi,
  emptyTurismoPayload,
  TURISMO_REVALIDATE_SECONDS,
  TURISMO_RESIDENTI_FALLBACK,
} from "@/lib/turismo-flussi";

export const revalidate = TURISMO_REVALIDATE_SECONDS;

const CACHE_CONTROL = `public, s-maxage=${TURISMO_REVALIDATE_SECONDS}, stale-while-revalidate=${TURISMO_REVALIDATE_SECONDS * 2}`;

function readResidenti(kpi: Record<string, unknown>): number | null {
  const demo = kpi.demografia;
  if (demo && typeof demo === "object") {
    const pop = (demo as { popolazione?: unknown }).popolazione;
    if (typeof pop === "number" && pop > 0) return pop;
  }
  return null;
}

export async function GET() {
  try {
    let residenti: number | null = TURISMO_RESIDENTI_FALLBACK;
    try {
      const kpi = (await getCachedKpi()) as Record<string, unknown>;
      residenti = readResidenti(kpi) ?? TURISMO_RESIDENTI_FALLBACK;
    } catch (err) {
      console.warn("Turismo: KPI residenti non disponibili, uso fallback", err);
    }

    const payload = await buildTurismoFlussi(residenti);
    return NextResponse.json(payload, {
      status: 200,
      headers: { "Cache-Control": CACHE_CONTROL },
    });
  } catch (err) {
    console.error("API /api/turismo error", err);
    return NextResponse.json(
      emptyTurismoPayload({
        error: "Impossibile recuperare i flussi turistici",
        residenti: TURISMO_RESIDENTI_FALLBACK,
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
