/**
 * Aggiorna lo snapshot OMI comunale da mirror open data ondata
 * (https://github.com/ondata/quotazioni-immobiliari-agenzia-entrate).
 *
 * Uso:
 *   npx --yes tsx scripts/update-omi.ts
 *   # oppure (Node ≥22):
 *   node --experimental-strip-types scripts/update-omi.ts
 *
 * Cosa fa:
 * 1. Elenca i CSV `*_VALORI_utf8.csv` / `*_ZONE_utf8.csv` nel mirror
 * 2. Scarica l'ultimo semestre (e, se `--all`, tutti i semestri disponibili)
 * 3. Filtra le sole righe del comune ISTAT in `config/comune.json`
 *    (codifica OMI tipo `9` + ISTAT, es. `9049018`)
 * 4. Scrive `src/data/omi/{ISTAT}.json` (e i semestri `{ISTAT}-YYYY-S.json`)
 *    (con `storico` aggregato sulle abitazioni civili)
 *
 * Non richiede login Fisconline/Entratel. Attribuzione: «Agenzia Entrate – OMI».
 */

import { mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const ISTAT = "000000";
/** Codifica Comune_ISTAT nei CSV OMI / ondata: termina con ISTAT a 6 cifre (es. `9049018`). */
function loadIstatFromConfig(): string {
  try {
    const raw = readFileSync(path.join(process.cwd(), "config", "comune.json"), "utf8");
    const json = JSON.parse(raw) as { istat_code?: string };
    const code = String(json.istat_code ?? "").replace(/\D/g, "").padStart(6, "0");
    return code || ISTAT;
  } catch {
    return ISTAT;
  }
}

const ISTAT_CODE = loadIstatFromConfig();
const MIRROR_API =
  "https://api.github.com/repos/ondata/quotazioni-immobiliari-agenzia-entrate/contents/data";
const MIRROR_RAW =
  "https://raw.githubusercontent.com/ondata/quotazioni-immobiliari-agenzia-entrate/master/data";
const OUT_DIR = path.join(process.cwd(), "src", "data", "omi");
const UA =
  "Mozilla/5.0 (compatible; CruscottoComune/1.0; +https://github.com/magiaslab/san-vincenzo-cruscotto)";

type Tipologia = {
  tipologia: string;
  statoConservativo: string;
  mercatoMinMq: number | null;
  mercatoMaxMq: number | null;
  affittoMinMqMese: number | null;
  affittoMaxMqMese: number | null;
  codTip?: string;
};

type Zona = {
  codice: string;
  descrizione: string;
  tipologie: Tipologia[];
};

type Snapshot = {
  semestre: string;
  comuneIstat: string;
  zone: Zona[];
  storico?: { semestre: string; abitazioniCivili: { minMq: number; maxMq: number } }[];
  fonte: string;
  mirror: string;
  sourceFile: string;
  nota?: string;
};

function parseNum(v: string | undefined): number | null {
  if (v == null) return null;
  const s = String(v).trim().replace(/^["']|["']$/g, "").replace(",", ".");
  if (!s || s === "-") return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

/** CSV parser minimale (gestisce virgolette e virgole interne). */
function parseCsv(text: string): Record<string, string>[] {
  const lines = text.replace(/^\uFEFF/, "").split(/\r?\n/).filter((l) => l.length);
  if (lines.length < 2) return [];
  const headers = splitCsvLine(lines[0]!);
  const rows: Record<string, string>[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = splitCsvLine(lines[i]!);
    if (cols.length === 1 && cols[0] === "") continue;
    const row: Record<string, string> = {};
    headers.forEach((h, idx) => {
      row[h] = cols[idx] ?? "";
    });
    rows.push(row);
  }
  return rows;
}

function splitCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]!;
    if (ch === '"') {
      if (inQ && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQ = !inQ;
      }
      continue;
    }
    if (ch === "," && !inQ) {
      out.push(cur);
      cur = "";
      continue;
    }
    cur += ch;
  }
  out.push(cur);
  return out;
}

function semestreFromFilename(name: string): string | null {
  const m = name.match(/_(\d{4})([12])_(VALORI|ZONE)_utf8\.csv$/i);
  if (!m) return null;
  return `${m[1]}-${m[2]}`;
}

async function fetchText(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: { Accept: "text/csv,application/json", "User-Agent": UA },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} ${url}`);
  return res.text();
}

async function listMirrorFiles(): Promise<string[]> {
  const res = await fetch(MIRROR_API, {
    headers: { Accept: "application/vnd.github+json", "User-Agent": UA },
  });
  if (!res.ok) throw new Error(`GitHub API ${res.status}`);
  const data = (await res.json()) as Array<{ name?: string; type?: string }>;
  return data
    .filter((x) => x.type === "file" && typeof x.name === "string")
    .map((x) => x.name as string);
}

function isTargetComune(istat: string): boolean {
  const digits = istat.replace(/\D/g, "");
  const target = ISTAT_CODE;
  const short = target.replace(/^0+/, "");
  return (
    digits === target ||
    digits.endsWith(target) ||
    (Boolean(short) && digits.endsWith(short))
  );
}

function buildSnapshot(
  semestre: string,
  valoriCsv: string,
  zoneCsv: string,
  sourceFile: string,
): Snapshot | null {
  const zoneDesc = new Map<string, string>();
  for (const row of parseCsv(zoneCsv)) {
    if (!isTargetComune(row.Comune_ISTAT ?? "")) continue;
    const z = (row.Zona ?? "").trim();
    if (!z) continue;
    const desc = (row.Zona_Descr ?? "").trim().replace(/^'+|'+$/g, "");
    zoneDesc.set(z, desc || z);
  }

  const byZona = new Map<string, Tipologia[]>();
  for (const row of parseCsv(valoriCsv)) {
    if (!isTargetComune(row.Comune_ISTAT ?? "")) continue;
    const codice = (row.Zona ?? "").trim();
    if (!codice) continue;
    const tip: Tipologia = {
      tipologia: (row.Descr_Tipologia ?? "").trim(),
      statoConservativo: (row.Stato ?? "").trim(),
      mercatoMinMq: parseNum(row.Compr_min),
      mercatoMaxMq: parseNum(row.Compr_max),
      affittoMinMqMese: parseNum(row.Loc_min),
      affittoMaxMqMese: parseNum(row.Loc_max),
      codTip: (row.Cod_Tip ?? "").trim() || undefined,
    };
    if (!tip.tipologia) continue;
    const list = byZona.get(codice) ?? [];
    list.push(tip);
    byZona.set(codice, list);
  }

  if (byZona.size === 0) return null;

  const zone: Zona[] = [...byZona.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([codice, tipologie]) => ({
      codice,
      descrizione: zoneDesc.get(codice) ?? codice,
      tipologie,
    }));

  return {
    semestre,
    comuneIstat: ISTAT_CODE,
    zone,
    fonte: "Agenzia Entrate – OMI",
    mirror: "ondata/quotazioni-immobiliari-agenzia-entrate",
    sourceFile,
  };
}

function civiliRange(zone: Zona[]): { minMq: number; maxMq: number } | null {
  const mins: number[] = [];
  const maxs: number[] = [];
  for (const z of zone) {
    for (const t of z.tipologie) {
      if (!t.tipologia.toLowerCase().includes("abitazioni civili")) continue;
      if (t.mercatoMinMq != null) mins.push(t.mercatoMinMq);
      if (t.mercatoMaxMq != null) maxs.push(t.mercatoMaxMq);
    }
  }
  if (!mins.length || !maxs.length) return null;
  return { minMq: Math.min(...mins), maxMq: Math.max(...maxs) };
}

function writeJson(filePath: string, data: unknown) {
  writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
  console.log("wrote", filePath);
}

async function main() {
  const all = process.argv.includes("--all");
  mkdirSync(OUT_DIR, { recursive: true });

  console.log("Listing mirror files…");
  const names = await listMirrorFiles();
  const valori = names
    .filter((n) => /_VALORI_utf8\.csv$/i.test(n))
    .map((n) => ({ name: n, semestre: semestreFromFilename(n) }))
    .filter((x): x is { name: string; semestre: string } => Boolean(x.semestre))
    .sort((a, b) => a.semestre.localeCompare(b.semestre));

  if (valori.length === 0) {
    throw new Error("Nessun CSV VALORI trovato nel mirror ondata");
  }

  const selected = all ? valori : [valori[valori.length - 1]!];
  console.log(
    all
      ? `Modalità --all: ${selected.length} semestri`
      : `Ultimo semestre mirror: ${selected[0]!.semestre} (${selected[0]!.name})`,
  );

  const snaps: Snapshot[] = [];
  for (const item of selected) {
    const zoneName = item.name.replace("_VALORI_", "_ZONE_");
    console.log("Download", item.name, "+", zoneName);
    const [valoriCsv, zoneCsv] = await Promise.all([
      fetchText(`${MIRROR_RAW}/${item.name}`),
      fetchText(`${MIRROR_RAW}/${zoneName}`),
    ]);
    const snap = buildSnapshot(item.semestre, valoriCsv, zoneCsv, item.name);
    if (!snap) {
      console.warn("Nessuna riga per", ISTAT_CODE, "in", item.semestre);
      continue;
    }
    writeJson(path.join(OUT_DIR, `${ISTAT_CODE}-${item.semestre}.json`), snap);
    snaps.push(snap);
  }

  if (snaps.length === 0) {
    throw new Error(`Nessuno snapshot generato per ${ISTAT_CODE}`);
  }

  // Ricarica tutti i semestri già presenti su disco per lo storico
  const existing = readdirSync(OUT_DIR)
    .filter(
      (f) =>
        f.startsWith(`${ISTAT_CODE}-`) &&
          /^\d{6}-\d{4}-[12]\.json$/.test(f),
    )
    .sort();
  const allSnaps: Snapshot[] = [];
  for (const f of existing) {
    const raw = JSON.parse(readFileSync(path.join(OUT_DIR, f), "utf8")) as Snapshot;
    if (raw?.semestre && Array.isArray(raw.zone)) {
      const istat = String(raw.comuneIstat ?? "").replace(/\D/g, "");
      if (istat && istat !== ISTAT_CODE && !istat.endsWith(ISTAT_CODE)) continue;
      allSnaps.push(raw);
    }
  }

  const storico = allSnaps
    .map((s) => {
      const ab = civiliRange(s.zone);
      return ab ? { semestre: s.semestre, abitazioniCivili: ab } : null;
    })
    .filter((x): x is NonNullable<typeof x> => x != null)
    .sort((a, b) => a.semestre.localeCompare(b.semestre));

  const latest = allSnaps.sort((a, b) => a.semestre.localeCompare(b.semestre)).at(-1)!;
  const primary: Snapshot = {
    ...latest,
    storico,
    nota:
      "Snapshot comunale da mirror open data ondata (senza login Fisconline). " +
      "Il mirror nazionale può non includere i semestri più recenti.",
  };
  writeJson(path.join(OUT_DIR, `${ISTAT_CODE}.json`), primary);
  console.log(
    `OK: ${primary.zone.length} zone, semestre ${primary.semestre}, storico ${storico.length} punti`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
