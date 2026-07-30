/**
 * Tipi dominio OMI (Agenzia delle Entrate) — scheletro riusabile.
 * La route `/api/omi` restituisce `OpenDataResult<OmiData>`.
 */

export type OmiZona = {
  codice: string;
  descrizione: string;
  tipologica: string;
  minEurMq: number | null;
  maxEurMq: number | null;
};

export type OmiData = {
  semestre: string | null;
  zone: OmiZona[];
};

export const OMI_FONTE =
  "Agenzia delle Entrate — Quotazioni immobiliari OMI (open data)";

export const OMI_REVALIDATE_SECONDS = 604800;
