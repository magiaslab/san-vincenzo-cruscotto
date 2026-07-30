/**
 * Tipi e fetch dominio rischio territoriale (ISPRA IdroGEO).
 * La route `/api/rischio` restituisce `OpenDataResult<RischioData>`.
 *
 * Fonte primaria: API PIR `GET /pir/comuni/{id}` (OpenAPI IdroGEO).
 * Erosione costiera: WFS GeoServer `dinamica_litoranea` (layer IdroGEO).
 */

import { ISTAT_CODE } from "@/lib/constants";

export const IDROGEO_API_BASE = "https://idrogeo.isprambiente.it/api" as const;
export const IDROGEO_WFS_URL =
  "https://idrogeo.isprambiente.it/geoserver/idrogeo/wfs" as const;
export const IDROGEO_WFS_LAYER = "idrogeo:dinamica_litoranea" as const;

/** Codice ISTAT a 6 cifre (es. 049018). */
export const RISCHIO_ISTAT_CODE = ISTAT_CODE;

export const RISCHIO_FONTE =
  "ISPRA — Piattaforma IdroGEO / Rapporto Dissesto idrogeologico in Italia (CC BY)";

/** Dato ~triennale/annuale: cache 30 giorni. */
export const RISCHIO_REVALIDATE_SECONDS = 2592000;

const USER_AGENT =
  "Mozilla/5.0 (compatible; CruscottoSanVincenzo/1.0; +https://github.com/magiaslab/san-vincenzo-cruscotto)";

const FETCH_TIMEOUT_MS = 25_000;

export type RischioEsposti = {
  popolazione: number | null;
  famiglie: number | null;
  edifici: number | null;
  imprese: number | null;
  beniCulturali: number | null;
};

export type RischioFraneClassi = {
  P1: number | null;
  P2: number | null;
  P3: number | null;
  P4: number | null;
};

export type RischioFrane = {
  /** Superficie per classe di pericolosità (km²). */
  classi: RischioFraneClassi;
  /** % territorio P3+P4 (elevata + molto elevata). */
  pctP3P4: number | null;
  espostiRischioElevato: RischioEsposti;
};

export type RischioAlluvioneScenario = {
  popolazione: number | null;
  edifici: number | null;
};

export type RischioAlluvioni = {
  /** HPH / HPM / HPL (tempi di ritorno). */
  scenari: {
    elevata: RischioAlluvioneScenario;
    media: RischioAlluvioneScenario;
    bassa: RischioAlluvioneScenario;
  };
};

export type RischioErosioneCostiera = {
  kmErosione: number | null;
  kmAvanzamento: number | null;
  kmStabile?: number | null;
};

export type RischioConfrontoLivello = {
  nome: string | null;
  pctFraneP3P4: number | null;
  popFraneP3P4: number | null;
  popAlluvioneMedia: number | null;
};

export type RischioData = {
  frane: RischioFrane | null;
  alluvioni: RischioAlluvioni | null;
  erosioneCostiera: RischioErosioneCostiera | null;
  confronto?: {
    provincia?: RischioConfrontoLivello | null;
    regione?: RischioConfrontoLivello | null;
    italia?: RischioConfrontoLivello | null;
  } | null;
};

function asNum(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const n = Number(value.replace(",", "."));
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function pickNum(
  row: Record<string, unknown>,
  ...keys: string[]
): number | null {
  for (const key of keys) {
    const n = asNum(row[key]);
    if (n != null) return n;
  }
  return null;
}

async function fetchJson(
  url: string,
  init?: RequestInit,
): Promise<unknown | null> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      ...init,
      signal: ctrl.signal,
      headers: {
        Accept: "application/json",
        "User-Agent": USER_AGENT,
        ...(init?.headers ?? {}),
      },
      next: { revalidate: RISCHIO_REVALIDATE_SECONDS },
    });
    if (!res.ok) return null;
    return (await res.json()) as unknown;
  } catch (err) {
    console.warn("rischio fetch failed", url, err);
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/** Codifica WFS IdroGEO: `cod_reg` + `pro_com` (es. 9 + 49018 → 9049018). */
export function buildWfsCodIstat(
  codReg: number | null,
  proCom: number | null,
  istatCode = RISCHIO_ISTAT_CODE,
): number | null {
  const pro =
    proCom ??
    (() => {
      const n = Number(istatCode);
      return Number.isFinite(n) ? n : null;
    })();
  const reg = codReg ?? 9;
  if (pro == null) return null;
  const combined = Number(`${reg}${pro}`);
  return Number.isFinite(combined) ? combined : null;
}

function mapFrane(row: Record<string, unknown>): RischioFrane | null {
  const classi: RischioFraneClassi = {
    P1: pickNum(row, "ar_fr_p1", "arFrP1"),
    P2: pickNum(row, "ar_fr_p2", "arFrP2"),
    P3: pickNum(row, "ar_fr_p3", "arFrP3"),
    P4: pickNum(row, "ar_fr_p4", "arFrP4"),
  };
  const hasClassi = Object.values(classi).some((v) => v != null);
  const esposti: RischioEsposti = {
    popolazione: pickNum(row, "popfr_p3p4", "pop_fr_p3p4", "popFrP3P4"),
    famiglie: pickNum(row, "famfr_p3p4", "fam_fr_p3p4"),
    edifici: pickNum(row, "ed_fr_p3p4", "edfr_p3p4"),
    imprese: pickNum(row, "imfr_p3p4", "im_fr_p3p4"),
    beniCulturali: pickNum(row, "bbccfrp3p4", "bbcc_fr_p3p4"),
  };
  const hasEsposti = Object.values(esposti).some((v) => v != null);
  if (!hasClassi && !hasEsposti) return null;
  return {
    classi,
    pctP3P4: pickNum(row, "ar_frp3p4p", "ar_fr_p3p4_p", "aridp3p4_p"),
    espostiRischioElevato: esposti,
  };
}

function mapAlluvioni(row: Record<string, unknown>): RischioAlluvioni | null {
  const elevata: RischioAlluvioneScenario = {
    popolazione: pickNum(row, "pop_idr_p3", "popidp3"),
    edifici: pickNum(row, "ed_idr_p3", "edidp3"),
  };
  const media: RischioAlluvioneScenario = {
    popolazione: pickNum(row, "pop_idr_p2", "popidp2"),
    edifici: pickNum(row, "ed_idr_p2", "edidp2"),
  };
  const bassa: RischioAlluvioneScenario = {
    popolazione: pickNum(row, "pop_idr_p1", "popidp1"),
    edifici: pickNum(row, "ed_idr_p1", "edidp1"),
  };
  const has =
    Object.values(elevata).some((v) => v != null) ||
    Object.values(media).some((v) => v != null) ||
    Object.values(bassa).some((v) => v != null);
  if (!has) return null;
  return { scenari: { elevata, media, bassa } };
}

function mapConfronto(
  row: Record<string, unknown> | null,
): RischioConfrontoLivello | null {
  if (!row) return null;
  const nome = typeof row.nome === "string" ? row.nome : null;
  const pctFraneP3P4 = pickNum(row, "ar_frp3p4p");
  const popFraneP3P4 = pickNum(row, "popfr_p3p4");
  const popAlluvioneMedia = pickNum(row, "pop_idr_p2");
  if (
    !nome &&
    pctFraneP3P4 == null &&
    popFraneP3P4 == null &&
    popAlluvioneMedia == null
  ) {
    return null;
  }
  return { nome, pctFraneP3P4, popFraneP3P4, popAlluvioneMedia };
}

function classifyCosta(label: string): "erosione" | "avanzamento" | "stabile" | null {
  const s = label.trim().toLowerCase();
  if (!s) return null;
  if (s.includes("eros")) return "erosione";
  if (s.includes("avanc")) return "avanzamento";
  if (s.includes("stabil") || s.includes("stabili")) return "stabile";
  return null;
}

function featureLengthM(props: Record<string, unknown>): number {
  const shape = asNum(props.shape_leng);
  if (shape != null && shape > 0) return shape;
  const st = asNum(props["st_length("]);
  if (st != null && st > 0) return st;
  return 0;
}

export async function fetchPirComune(
  istatCode = RISCHIO_ISTAT_CODE,
): Promise<Record<string, unknown> | null> {
  const id = istatCode.replace(/^0+/, "") || istatCode;
  const raw = await fetchJson(`${IDROGEO_API_BASE}/pir/comuni/${istatCode}`);
  const row = asRecord(raw);
  if (row) return row;
  if (id !== istatCode) {
    return asRecord(await fetchJson(`${IDROGEO_API_BASE}/pir/comuni/${id}`));
  }
  return null;
}

async function fetchPirByPath(
  path: string,
): Promise<Record<string, unknown> | null> {
  return asRecord(await fetchJson(`${IDROGEO_API_BASE}${path}`));
}

export async function fetchErosioneCostiera(
  wfsCodIstat: number,
): Promise<RischioErosioneCostiera | null> {
  const params = new URLSearchParams({
    service: "WFS",
    version: "2.0.0",
    request: "GetFeature",
    typeName: IDROGEO_WFS_LAYER,
    outputFormat: "application/json",
    CQL_FILTER: `cod_istat=${wfsCodIstat}`,
  });
  const raw = await fetchJson(`${IDROGEO_WFS_URL}?${params.toString()}`);
  const fc = asRecord(raw);
  const features = Array.isArray(fc?.features) ? fc.features : [];
  if (features.length === 0) return null;

  let kmErosione = 0;
  let kmAvanzamento = 0;
  let kmStabile = 0;
  let matched = 0;

  for (const feat of features) {
    const props = asRecord(asRecord(feat)?.properties);
    if (!props) continue;
    const label = String(
      props.modifica_2 ?? props.modifica_o ?? props.descrizion ?? "",
    );
    const kind = classifyCosta(label);
    if (!kind) continue;
    const km = featureLengthM(props) / 1000;
    if (km <= 0) continue;
    matched += 1;
    if (kind === "erosione") kmErosione += km;
    else if (kind === "avanzamento") kmAvanzamento += km;
    else kmStabile += km;
  }

  if (matched === 0) return null;
  return {
    kmErosione: round3(kmErosione),
    kmAvanzamento: round3(kmAvanzamento),
    kmStabile: round3(kmStabile),
  };
}

function round3(n: number): number {
  return Math.round(n * 1000) / 1000;
}

export function hasRischioPayload(data: RischioData): boolean {
  return Boolean(data.frane || data.alluvioni || data.erosioneCostiera);
}

/**
 * Costruisce il payload rischio per il comune target.
 * Sezioni indipendenti: un fallimento non azzera le altre.
 */
export async function buildRischioData(
  istatCode = RISCHIO_ISTAT_CODE,
): Promise<RischioData> {
  const comune = await fetchPirComune(istatCode);

  let frane: RischioFrane | null = null;
  let alluvioni: RischioAlluvioni | null = null;
  let confronto: RischioData["confronto"] = null;
  let erosioneCostiera: RischioErosioneCostiera | null = null;

  if (comune) {
    frane = mapFrane(comune);
    alluvioni = mapAlluvioni(comune);

    const codReg = pickNum(comune, "cod_reg");
    const proCom = pickNum(comune, "pro_com");
    // cod_prov in PIR comune è la provincia (es. 49 → /pir/province/49)
    const provId = pickNum(comune, "cod_prov");

    const [provincia, regione, italia] = await Promise.all([
      provId != null ? fetchPirByPath(`/pir/province/${provId}`) : Promise.resolve(null),
      codReg != null ? fetchPirByPath(`/pir/regioni/${codReg}`) : Promise.resolve(null),
      fetchPirByPath("/pir/italia"),
    ]);

    const cProv = mapConfronto(provincia);
    const cReg = mapConfronto(regione);
    const cIta = mapConfronto(italia);
    if (cProv || cReg || cIta) {
      confronto = {
        provincia: cProv,
        regione: cReg,
        italia: cIta,
      };
    }

    const wfsCode = buildWfsCodIstat(codReg, proCom, istatCode);
    if (wfsCode != null) {
      try {
        erosioneCostiera = await fetchErosioneCostiera(wfsCode);
      } catch (err) {
        console.warn("rischio erosione costiera fallita", err);
      }
    }
  } else {
    // Fallback: prova solo WFS con formula standard Toscana
    const wfsCode = buildWfsCodIstat(9, Number(istatCode), istatCode);
    if (wfsCode != null) {
      try {
        erosioneCostiera = await fetchErosioneCostiera(wfsCode);
      } catch (err) {
        console.warn("rischio erosione costiera fallback fallita", err);
      }
    }
  }

  return { frane, alluvioni, erosioneCostiera, confronto };
}
