/**
 * Tipi dominio rischio idrogeologico (ISPRA IdroGEO) — scheletro riusabile.
 * La route `/api/rischio` restituisce `OpenDataResult<RischioData>`.
 */

export type RischioData = {
  alluvioni: {
    popP3: number | null;
    popP2: number | null;
    popP1: number | null;
    areaP3Kmq: number | null;
    areaP2Kmq: number | null;
    areaP1Kmq: number | null;
  } | null;
  frane: {
    areaP3P4Kmq: number | null;
    areaP3P4Pct: number | null;
    popP3P4: number | null;
    popP3P4Pct: number | null;
    edificiP3P4: number | null;
  } | null;
};

export const RISCHIO_FONTE =
  "ISPRA — IdroGEO / mosaico nazionale rischio idrogeologico (open data)";

export const RISCHIO_REVALIDATE_SECONDS = 604800;
