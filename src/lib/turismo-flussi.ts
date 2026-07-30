/**
 * Flussi turistici comunali (arrivi/presenze) — Regione Toscana / ISTAT.
 * Scheletro riusabile per altre fonti open data (proxy + parse + empty-safe).
 */
import { inflateRawSync } from "zlib";
import {
  COMUNE_NOME,
  ISTAT_CODE,
  REGIONE_TOSCANA_CKAN_API,
  TURISMO_CSV_FALLBACK_URL as TURISMO_CSV_FALLBACK_URL_CONST,
} from "@/lib/constants";

export const TURISMO_REVALIDATE_SECONDS = 604800; // 7 giorni

/** URL CSV/ODS opzionale più recente (vuoto di default). */
export const TURISMO_CSV_FALLBACK_URL = TURISMO_CSV_FALLBACK_URL_CONST;

export const TURISMO_FONTE =
  "Regione Toscana — Movimento dei clienti negli esercizi ricettivi (dati ISTAT), dati.toscana.it — CC BY";

export const TURISMO_RESIDENTI_FALLBACK = 6342;

export type TurismoMese = {
  mese: number;
  presenze: number;
  arrivi: number;
  presenzePrec: number;
  arriviPrec: number;
};

export type TurismoAnnuale = {
  anno: number;
  arrivi: number;
  presenze: number;
};

export type TurismoProvenienza = {
  italiani: number;
  stranieri: number;
};

export type TurismoFlussiPayload = {
  disponibile: boolean;
  anno: number | null;
  annoPrecedente: number | null;
  mensile: TurismoMese[];
  annuale: TurismoAnnuale[];
  provenienza: TurismoProvenienza;
  residenti: number | null;
  permanenzaMedia: number | null;
  pressioneTuristica: number | null;
  deltaPresenzePct: number | null;
  fonte: string;
  aggiornato: string;
  dataset?: string | null;
  note?: string | null;
  error?: string | null;
};

export function emptyTurismoPayload(
  extra?: Partial<TurismoFlussiPayload>,
): TurismoFlussiPayload {
  return {
    disponibile: false,
    anno: null,
    annoPrecedente: null,
    mensile: [],
    annuale: [],
    provenienza: { italiani: 0, stranieri: 0 },
    residenti: null,
    permanenzaMedia: null,
    pressioneTuristica: null,
    deltaPresenzePct: null,
    fonte: TURISMO_FONTE,
    aggiornato: new Date().toISOString(),
    dataset: null,
    note: null,
    error: null,
    ...extra,
  };
}

const UA = "Cruscotto-San-Vincenzo/1.0 (+https://github.com/magiaslab/san-vincenzo-cruscotto)";

type CkanResource = {
  id?: string;
  name?: string;
  description?: string;
  format?: string;
  url?: string;
  datastore_active?: boolean;
};

type CkanPackage = {
  name: string;
  title?: string;
  notes?: string;
  resources?: CkanResource[];
  metadata_modified?: string;
};

function yearFromText(...parts: Array<string | undefined>): number | null {
  const blob = parts.filter(Boolean).join(" ");
  const years = [...blob.matchAll(/20\d{2}/g)].map((m) => Number(m[0]));
  return years.length ? Math.max(...years) : null;
}

function normHeader(h: string): string {
  return h
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");
}

function parseNumber(raw: unknown): number | null {
  if (typeof raw === "number" && Number.isFinite(raw)) return raw;
  if (typeof raw !== "string") return null;
  const s = raw.trim().replace(/\s/g, "").replace(/\./g, "").replace(",", ".");
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

function normalizeIstat(code: string): string {
  const digits = code.replace(/\D/g, "");
  if (!digits) return "";
  return digits.padStart(6, "0");
}

function isSanVincenzoRow(row: Record<string, string>): boolean {
  for (const [k, v] of Object.entries(row)) {
    const nk = normHeader(k);
    if (
      nk.includes("cod") &&
      (nk.includes("istat") || nk.includes("comune") || nk === "pro_com")
    ) {
      if (normalizeIstat(v) === ISTAT_CODE) return true;
    }
  }
  for (const v of Object.values(row)) {
    if (normalizeIstat(v) === ISTAT_CODE) return true;
    if (v.trim().toLowerCase() === COMUNE_NOME.toLowerCase()) return true;
  }
  return false;
}

function detectDelimiter(headerLine: string): string {
  const semi = (headerLine.match(/;/g) || []).length;
  const comma = (headerLine.match(/,/g) || []).length;
  const tab = (headerLine.match(/\t/g) || []).length;
  if (tab >= semi && tab >= comma && tab > 0) return "\t";
  if (semi >= comma) return ";";
  return ",";
}

/** Parser CSV minimale (separatore ;/,/\\t), con quote semplici. */
export function parseCsv(text: string): Record<string, string>[] {
  const cleaned = text.replace(/^\uFEFF/, "").replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const lines = cleaned.split("\n").filter((l) => l.trim().length > 0);
  if (lines.length < 2) return [];
  const delim = detectDelimiter(lines[0]!);
  const headers = splitCsvLine(lines[0]!, delim).map((h) => h.trim());
  const rows: Record<string, string>[] = [];
  for (const line of lines.slice(1)) {
    const cells = splitCsvLine(line, delim);
    const row: Record<string, string> = {};
    headers.forEach((h, i) => {
      row[h] = (cells[i] ?? "").trim();
    });
    rows.push(row);
  }
  return rows;
}

function splitCsvLine(line: string, delim: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]!;
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (ch === delim && !inQuotes) {
      out.push(cur);
      cur = "";
      continue;
    }
    cur += ch;
  }
  out.push(cur);
  return out;
}

async function fetchText(url: string): Promise<{ text: string; contentType: string }> {
  const res = await fetch(url, {
    headers: { "User-Agent": UA, Accept: "*/*" },
    next: { revalidate: TURISMO_REVALIDATE_SECONDS },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} ${url}`);
  const buf = Buffer.from(await res.arrayBuffer());
  const contentType = res.headers.get("content-type") || "";
  if (
    contentType.includes("opendocument") ||
    contentType.includes("spreadsheet") ||
    url.toLowerCase().includes(".ods") ||
    buf.subarray(0, 2).toString() === "PK"
  ) {
    const xml = extractZipEntry(buf, "content.xml");
    if (!xml) throw new Error(`ODS senza content.xml: ${url}`);
    return { text: xml.toString("utf8"), contentType: "application/ods+xml" };
  }
  let text: string;
  try {
    text = new TextDecoder("utf-8").decode(buf);
    if (text.includes("\uFFFD")) throw new Error("bad utf8");
  } catch {
    text = new TextDecoder("latin-1").decode(buf);
  }
  return { text, contentType };
}

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url, {
    headers: { "User-Agent": UA, Accept: "application/json" },
    next: { revalidate: TURISMO_REVALIDATE_SECONDS },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} ${url}`);
  return (await res.json()) as T;
}

/** Estrae una entry da ZIP (deflate/store) — sufficiente per ODS LibreOffice. */
export function extractZipEntry(buf: Buffer, entryName: string): Buffer | null {
  // Preferisci central directory
  let eocd = -1;
  for (let i = buf.length - 22; i >= Math.max(0, buf.length - 65557); i--) {
    if (buf.readUInt32LE(i) === 0x06054b50) {
      eocd = i;
      break;
    }
  }
  if (eocd >= 0) {
    const cdOffset = buf.readUInt32LE(eocd + 16);
    const cdEntries = buf.readUInt16LE(eocd + 10);
    let off = cdOffset;
    for (let e = 0; e < cdEntries; e++) {
      if (buf.readUInt32LE(off) !== 0x02014b50) break;
      const method = buf.readUInt16LE(off + 10);
      const compSize = buf.readUInt32LE(off + 20);
      const nameLen = buf.readUInt16LE(off + 28);
      const extraLen = buf.readUInt16LE(off + 30);
      const commentLen = buf.readUInt16LE(off + 32);
      const localOff = buf.readUInt32LE(off + 42);
      const name = buf.subarray(off + 46, off + 46 + nameLen).toString("utf8");
      if (name === entryName || name.endsWith(`/${entryName}`)) {
        const localNameLen = buf.readUInt16LE(localOff + 26);
        const localExtraLen = buf.readUInt16LE(localOff + 28);
        const dataStart = localOff + 30 + localNameLen + localExtraLen;
        const data = buf.subarray(dataStart, dataStart + compSize);
        if (method === 0) return Buffer.from(data);
        if (method === 8) return inflateRawSync(data);
        return null;
      }
      off += 46 + nameLen + extraLen + commentLen;
    }
  }

  // Fallback: local headers sequenziali
  let offset = 0;
  while (offset + 30 < buf.length) {
    if (buf.readUInt32LE(offset) !== 0x04034b50) break;
    const method = buf.readUInt16LE(offset + 8);
    const flags = buf.readUInt16LE(offset + 6);
    const compSize = buf.readUInt32LE(offset + 18);
    const nameLen = buf.readUInt16LE(offset + 26);
    const extraLen = buf.readUInt16LE(offset + 28);
    const name = buf.subarray(offset + 30, offset + 30 + nameLen).toString("utf8");
    const dataStart = offset + 30 + nameLen + extraLen;
    if (flags & 0x8) {
      // data descriptor: cerca signature successiva in modo grezzo — non supportato
      return null;
    }
    const data = buf.subarray(dataStart, dataStart + compSize);
    if (name === entryName || name.endsWith(`/${entryName}`)) {
      if (method === 0) return Buffer.from(data);
      if (method === 8) return inflateRawSync(data);
      return null;
    }
    offset = dataStart + compSize;
  }
  return null;
}

/** Converte content.xml ODS in righe di celle (testo). */
export function parseOdsContentXml(xml: string): string[][] {
  const tableMatch = xml.match(/<table:table\b[^>]*>([\s\S]*?)<\/table:table>/);
  if (!tableMatch) return [];
  const tableBody = tableMatch[1]!;
  const rowRe = /<table:table-row\b[^>]*>([\s\S]*?)<\/table:table-row>/g;
  const rows: string[][] = [];
  let rm: RegExpExecArray | null;
  while ((rm = rowRe.exec(tableBody)) !== null) {
    const rowXml = rm[1]!;
    const cells: string[] = [];
    const cellRe = /<table:table-cell\b([^>]*)>([\s\S]*?)<\/table:table-cell>|<table:table-cell\b([^>]*)\/>/g;
    let cm: RegExpExecArray | null;
    while ((cm = cellRe.exec(rowXml)) !== null) {
      const attrs = cm[1] ?? cm[3] ?? "";
      const inner = cm[2] ?? "";
      const repeatMatch = attrs.match(/table:number-columns-repeated="(\d+)"/);
      const repeat = Math.min(Number(repeatMatch?.[1] ?? 1), 80);
      const valueMatch = attrs.match(/office:value="([^"]*)"/);
      let text = valueMatch?.[1] ?? "";
      if (!text) {
        const parts = [...inner.matchAll(/<text:p\b[^>]*>([\s\S]*?)<\/text:p>/g)].map(
          (m) => m[1]!.replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').trim(),
        );
        text = parts.join(" ").trim();
      }
      for (let i = 0; i < repeat; i++) cells.push(text);
    }
    rows.push(cells);
  }
  return rows;
}

function scoreResource(kind: "mese" | "provenienza" | "consistenza", r: CkanResource): number {
  const blob = `${r.name ?? ""} ${r.description ?? ""} ${r.url ?? ""}`.toLowerCase();
  if (kind === "mese") {
    if (/mese|mensil|comune_mese|comune-mese/.test(blob)) return 100;
    return 0;
  }
  if (kind === "consistenza") {
    if (/consistenza|struttur|offerta|letti/.test(blob) && !/moviment|arrivi|presenz/.test(blob))
      return 80;
    return 0;
  }
  // provenienza / movimento annuale
  if (/macro.?provenienza|provenienza|italiano|stranier|moviment|arrivi|presenz/.test(blob)) {
    if (/mese|mensil/.test(blob)) return 10;
    if (/consistenza|struttur/.test(blob) && !/moviment/.test(blob)) return 5;
    return 70;
  }
  return 0;
}

async function searchCkanPackages(): Promise<CkanPackage[]> {
  const queries = [
    "movimento turistico comune mese",
    'title:"Movimento dei clienti"',
    "movimento-dei-clienti-e-struttura-dell-offerta-ricettiva",
    "rt-mov-turistico",
  ];
  const byName = new Map<string, CkanPackage>();
  for (const q of queries) {
    try {
      const url = `${REGIONE_TOSCANA_CKAN_API}/package_search?q=${encodeURIComponent(q)}&rows=30`;
      const data = await fetchJson<{
        success?: boolean;
        result?: { results?: CkanPackage[] };
      }>(url);
      for (const pkg of data.result?.results ?? []) {
        if (pkg?.name) byName.set(pkg.name, pkg);
      }
    } catch (err) {
      console.warn("CKAN package_search fallita:", q, err);
    }
  }

  // package noti per anno recente (fallback slug se search non li trova)
  const currentYear = new Date().getFullYear();
  for (let y = currentYear; y >= currentYear - 3; y--) {
    const slugs = [
      `movimento-dei-clienti-e-struttura-dell-offerta-ricettiva-toscana-anno-${y}`,
      `movimento-clienti-offerta-ricettiva-${y}`,
    ];
    for (const id of slugs) {
      if (byName.has(id)) continue;
      try {
        const data = await fetchJson<{
          success?: boolean;
          result?: CkanPackage;
        }>(`${REGIONE_TOSCANA_CKAN_API}/package_show?id=${encodeURIComponent(id)}`);
        if (data.success && data.result?.name) byName.set(data.result.name, data.result);
      } catch {
        /* slug assente */
      }
    }
  }

  return [...byName.values()];
}

function packagesByYear(pkgs: CkanPackage[]): Array<{ year: number; pkg: CkanPackage }> {
  return pkgs
    .map((pkg) => ({
      year: yearFromText(pkg.name, pkg.title, pkg.notes) ?? 0,
      pkg,
    }))
    .filter((x) => x.year >= 2015)
    .sort((a, b) => b.year - a.year);
}

function pickResource(pkg: CkanPackage, kind: "mese" | "provenienza" | "consistenza"): CkanResource | null {
  const scored = (pkg.resources ?? [])
    .map((r) => ({ r, score: scoreResource(kind, r) }))
    .filter((x) => x.score >= 40)
    .sort((a, b) => b.score - a.score);
  return scored[0]?.r ?? null;
}

/** Scopre link documenti sulla pagina statistiche Regione Toscana (ODS/CSV). */
async function discoverRegioneDocumentLinks(year: number): Promise<{
  mese?: string;
  provenienza?: string;
  consistenza?: string;
  pageUrl: string;
}> {
  const pageUrl = `https://www.regione.toscana.it/-/arrivi-e-presenze-nelle-strutture-ricettive-e-struttura-dell-offerta-dati-${year}\u00a0`;
  const res = await fetch(pageUrl, {
    headers: { "User-Agent": UA, Accept: "text/html" },
    next: { revalidate: TURISMO_REVALIDATE_SECONDS },
  });
  if (!res.ok) {
    // retry senza NBSP
    const alt = pageUrl.replace(/\u00a0$/, "");
    const res2 = await fetch(alt, {
      headers: { "User-Agent": UA, Accept: "text/html" },
      next: { revalidate: TURISMO_REVALIDATE_SECONDS },
    });
    if (!res2.ok) throw new Error(`Pagina RT ${year} HTTP ${res.status}`);
    return parseRegioneDocLinks(await res2.text(), alt);
  }
  return parseRegioneDocLinks(await res.text(), pageUrl);
}

function parseRegioneDocLinks(html: string, pageUrl: string) {
  const hrefs = [...html.matchAll(/href="(\/documents\/d\/guest\/[^"]+)"/gi)].map(
    (m) => m[1]!,
  );
  const abs = (path: string) => `https://www.regione.toscana.it${path}`;
  const find = (re: RegExp) => {
    const hit = hrefs.find((h) => re.test(h));
    return hit ? abs(hit) : undefined;
  };
  return {
    pageUrl,
    mese: find(/mese|comune_mese/i),
    provenienza: find(/movimento-per-comune|macro|provenienza/i),
    consistenza: find(/consistenza/i),
  };
}

type MonthAgg = { arrivi: number; presenze: number };

function emptyMonths(): MonthAgg[] {
  return Array.from({ length: 12 }, () => ({ arrivi: 0, presenze: 0 }));
}

function parseMensileFromRows(rows: string[][], yearHint: number | null): {
  year: number | null;
  months: MonthAgg[];
  annual: MonthAgg;
} | null {
  // Layout tipico ODS RT: Provincia | Comune | (arrivi,presenze)×12 | totale arrivi | totale presenze
  for (const cells of rows) {
    const joined = cells.slice(0, 4).join(" ").toLowerCase();
    if (!joined.includes("san vincenzo") && !cells.some((c) => normalizeIstat(c) === ISTAT_CODE)) {
      continue;
    }
    // trova indice comune
    let start = 2;
    const comuneIdx = cells.findIndex((c) => c.trim().toLowerCase() === "san vincenzo");
    if (comuneIdx >= 0) start = comuneIdx + 1;
    const nums: number[] = [];
    for (let i = start; i < cells.length; i++) {
      const n = parseNumber(cells[i]);
      if (n == null) {
        if (nums.length >= 24) break;
        continue;
      }
      nums.push(n);
    }
    if (nums.length < 24) continue;
    const months = emptyMonths();
    for (let m = 0; m < 12; m++) {
      months[m] = { arrivi: nums[m * 2] ?? 0, presenze: nums[m * 2 + 1] ?? 0 };
    }
    const annual =
      nums.length >= 26
        ? { arrivi: nums[24]!, presenze: nums[25]! }
        : {
            arrivi: months.reduce((s, x) => s + x.arrivi, 0),
            presenze: months.reduce((s, x) => s + x.presenze, 0),
          };
    return { year: yearHint, months, annual };
  }
  return null;
}

function parseMensileFromCsv(rows: Record<string, string>[]): {
  year: number | null;
  months: MonthAgg[];
  annual: MonthAgg;
} | null {
  const filtered = rows.filter(isSanVincenzoRow);
  if (!filtered.length) return null;
  const months = emptyMonths();
  let year: number | null = null;
  let hasMonth = false;

  for (const row of filtered) {
    const entries = Object.entries(row);
    const map = Object.fromEntries(entries.map(([k, v]) => [normHeader(k), v]));
    const y = parseNumber(map.anno ?? map.year ?? "") ?? yearFromText(...Object.values(row));
    if (y) year = y;

    const meseRaw =
      map.mese ?? map.month ?? map.mese_numero ?? map.num_mese ?? map.periodo ?? "";
    let mese = parseNumber(meseRaw);
    if (mese == null) {
      const name = String(meseRaw).toLowerCase();
      const names = [
        "gennaio","febbraio","marzo","aprile","maggio","giugno",
        "luglio","agosto","settembre","ottobre","novembre","dicembre",
      ];
      const idx = names.findIndex((n) => name.startsWith(n.slice(0, 3)));
      if (idx >= 0) mese = idx + 1;
    }
    const arrivi = pickField(map, ["arrivi", "arrivo", "arrivals"]);
    const presenze = pickField(map, ["presenze", "presenza", "nights", "notti"]);
    if (mese != null && mese >= 1 && mese <= 12) {
      hasMonth = true;
      months[mese - 1]!.arrivi += arrivi ?? 0;
      months[mese - 1]!.presenze += presenze ?? 0;
    }
  }

  if (!hasMonth) return null;
  return {
    year,
    months,
    annual: {
      arrivi: months.reduce((s, m) => s + m.arrivi, 0),
      presenze: months.reduce((s, m) => s + m.presenze, 0),
    },
  };
}

function pickField(map: Record<string, string>, keys: string[]): number | null {
  for (const k of keys) {
    if (map[k] != null) {
      const n = parseNumber(map[k]);
      if (n != null) return n;
    }
  }
  for (const k of keys) {
    for (const [hk, hv] of Object.entries(map)) {
      if (hk === k) continue;
      if (hk.endsWith(`_${k}`) || hk.startsWith(`${k}_`)) {
        const n = parseNumber(hv);
        if (n != null) return n;
      }
    }
  }
  return null;
}

function parseProvenienzaFromCsv(rows: Record<string, string>[]): {
  year: number | null;
  italiani: number;
  stranieri: number;
  arrivi: number;
  presenze: number;
} | null {
  const filtered = rows.filter(isSanVincenzoRow);
  if (!filtered.length) return null;
  let year: number | null = null;
  let itP = 0;
  let stP = 0;
  let itA = 0;
  let stA = 0;
  let usedWide = false;

  for (const row of filtered) {
    const map = Object.fromEntries(
      Object.entries(row).map(([k, v]) => [normHeader(k), v]),
    );
    const y = parseNumber(map.anno ?? map.year ?? "") ?? yearFromText(...Object.values(row));
    if (y) year = y;

    const wideItP = pickField(map, ["presenze_italiane", "presenze_italiani", "presenze_ita"]);
    const wideStP = pickField(map, ["presenze_straniere", "presenze_stranieri", "presenze_est"]);
    const wideItA = pickField(map, ["arrivi_italiani", "arrivi_ita"]);
    const wideStA = pickField(map, ["arrivi_stranieri", "arrivi_est"]);
    if (wideItP != null || wideStP != null) {
      usedWide = true;
      itP += wideItP ?? 0;
      stP += wideStP ?? 0;
      itA += wideItA ?? 0;
      stA += wideStA ?? 0;
      continue;
    }

    const prov = (
      map.macroprovenienza ??
      map.provenienzamacro ??
      map.provenienza_macro ??
      map.provenienza ??
      map.italiano_straniero ??
      map.macro_provenienza ??
      ""
    ).toLowerCase();
    const arrivi = pickField(map, ["arrivi", "arrivo"]);
    const presenze = pickField(map, ["presenze", "presenza"]);
    if (/stran|estero|foreign|str\b/.test(prov)) {
      stP += presenze ?? 0;
      stA += arrivi ?? 0;
    } else if (/ital|ita\b|nazional/.test(prov)) {
      itP += presenze ?? 0;
      itA += arrivi ?? 0;
    } else if (!prov && (arrivi != null || presenze != null)) {
      // riga totale senza split
      itP += presenze ?? 0;
      itA += arrivi ?? 0;
    }
  }

  if (!usedWide && itP === 0 && stP === 0) return null;
  return {
    year,
    italiani: itP,
    stranieri: stP,
    arrivi: itA + stA,
    presenze: itP + stP,
  };
}

async function loadMensileFromUrl(
  url: string,
  yearHint: number | null,
): Promise<ReturnType<typeof parseMensileFromCsv>> {
  const { text, contentType } = await fetchText(url);
  if (contentType.includes("ods") || text.includes("<office:document-content")) {
    const grid = parseOdsContentXml(text);
    return parseMensileFromRows(grid, yearHint);
  }
  return parseMensileFromCsv(parseCsv(text));
}

async function loadProvenienzaFromUrl(url: string): Promise<ReturnType<typeof parseProvenienzaFromCsv>> {
  const { text, contentType } = await fetchText(url);
  if (contentType.includes("ods") || text.includes("<office:document-content")) {
    const grid = parseOdsContentXml(text);
    // Layout RT tipico (2 righe header):
    // Provincia | Comune | Arrivi(it,str,tot) | Presenze(it,str,tot)
    for (const cells of grid) {
      const comuneIdx = cells.findIndex(
        (c) => c.trim().toLowerCase() === COMUNE_NOME.toLowerCase(),
      );
      if (comuneIdx < 0 && !cells.some((c) => normalizeIstat(c) === ISTAT_CODE)) {
        continue;
      }
      const start =
        comuneIdx >= 0
          ? comuneIdx + 1
          : cells.findIndex((c) => normalizeIstat(c) === ISTAT_CODE) + 1;
      const nums = cells
        .slice(Math.max(0, start))
        .map(parseNumber)
        .filter((n): n is number => n != null);
      // arrivi_it, arrivi_st, arrivi_tot, pres_it, pres_st, pres_tot
      if (nums.length >= 6) {
        return {
          year: null,
          italiani: nums[3]!,
          stranieri: nums[4]!,
          arrivi: nums[2] ?? nums[0]! + nums[1]!,
          presenze: nums[5] ?? nums[3]! + nums[4]!,
        };
      }
      if (nums.length >= 4) {
        return {
          year: null,
          italiani: nums[2]!,
          stranieri: nums[3]!,
          arrivi: nums[0]! + nums[1]!,
          presenze: nums[2]! + nums[3]!,
        };
      }
    }

    const headerIdx = grid.findIndex(
      (r) =>
        r.some((c) => /comune/i.test(c)) &&
        r.some((c) => /arrivi|presenze|provenienza|italiani/i.test(c)),
    );
    if (headerIdx >= 0) {
      const headers = grid[headerIdx]!.map((h, i) => h || `col_${i}`);
      const rows = grid.slice(headerIdx + 1).map((cells) => {
        const row: Record<string, string> = {};
        headers.forEach((h, i) => {
          row[h] = cells[i] ?? "";
        });
        return row;
      });
      return parseProvenienzaFromCsv(rows);
    }
    return null;
  }
  return parseProvenienzaFromCsv(parseCsv(text));
}

async function loadResidenti(): Promise<number | null> {
  try {
    // Evita dipendenza circolare HTTP: riusa cache KPI se possibile in route.
    return null;
  } catch {
    return null;
  }
}

export async function buildTurismoFlussi(
  residenti?: number | null,
): Promise<TurismoFlussiPayload> {
  const aggiornato = new Date().toISOString();
  const notes: string[] = [];
  let dataset: string | null = null;

  try {
    const pkgs = await searchCkanPackages();
    const ranked = packagesByYear(pkgs);
    if (!ranked.length && !TURISMO_CSV_FALLBACK_URL) {
      return emptyTurismoPayload({
        aggiornato,
        error: "Nessun dataset turismo trovato su dati.toscana.it",
        note: "Riprova più tardi oppure imposta TURISMO_CSV_FALLBACK_URL.",
      });
    }

    const latestYear = ranked[0]?.year ?? new Date().getFullYear() - 1;
    const prevYear = latestYear - 1;
    dataset = ranked[0]?.pkg.name ?? null;

    // --- Mensile (hero): CKAN mese → pagina RT → fallback env ---
    let mensileLatest: ReturnType<typeof parseMensileFromCsv> = null;
    let mensilePrev: ReturnType<typeof parseMensileFromCsv> = null;

    for (const { year, pkg } of ranked.slice(0, 3)) {
      const meseRes = pickResource(pkg, "mese");
      if (!meseRes?.url) continue;
      try {
        const parsed = await loadMensileFromUrl(meseRes.url, year);
        if (parsed) {
          if (!mensileLatest) mensileLatest = { ...parsed, year: parsed.year ?? year };
          else if (!mensilePrev && (parsed.year ?? year) < (mensileLatest.year ?? year)) {
            mensilePrev = { ...parsed, year: parsed.year ?? year };
          }
        }
      } catch (err) {
        console.warn("Risorsa mese CKAN non leggibile:", meseRes.url, err);
      }
    }

    if (!mensileLatest) {
      try {
        const docs = await discoverRegioneDocumentLinks(latestYear);
        if (docs.mese) {
          mensileLatest = await loadMensileFromUrl(docs.mese, latestYear);
          if (mensileLatest) {
            notes.push(`Stagionalità ${latestYear} da open data Regione Toscana (pagina statistiche).`);
            dataset = dataset ?? `rt-statistiche-${latestYear}`;
          }
        }
      } catch (err) {
        console.warn("Discover RT mensile fallita:", err);
      }
    }
    if (!mensilePrev) {
      try {
        const docs = await discoverRegioneDocumentLinks(prevYear);
        if (docs.mese) {
          mensilePrev = await loadMensileFromUrl(docs.mese, prevYear);
        }
      } catch (err) {
        console.warn("Discover RT mensile anno prec. fallita:", err);
      }
    }

    if (!mensileLatest && TURISMO_CSV_FALLBACK_URL) {
      try {
        mensileLatest = await loadMensileFromUrl(TURISMO_CSV_FALLBACK_URL, latestYear);
        notes.push("Usato TURISMO_CSV_FALLBACK_URL per la serie mensile.");
      } catch (err) {
        console.warn("Fallback CSV turismo non leggibile:", err);
      }
    }

    // --- Provenienza + serie annuale da CKAN (CSV) ---
    const annualeMap = new Map<number, TurismoAnnuale>();
    let provenienza: TurismoProvenienza = { italiani: 0, stranieri: 0 };
    let provenienzaYear: number | null = null;

    for (const { year, pkg } of ranked.slice(0, 8)) {
      const provRes = pickResource(pkg, "provenienza");
      if (!provRes?.url) continue;
      try {
        let parsed = await loadProvenienzaFromUrl(provRes.url);
        if (!parsed && provRes.datastore_active && provRes.id) {
          // datastore_search con q=ISTAT
          try {
            const ds = await fetchJson<{
              result?: { records?: Array<Record<string, unknown>> };
            }>(
              `${REGIONE_TOSCANA_CKAN_API}/datastore_search?resource_id=${provRes.id}&q=${ISTAT_CODE}&limit=100`,
            );
            const records = (ds.result?.records ?? []).map((rec) => {
              const row: Record<string, string> = {};
              for (const [k, v] of Object.entries(rec)) {
                if (k === "_id") continue;
                row[k] = v == null ? "" : String(v);
              }
              return row;
            });
            parsed = parseProvenienzaFromCsv(records);
          } catch {
            /* datastore assente */
          }
        }
        if (!parsed) continue;
        const y = parsed.year ?? year;
        annualeMap.set(y, { anno: y, arrivi: parsed.arrivi, presenze: parsed.presenze });
        if (provenienzaYear == null || y > provenienzaYear) {
          provenienzaYear = y;
          provenienza = { italiani: parsed.italiani, stranieri: parsed.stranieri };
        }
      } catch (err) {
        console.warn("Risorsa provenienza non leggibile:", provRes.url, err);
      }
    }

    // Integra provenienza dall'anno più recente (pagina RT se CKAN non copre lo split)
    if (
      mensileLatest?.year &&
      (provenienzaYear == null || provenienzaYear < mensileLatest.year)
    ) {
      try {
        const docs = await discoverRegioneDocumentLinks(mensileLatest.year);
        if (docs.provenienza) {
          const parsed = await loadProvenienzaFromUrl(docs.provenienza);
          if (parsed && (parsed.italiani > 0 || parsed.stranieri > 0)) {
            provenienza = { italiani: parsed.italiani, stranieri: parsed.stranieri };
            provenienzaYear = mensileLatest.year;
            annualeMap.set(mensileLatest.year, {
              anno: mensileLatest.year,
              arrivi: parsed.arrivi || mensileLatest.annual.arrivi,
              presenze: parsed.presenze || mensileLatest.annual.presenze,
            });
          }
        }
      } catch (err) {
        console.warn("Provenienza RT non leggibile:", err);
      }
    }

    // Integra annuali dai totali mensili
    if (mensileLatest?.year && mensileLatest.annual.presenze > 0) {
      const existing = annualeMap.get(mensileLatest.year);
      if (!existing || existing.presenze <= 0) {
        annualeMap.set(mensileLatest.year, {
          anno: mensileLatest.year,
          arrivi: mensileLatest.annual.arrivi,
          presenze: mensileLatest.annual.presenze,
        });
      }
    }
    if (mensilePrev?.year && mensilePrev.annual.presenze > 0) {
      const existing = annualeMap.get(mensilePrev.year);
      if (!existing || existing.presenze <= 0) {
        annualeMap.set(mensilePrev.year, {
          anno: mensilePrev.year,
          arrivi: mensilePrev.annual.arrivi,
          presenze: mensilePrev.annual.presenze,
        });
      }
    }

    const annuale = [...annualeMap.values()].sort((a, b) => a.anno - b.anno);
    const anno =
      mensileLatest?.year ??
      provenienzaYear ??
      (annuale.length ? annuale[annuale.length - 1]!.anno : null);
    const annoPrecedente =
      mensilePrev?.year ??
      (anno != null
        ? (annuale.map((a) => a.anno).filter((y) => y < anno).sort((a, b) => b - a)[0] ??
          anno - 1)
        : null);

    const mensile: TurismoMese[] = [];
    if (mensileLatest) {
      for (let m = 1; m <= 12; m++) {
        const cur = mensileLatest.months[m - 1]!;
        const prec = mensilePrev?.months[m - 1];
        mensile.push({
          mese: m,
          arrivi: cur.arrivi,
          presenze: cur.presenze,
          arriviPrec: prec?.arrivi ?? 0,
          presenzePrec: prec?.presenze ?? 0,
        });
      }
    }

    const curAnnual =
      (anno != null ? annualeMap.get(anno) : null) ??
      mensileLatest?.annual ??
      null;
    const prevAnnual =
      (annoPrecedente != null ? annualeMap.get(annoPrecedente) : null) ??
      mensilePrev?.annual ??
      null;

    const resPop = residenti && residenti > 0 ? residenti : TURISMO_RESIDENTI_FALLBACK;
    const permanenzaMedia =
      curAnnual && curAnnual.arrivi > 0
        ? curAnnual.presenze / curAnnual.arrivi
        : null;
    const pressioneTuristica =
      curAnnual && resPop > 0 ? curAnnual.presenze / resPop : null;
    const deltaPresenzePct =
      curAnnual && prevAnnual && prevAnnual.presenze > 0
        ? ((curAnnual.presenze - prevAnnual.presenze) / prevAnnual.presenze) * 100
        : null;

    if (!mensile.length) {
      notes.push(
        "Serie mensile non ancora su CKAN: disponibile sulla pagina statistiche Regione Toscana (ODS). Se il fetch fallisce, resta vuota.",
      );
    }

    const disponibile =
      mensile.length > 0 ||
      annuale.length > 0 ||
      provenienza.italiani > 0 ||
      provenienza.stranieri > 0;

    // Se provenienza vuota ma abbiamo mensile, non inventiamo split
    return {
      disponibile,
      anno,
      annoPrecedente,
      mensile,
      annuale,
      provenienza,
      residenti: resPop,
      permanenzaMedia,
      pressioneTuristica,
      deltaPresenzePct,
      fonte: TURISMO_FONTE,
      aggiornato,
      dataset,
      note: notes.length ? notes.join(" ") : null,
      error: disponibile ? null : "Dati turismo non disponibili",
    };
  } catch (err) {
    console.error("buildTurismoFlussi error", err);
    return emptyTurismoPayload({
      aggiornato,
      error: "Impossibile recuperare i flussi turistici",
      residenti: residenti && residenti > 0 ? residenti : TURISMO_RESIDENTI_FALLBACK,
    });
  }
}

// silenzia unused in caso tree-shake
void loadResidenti;
