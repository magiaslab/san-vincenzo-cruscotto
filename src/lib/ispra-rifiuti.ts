/**
 * Catasto nazionale rifiuti urbani ISPRA — CSV comunale filtrato per ISTAT.
 * https://www.catasto-rifiuti.isprambiente.it/index.php?pg=downloadComune
 */
import { COMUNE } from "@/lib/comune-config";
import { HTTP_USER_AGENT, ISTAT_CODE } from "@/lib/constants";

export const ISPRA_RIFIUTI_FONTE =
  "ISPRA — Catasto nazionale rifiuti urbani";
export const ISPRA_RIFIUTI_URL =
  "https://www.catasto-rifiuti.isprambiente.it/index.php?pg=downloadComune";
export const ISPRA_CSV_BASE =
  "https://www.catasto-rifiuti.isprambiente.it/get/getDettaglioComunale.csv.php";

export const ARRR_DATI_COMUNALI_URL = "https://www.arrr.it/dati-comunali";

const SERIES_YEARS = 8;
const FETCH_MS = 25_000;

export type FrazioniRifiuti = {
  umida_t: number | null;
  verde_t: number | null;
  carta_t: number | null;
  vetro_t: number | null;
  legno_t: number | null;
  metallo_t: number | null;
  plastica_t: number | null;
  raee_t: number | null;
  tessili_t: number | null;
  selettiva_t: number | null;
  costruzione_demolizione_t: number | null;
  pulizia_stradale_t: number | null;
  ingombranti_recupero_t: number | null;
  altro_rd_t: number | null;
  ingombranti_smaltimento_t: number | null;
  indifferenziato_t: number | null;
};

export type RifiutiAnno = {
  anno: number;
  popolazione: number | null;
  rd_pct: number | null;
  ru_t: number | null;
  rd_t: number | null;
  kg_ab: number | null;
  frazioni: FrazioniRifiuti;
};

export type SeiRdAnno = {
  anno: number;
  rd_pct: number;
  certificato: boolean;
  nota: string;
};

export type RifiutiData = {
  istat: string;
  comune: string;
  ultimo: RifiutiAnno;
  serie: Array<Pick<RifiutiAnno, "anno" | "rd_pct" | "kg_ab" | "ru_t" | "rd_t">>;
  sei: {
    gestore: string;
    url: string;
    calendario_url: string;
    centri_url: string;
    centro_url: string;
    serie: SeiRdAnno[];
  } | null;
};

function parseItNumber(raw: string | undefined): number | null {
  if (!raw) return null;
  const t = raw.trim().replace(/%/g, "").replace(/\s/g, "");
  if (!t || t === "-" || t === "n.d." || t === "n.d" || t === "nd") return null;
  const normalized = t.includes(",")
    ? t.replace(/\./g, "").replace(",", ".")
    : t.replace(/[^\d.+-]/g, "");
  const n = Number(normalized);
  return Number.isFinite(n) ? n : null;
}

function splitCsvLine(line: string): string[] {
  return line.split(";").map((c) => c.trim());
}

function istatMatches(cell: string, istat: string): boolean {
  const compact = cell.replace(/\D/g, "");
  const want = istat.replace(/\D/g, "");
  if (!compact || !want) return false;
  return compact === want || compact.endsWith(want);
}

function parseFrazioni(cols: string[]): FrazioniRifiuti {
  return {
    umida_t: parseItNumber(cols[6]),
    verde_t: parseItNumber(cols[7]),
    carta_t: parseItNumber(cols[8]),
    vetro_t: parseItNumber(cols[9]),
    legno_t: parseItNumber(cols[10]),
    metallo_t: parseItNumber(cols[11]),
    plastica_t: parseItNumber(cols[12]),
    raee_t: parseItNumber(cols[13]),
    tessili_t: parseItNumber(cols[14]),
    selettiva_t: parseItNumber(cols[15]),
    costruzione_demolizione_t: parseItNumber(cols[16]),
    pulizia_stradale_t: parseItNumber(cols[17]),
    ingombranti_recupero_t: parseItNumber(cols[18]),
    altro_rd_t: parseItNumber(cols[19]),
    ingombranti_smaltimento_t: parseItNumber(cols[21]),
    indifferenziato_t: parseItNumber(cols[22]),
  };
}

function rowToAnno(anno: number, cols: string[]): RifiutiAnno | null {
  if (cols.length < 25) return null;
  const popolazione = parseItNumber(cols[4]);
  const rd_t = parseItNumber(cols[20]);
  const ru_t = parseItNumber(cols[23]);
  const rd_pct = parseItNumber(cols[24]);
  const kg_ab =
    ru_t != null && popolazione && popolazione > 0
      ? (ru_t * 1000) / popolazione
      : null;
  if (rd_pct == null && ru_t == null) return null;
  return {
    anno,
    popolazione,
    rd_pct,
    ru_t,
    rd_t,
    kg_ab,
    frazioni: parseFrazioni(cols),
  };
}

async function fetchCsv(anno: number): Promise<string | null> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), FETCH_MS);
  try {
    const res = await fetch(`${ISPRA_CSV_BASE}?aa=${anno}`, {
      headers: {
        Accept: "text/csv,text/plain,*/*",
        "User-Agent": HTTP_USER_AGENT,
      },
      signal: ctrl.signal,
      next: { revalidate: 86400 },
    });
    if (!res.ok) return null;
    const text = await res.text();
    if (text.length < 200) return null;
    return text;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

function findComuneRow(csv: string, istat: string): string[] | null {
  const lines = csv.split(/\r?\n/);
  for (const line of lines) {
    if (!line.includes(";")) continue;
    const cols = splitCsvLine(line);
    if (istatMatches(cols[0] ?? "", istat)) return cols;
  }
  return null;
}

export async function fetchIspraAnno(
  anno: number,
  istat = ISTAT_CODE,
): Promise<RifiutiAnno | null> {
  const csv = await fetchCsv(anno);
  if (!csv) return null;
  const cols = findComuneRow(csv, istat);
  if (!cols) return null;
  return rowToAnno(anno, cols);
}

export async function buildIspraSerie(
  istat = ISTAT_CODE,
): Promise<RifiutiAnno[]> {
  const now = new Date().getFullYear();
  const years: number[] = [];
  for (let y = now; y >= now - SERIES_YEARS - 1; y--) years.push(y);
  const rows = await Promise.all(years.map((y) => fetchIspraAnno(y, istat)));
  return rows.filter((r): r is RifiutiAnno => r != null).sort((a, b) => a.anno - b.anno);
}

function decodeHtml(s: string): string {
  return s
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Percentuali RD pubblicate sulla pagina comunale del gestore (es. SEI). */
export function parseSeiRdHtml(html: string): SeiRdAnno[] {
  const blocks = html.matchAll(
    /<div[^>]*class=["'][^"']*perc_raccolta[^"']*["'][^>]*>([\s\S]*?)<\/div>/gi,
  );
  const out: SeiRdAnno[] = [];
  for (const m of blocks) {
    const block = m[1] ?? "";
    const anno = Number((block.match(/<h3[^>]*>\s*(\d{4})\s*<\/h3>/i) ?? [])[1]);
    const pctRaw =
      (block.match(/perc-value[^>]*>[\s\S]*?([\d.,]+)\s*<span[^>]*perc-sign/i) ??
        [])[1] ?? "";
    const rd_pct = parseItNumber(pctRaw);
    if (!Number.isFinite(anno) || rd_pct == null) continue;
    const label = decodeHtml(
      (block.match(/<span[^>]*class=["'][^"']*label[^"']*["'][^>]*>([\s\S]*?)<\/span>/i) ??
        [])[1] ?? "",
    );
    const certificato = /certificat/i.test(label) && !/non\s+certificat|provvisor/i.test(label);
    out.push({ anno, rd_pct, certificato, nota: label });
  }
  out.sort((a, b) => a.anno - b.anno);
  return out;
}

export async function fetchSeiRdSerie(url: string): Promise<SeiRdAnno[]> {
  if (!url) return [];
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), FETCH_MS);
  try {
    const res = await fetch(url, {
      headers: {
        Accept: "text/html,application/xhtml+xml;q=0.9,*/*;q=0.8",
        "User-Agent": HTTP_USER_AGENT,
      },
      signal: ctrl.signal,
      next: { revalidate: 3600 },
    });
    if (!res.ok) return [];
    const html = await res.text();
    return parseSeiRdHtml(html);
  } catch {
    return [];
  } finally {
    clearTimeout(timer);
  }
}

export async function buildRifiutiData(): Promise<RifiutiData | null> {
  const serieFull = await buildIspraSerie();
  const ultimo = serieFull.at(-1);
  if (!ultimo) return null;

  const g = COMUNE.gestori.rifiuti;
  let sei: RifiutiData["sei"] = null;
  if (g.nome || g.url) {
    const seiSerie = g.url ? await fetchSeiRdSerie(g.url) : [];
    sei = {
      gestore: g.nome,
      url: g.url,
      calendario_url: g.calendario_url,
      centri_url: g.centri_url,
      centro_url: g.centro_url,
      serie: seiSerie,
    };
  }

  return {
    istat: ISTAT_CODE,
    comune: COMUNE.nome,
    ultimo,
    serie: serieFull.map((r) => ({
      anno: r.anno,
      rd_pct: r.rd_pct,
      kg_ab: r.kg_ab,
      ru_t: r.ru_t,
      rd_t: r.rd_t,
    })),
    sei,
  };
}
