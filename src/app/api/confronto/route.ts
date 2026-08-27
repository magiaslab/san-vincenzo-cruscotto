import { NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import { COMUNE } from "@/lib/comune-config";
import { COMUNI_LOOKUP, ISTAT_CODE } from "@/lib/constants";
import { fetchComuneKpiFor } from "@/lib/mcp";
import { jsonOpenData } from "@/lib/open-data-route";
import { openDataEmpty, openDataOk } from "@/lib/opendata";

export const revalidate = 86400;

export type ConfrontoComune = {
  istat: string;
  nome: string;
  popolazione: number | null;
  etaMedia: number | null;
  indiceVecchiaia: number | null;
  rdPct: number | null;
  rifiutiKgAb: number | null;
  redditoMedio: number | null;
  errore: string | null;
};

function rec(v: unknown): Record<string, unknown> | null {
  return v && typeof v === "object" && !Array.isArray(v)
    ? (v as Record<string, unknown>)
    : null;
}

function num(v: unknown): number | null {
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}

function pick(kpi: Record<string, unknown>, istat: string): ConfrontoComune {
  const demo = rec(kpi.demografia);
  const amb = rec(kpi.ambiente);
  const redditi = rec(kpi.redditi_mef);
  return {
    istat,
    nome: COMUNI_LOOKUP[istat] ?? String(rec(kpi.anagrafica)?.denominazione ?? istat),
    popolazione: num(demo?.popolazione),
    etaMedia: num(demo?.eta_media),
    indiceVecchiaia: num(demo?.indice_vecchiaia),
    rdPct: num(amb?.raccolta_differenziata_pct),
    rifiutiKgAb: num(amb?.rifiuti_kg_per_abitante),
    redditoMedio: num(redditi?.reddito_medio) ?? num(redditi?.reddito_imponibile_medio),
    errore: null,
  };
}

async function loadOne(code: string): Promise<ConfrontoComune> {
  const cached = unstable_cache(
    () => fetchComuneKpiFor(code),
    ["confronto-kpi", code],
    { revalidate: 86400 },
  );
  try {
    const kpi = await cached();
    return pick(kpi, code);
  } catch (err) {
    return {
      istat: code,
      nome: COMUNI_LOOKUP[code] ?? code,
      popolazione: null,
      etaMedia: null,
      indiceVecchiaia: null,
      rdPct: null,
      rifiutiKgAb: null,
      redditoMedio: null,
      errore: err instanceof Error ? err.message : "KPI non disponibili",
    };
  }
}

export async function GET() {
  const codes = Array.from(
    new Set([ISTAT_CODE, ...COMUNE.comuni_confronto]),
  );
  if (codes.length <= 1) {
    return jsonOpenData(
      openDataEmpty({
        fonte: "AgID — Cruscotto Italia (comune_kpi)",
        note: "Configura comuni_confronto in config/comune.json.",
      }),
    );
  }
  try {
    const comuni = await Promise.all(codes.map(loadOne));
    return jsonOpenData(
      openDataOk(
        { comuni },
        {
          fonte: "AgID — Cruscotto Italia (comune_kpi)",
          note: "Stessi indicatori AgID, affiancati per codice ISTAT.",
        },
      ),
    );
  } catch (err) {
    return NextResponse.json(
      openDataEmpty({
        fonte: "AgID — Cruscotto Italia (comune_kpi)",
        error: err instanceof Error ? err.message : "Errore confronto",
      }),
      { status: 200 },
    );
  }
}
