import { NextResponse } from "next/server";
import { isComuneConfigured, isFeatureEnabled } from "@/lib/comune-config";
import { getCachedKpi } from "@/lib/dashboard";
import { openDataEmpty, openDataOk } from "@/lib/opendata";
import {
  buildTurismoFlussi,
  emptyTurismoPayload,
  TURISMO_FONTE,
  TURISMO_REVALIDATE_SECONDS,
  TURISMO_RESIDENTI_FALLBACK,
  type TurismoData,
} from "@/lib/turismo-flussi";

export const revalidate = 604800;

const CACHE_CONTROL = `public, s-maxage=${TURISMO_REVALIDATE_SECONDS}, stale-while-revalidate=${TURISMO_REVALIDATE_SECONDS * 2}`;

export type { TurismoData };

function readResidenti(kpi: Record<string, unknown>): number | null {
  const demo = kpi.demografia;
  if (demo && typeof demo === "object") {
    const pop = (demo as { popolazione?: unknown }).popolazione;
    if (typeof pop === "number" && pop > 0) return pop;
  }
  return null;
}

function toData(
  p: ReturnType<typeof emptyTurismoPayload>,
): TurismoData {
  return {
    anno: p.anno,
    annoPrecedente: p.annoPrecedente,
    mensile: p.mensile,
    annuale: p.annuale,
    provenienza: p.provenienza,
    residenti: p.residenti,
    permanenzaMedia: p.permanenzaMedia,
    pressioneTuristica: p.pressioneTuristica,
    deltaPresenzePct: p.deltaPresenzePct,
    dataset: p.dataset ?? null,
  };
}

export async function GET() {
  if (!isFeatureEnabled("turismo_flussi") || !isComuneConfigured()) {
    return NextResponse.json(
      openDataEmpty<TurismoData>({
        fonte: TURISMO_FONTE,
        note: "Modulo flussi turistici spento o comune non configurato.",
      }),
      { status: 200, headers: { "Cache-Control": CACHE_CONTROL } },
    );
  }

  try {
    let residenti: number | null = TURISMO_RESIDENTI_FALLBACK;
    try {
      const kpi = (await getCachedKpi()) as Record<string, unknown>;
      residenti = readResidenti(kpi) ?? TURISMO_RESIDENTI_FALLBACK;
    } catch (err) {
      console.warn("Turismo: KPI residenti non disponibili, uso fallback", err);
    }

    const payload = await buildTurismoFlussi(residenti);
    const data = toData(payload);
    const edizione = payload.anno != null ? String(payload.anno) : undefined;

    if (!payload.disponibile) {
      return NextResponse.json(
        openDataEmpty<TurismoData>({
          fonte: payload.fonte || TURISMO_FONTE,
          aggiornato: payload.aggiornato,
          edizione,
          note: payload.note,
          error: payload.error,
        }),
        { status: 200, headers: { "Cache-Control": CACHE_CONTROL } },
      );
    }

    return NextResponse.json(
      openDataOk(data, {
        fonte: payload.fonte || TURISMO_FONTE,
        aggiornato: payload.aggiornato,
        edizione,
        note: payload.note,
      }),
      { status: 200, headers: { "Cache-Control": CACHE_CONTROL } },
    );
  } catch (err) {
    console.error("API /api/turismo error", err);
    return NextResponse.json(
      openDataEmpty<TurismoData>({
        fonte: TURISMO_FONTE,
        error: "Impossibile recuperare i flussi turistici",
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
