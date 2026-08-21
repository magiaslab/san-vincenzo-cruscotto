/**
 * Tipi e helper dominio OMI (Agenzia Entrate – Osservatorio Mercato Immobiliare).
 * Snapshot locale: `src/data/omi/{ISTAT}.json` (nessun login Fisconline).
 * La route `/api/omi` restituisce `OpenDataResult<OmiData>`.
 *
 * Nota: nessun import `node:fs` — il modulo è condiviso col client (`OmiPanel`).
 */

import { ISTAT_CODE } from "@/lib/constants";
import snapshot049018 from "@/data/omi/049018.json";

export const OMI_ISTAT_CODE = ISTAT_CODE;

/** Mirror open data (CSV ripubblicati, senza autenticazione). */
export const OMI_MIRROR_REPO =
  "https://raw.githubusercontent.com/ondata/quotazioni-immobiliari-agenzia-entrate/master/data";

export const OMI_FONTE =
  "Agenzia Entrate – OMI (Osservatorio Mercato Immobiliare)";

/** Dato semestrale: cache 30 giorni. */
export const OMI_REVALIDATE_SECONDS = 2592000;

export const OMI_ABITAZIONI_CIVILI = "Abitazioni civili";

export type OmiTipologia = {
  tipologia: string;
  statoConservativo: string;
  mercatoMinMq: number | null;
  mercatoMaxMq: number | null;
  affittoMinMqMese: number | null;
  affittoMaxMqMese: number | null;
  codTip?: string;
};

export type OmiZona = {
  codice: string;
  descrizione: string;
  tipologie: OmiTipologia[];
};

export type OmiStoricoPunto = {
  semestre: string;
  abitazioniCivili: { minMq: number; maxMq: number };
};

export type OmiData = {
  semestre: string | null;
  zone: OmiZona[];
  storico?: OmiStoricoPunto[];
};

export type OmiSnapshotFile = {
  semestre: string;
  comuneIstat?: string;
  zone: OmiZona[];
  storico?: OmiStoricoPunto[];
  fonte?: string;
  mirror?: string;
  sourceFile?: string;
  nota?: string;
};

function asNum(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const n = Number(value.replace(",", "."));
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function normalizeTipologia(raw: Record<string, unknown>): OmiTipologia | null {
  const tipologia =
    typeof raw.tipologia === "string"
      ? raw.tipologia
      : typeof raw.Descr_Tipologia === "string"
        ? raw.Descr_Tipologia
        : "";
  if (!tipologia) return null;
  return {
    tipologia,
    statoConservativo:
      typeof raw.statoConservativo === "string"
        ? raw.statoConservativo
        : typeof raw.Stato === "string"
          ? raw.Stato
          : "",
    mercatoMinMq: asNum(raw.mercatoMinMq ?? raw.Compr_min),
    mercatoMaxMq: asNum(raw.mercatoMaxMq ?? raw.Compr_max),
    affittoMinMqMese: asNum(raw.affittoMinMqMese ?? raw.Loc_min),
    affittoMaxMqMese: asNum(raw.affittoMaxMqMese ?? raw.Loc_max),
    codTip:
      typeof raw.codTip === "string"
        ? raw.codTip
        : typeof raw.Cod_Tip === "string"
          ? raw.Cod_Tip
          : undefined,
  };
}

function normalizeZona(raw: Record<string, unknown>): OmiZona | null {
  const codice =
    typeof raw.codice === "string"
      ? raw.codice
      : typeof raw.Zona === "string"
        ? raw.Zona
        : "";
  if (!codice) return null;
  const tipsRaw = Array.isArray(raw.tipologie) ? raw.tipologie : [];
  const tipologie = tipsRaw
    .map((t) =>
      t && typeof t === "object"
        ? normalizeTipologia(t as Record<string, unknown>)
        : null,
    )
    .filter((t): t is OmiTipologia => t != null);
  return {
    codice,
    descrizione:
      typeof raw.descrizione === "string"
        ? raw.descrizione
        : typeof raw.Zona_Descr === "string"
          ? raw.Zona_Descr
          : codice,
    tipologie,
  };
}

export function normalizeSnapshot(raw: unknown): OmiSnapshotFile | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as Record<string, unknown>;
  const semestre = typeof row.semestre === "string" ? row.semestre : null;
  if (!semestre) return null;
  const zonesRaw = Array.isArray(row.zone) ? row.zone : [];
  const zone = zonesRaw
    .map((z) =>
      z && typeof z === "object"
        ? normalizeZona(z as Record<string, unknown>)
        : null,
    )
    .filter((z): z is OmiZona => z != null);
  if (zone.length === 0) return null;

  let storico: OmiStoricoPunto[] | undefined;
  if (Array.isArray(row.storico)) {
    storico = row.storico
      .map((p) => {
        if (!p || typeof p !== "object") return null;
        const r = p as Record<string, unknown>;
        const sem = typeof r.semestre === "string" ? r.semestre : null;
        const ab =
          r.abitazioniCivili && typeof r.abitazioniCivili === "object"
            ? (r.abitazioniCivili as Record<string, unknown>)
            : null;
        const minMq = asNum(ab?.minMq);
        const maxMq = asNum(ab?.maxMq);
        if (!sem || minMq == null || maxMq == null) return null;
        return { semestre: sem, abitazioniCivili: { minMq, maxMq } };
      })
      .filter((p): p is OmiStoricoPunto => p != null);
  }

  return {
    semestre,
    comuneIstat:
      typeof row.comuneIstat === "string" ? row.comuneIstat : undefined,
    zone,
    storico,
    fonte: typeof row.fonte === "string" ? row.fonte : undefined,
    mirror: typeof row.mirror === "string" ? row.mirror : undefined,
    sourceFile: typeof row.sourceFile === "string" ? row.sourceFile : undefined,
    nota: typeof row.nota === "string" ? row.nota : undefined,
  };
}

/** Media (min+max)/2 di una tipologia, o null. */
export function midRange(
  min: number | null | undefined,
  max: number | null | undefined,
): number | null {
  if (min == null || max == null) return null;
  if (!Number.isFinite(min) || !Number.isFinite(max)) return null;
  return (min + max) / 2;
}

export function findAbitazioniCivili(zona: OmiZona): OmiTipologia | null {
  const exact = zona.tipologie.find(
    (t) => t.tipologia.toLowerCase() === OMI_ABITAZIONI_CIVILI.toLowerCase(),
  );
  if (exact) return exact;
  return (
    zona.tipologie.find((t) =>
      t.tipologia.toLowerCase().includes("abitazioni civili"),
    ) ?? null
  );
}

/** Zona principale: B1 se presente, altrimenti prima fascia B con abitazioni civili. */
export function pickZonaPrincipale(zone: OmiZona[]): OmiZona | null {
  if (zone.length === 0) return null;
  const withCivili = zone.filter((z) => findAbitazioniCivili(z));
  if (withCivili.length === 0) return zone[0] ?? null;
  const b1 = withCivili.find((z) => z.codice.toUpperCase() === "B1");
  if (b1) return b1;
  const b = withCivili.find((z) => z.codice.toUpperCase().startsWith("B"));
  return b ?? withCivili[0] ?? null;
}

export function buildStoricoFromSnapshots(
  snaps: OmiSnapshotFile[],
): OmiStoricoPunto[] {
  const out: OmiStoricoPunto[] = [];
  for (const snap of snaps) {
    const mins: number[] = [];
    const maxs: number[] = [];
    for (const z of snap.zone) {
      const ac = findAbitazioniCivili(z);
      if (!ac) continue;
      if (ac.mercatoMinMq != null) mins.push(ac.mercatoMinMq);
      if (ac.mercatoMaxMq != null) maxs.push(ac.mercatoMaxMq);
    }
    if (mins.length === 0 || maxs.length === 0) continue;
    out.push({
      semestre: snap.semestre,
      abitazioniCivili: { minMq: Math.min(...mins), maxMq: Math.max(...maxs) },
    });
  }
  return out.sort((a, b) => a.semestre.localeCompare(b.semestre));
}

/** True se il campo Comune_ISTAT del CSV/snapshot coincide col codice ISTAT configurato. */
export function matchesOmiComuneIstat(
  cell: string | null | undefined,
  istat: string = ISTAT_CODE,
): boolean {
  const digits = (cell ?? "").replace(/\D/g, "");
  const target = istat.replace(/\D/g, "").padStart(6, "0");
  if (!digits || target.length < 6) return false;
  const short = target.replace(/^0+/, "");
  return digits === target || digits.endsWith(target) || (Boolean(short) && digits.endsWith(short));
}

/**
 * Snapshot bundlato solo se appartiene al comune configurato.
 * Nei fork senza file `src/data/omi/{ISTAT}.json` la route prova il mirror ondata.
 */
export function loadOmiSnapshot(): OmiData | null {
  const bundled = normalizeSnapshot(snapshot049018);
  if (!bundled) return null;
  if (!matchesOmiComuneIstat(bundled.comuneIstat ?? "049018")) return null;
  return {
    semestre: bundled.semestre,
    zone: bundled.zone,
    storico: bundled.storico,
  };
}

/** @deprecated alias — preferire `loadOmiSnapshot`. */
export function loadOmiFromDisk(): OmiData | null {
  return loadOmiSnapshot();
}

export function hasOmiPayload(data: OmiData): boolean {
  return Boolean(data.semestre && data.zone.length > 0);
}
