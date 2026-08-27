/**
 * Anagrafe amministratori locali — DAIT Ministero dell'Interno.
 * CSV provinciale: https://dait.interno.gov.it/documenti/provincia_di_<slug>.csv
 */
import {
  COMUNE,
  isFeatureEnabled,
  matchesComuneText,
} from "@/lib/comune-config";
import { fetchUa } from "@/lib/http-ua";

export const DAIT_FONTE =
  "Ministero dell'Interno — DAIT, anagrafe amministratori locali";

export type Amministratore = {
  carica: string;
  nome: string;
  cognome: string;
  lista: string;
  dataNomina: string;
  comune: string;
};

export type AmministratoriData = {
  comune: string;
  slug: string;
  url: string;
  persone: Amministratore[];
  note: string | null;
};

export function emptyAmministratori(
  extra?: Partial<AmministratoriData>,
): AmministratoriData {
  return {
    comune: COMUNE.nome,
    slug: COMUNE.regione_opendata.dait_provincia_slug,
    url: "",
    persone: [],
    note: extra?.note ?? null,
    ...extra,
  };
}

function daitUrl(slug: string): string {
  return `https://dait.interno.gov.it/documenti/provincia_di_${slug}.csv`;
}

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cur = "";
  let inQ = false;
  const src = text.replace(/^\uFEFF/, "");
  for (let i = 0; i < src.length; i += 1) {
    const ch = src[i];
    if (inQ) {
      if (ch === '"') {
        if (src[i + 1] === '"') {
          cur += '"';
          i += 1;
        } else inQ = false;
      } else cur += ch;
    } else if (ch === '"') inQ = true;
    else if (ch === ";" || ch === ",") {
      row.push(cur.trim());
      cur = "";
    } else if (ch === "\n") {
      row.push(cur.trim());
      if (row.some((c) => c)) rows.push(row);
      row = [];
      cur = "";
    } else if (ch !== "\r") cur += ch;
  }
  if (cur || row.length) {
    row.push(cur.trim());
    if (row.some((c) => c)) rows.push(row);
  }
  return rows;
}

function col(header: string[], row: string[], ...names: string[]): string {
  const lower = header.map((h) => h.toLowerCase());
  for (const n of names) {
    const i = lower.findIndex((h) => h.includes(n.toLowerCase()));
    if (i >= 0) return row[i] ?? "";
  }
  return "";
}

export async function buildAmministratori(): Promise<AmministratoriData> {
  if (!isFeatureEnabled("chi_amministra")) {
    return emptyAmministratori({
      note: "Modulo spento (features.chi_amministra).",
    });
  }
  const slug = COMUNE.regione_opendata.dait_provincia_slug.trim();
  if (!slug) {
    return emptyAmministratori({
      note: "Configura regione_opendata.dait_provincia_slug (es. livorno).",
    });
  }
  const url = daitUrl(slug);
  const res = await fetchUa(url, {
    headers: { Accept: "text/csv,text/plain,*/*" },
  });
  if (!res.ok) {
    return emptyAmministratori({
      url,
      note: `DAIT ha risposto ${res.status} per ${url}`,
    });
  }
  const buf = await res.arrayBuffer();
  let text = new TextDecoder("utf-8").decode(buf);
  if (text.includes("\uFFFD") || !text.includes(";")) {
    text = new TextDecoder("latin1").decode(buf);
  }
  const rows = parseCsv(text);
  if (rows.length < 2) {
    return emptyAmministratori({ url, note: "CSV DAIT vuoto o illeggibile." });
  }
  const header = rows[0];
  const persone: Amministratore[] = [];
  for (const row of rows.slice(1)) {
    const comune = col(header, row, "comune", "descrizione_comune", "ente");
    if (!matchesComuneText(comune)) continue;
    persone.push({
      carica: col(header, row, "carica", "descrizione_carica", "incarico"),
      nome: col(header, row, "nome", "nome_amministratore"),
      cognome: col(header, row, "cognome", "cognome_amministratore"),
      lista: col(header, row, "lista", "lista_rappresentata"),
      dataNomina: col(header, row, "nomina", "data_nomina", "decorrenza"),
      comune,
    });
  }
  return {
    comune: COMUNE.nome,
    slug,
    url,
    persone,
    note:
      persone.length === 0
        ? `Nessuna riga per ${COMUNE.nome} nel CSV provinciale.`
        : null,
  };
}
