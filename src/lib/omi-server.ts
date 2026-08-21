/**
 * Caricamento OMI lato server: snapshot bundlato, file ISTAT, poi mirror ondata.
 */
import { readFile } from "node:fs/promises";
import path from "node:path";
import { unstable_cache } from "next/cache";
import { ISTAT_CODE } from "@/lib/constants";
import { COMUNE } from "@/lib/comune-config";
import {
  hasOmiPayload,
  loadOmiSnapshot,
  matchesOmiComuneIstat,
  normalizeSnapshot,
  type OmiData,
} from "@/lib/omi";

const MIRROR_API =
  "https://api.github.com/repos/ondata/quotazioni-immobiliari-agenzia-entrate/contents/data";
const MIRROR_RAW =
  "https://raw.githubusercontent.com/ondata/quotazioni-immobiliari-agenzia-entrate/master/data";

function parseNum(v: string | undefined): number | null {
  if (v == null) return null;
  const s = String(v).trim().replace(/^["']|["']$/g, "").replace(",", ".");
  if (!s || s === "-") return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
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

function semestreFromFilename(name: string): string | null {
  const m = name.match(/_(\d{4})([12])_(VALORI|ZONE)_utf8\.csv$/i);
  if (!m) return null;
  return `${m[1]}-${m[2]}`;
}

async function fetchText(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: {
      Accept: "text/csv,application/json",
      "User-Agent": COMUNE.brand.user_agent,
    },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} ${url}`);
  return res.text();
}

function snapshotFromCsv(
  semestre: string,
  valoriCsv: string,
  zoneCsv: string,
  istat: string,
): OmiData | null {
  const zoneDesc = new Map<string, string>();
  for (const row of parseCsv(zoneCsv)) {
    if (!matchesOmiComuneIstat(row.Comune_ISTAT, istat)) continue;
    const z = (row.Zona ?? "").trim();
    if (!z) continue;
    const desc = (row.Zona_Descr ?? "").trim().replace(/^'+|'+$/g, "");
    zoneDesc.set(z, desc || z);
  }

  const byZona = new Map<
    string,
    NonNullable<OmiData["zone"][number]["tipologie"]>
  >();
  for (const row of parseCsv(valoriCsv)) {
    if (!matchesOmiComuneIstat(row.Comune_ISTAT, istat)) continue;
    const codice = (row.Zona ?? "").trim();
    if (!codice) continue;
    const tip = {
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

  const zone = [...byZona.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([codice, tipologie]) => ({
      codice,
      descrizione: zoneDesc.get(codice) ?? codice,
      tipologie,
    }));

  return { semestre, zone };
}

const fetchLatestOmiMirror = unstable_cache(
  async (istat: string): Promise<OmiData | null> => {
    const res = await fetch(MIRROR_API, {
      headers: {
        Accept: "application/vnd.github+json",
        "User-Agent": COMUNE.brand.user_agent,
      },
    });
    if (!res.ok) throw new Error(`GitHub API ${res.status}`);
    const data = (await res.json()) as Array<{ name?: string; type?: string }>;
    const valori = data
      .filter((x) => x.type === "file" && typeof x.name === "string")
      .map((x) => x.name as string)
      .filter((n) => /_VALORI_utf8\.csv$/i.test(n))
      .map((n) => ({ name: n, semestre: semestreFromFilename(n) }))
      .filter((x): x is { name: string; semestre: string } => Boolean(x.semestre))
      .sort((a, b) => a.semestre.localeCompare(b.semestre));
    const latest = valori.at(-1);
    if (!latest) return null;
    const zoneName = latest.name.replace("_VALORI_", "_ZONE_");
    const [valoriCsv, zoneCsv] = await Promise.all([
      fetchText(`${MIRROR_RAW}/${latest.name}`),
      fetchText(`${MIRROR_RAW}/${zoneName}`),
    ]);
    return snapshotFromCsv(latest.semestre, valoriCsv, zoneCsv, istat);
  },
  ["omi-mirror", ISTAT_CODE],
  { revalidate: 2592000 },
);

async function loadOmiFromDisk(istat: string): Promise<OmiData | null> {
  try {
    const raw = await readFile(
      path.join(process.cwd(), "src", "data", "omi", `${istat}.json`),
      "utf8",
    );
    const snap = normalizeSnapshot(JSON.parse(raw) as unknown);
    if (!snap || !matchesOmiComuneIstat(snap.comuneIstat, istat)) return null;
    return {
      semestre: snap.semestre,
      zone: snap.zone,
      storico: snap.storico,
    };
  } catch {
    return null;
  }
}

export async function loadOmiForConfiguredComune(): Promise<OmiData | null> {
  const bundled = loadOmiSnapshot();
  if (bundled && hasOmiPayload(bundled)) return bundled;

  const fromDisk = await loadOmiFromDisk(ISTAT_CODE);
  if (fromDisk && hasOmiPayload(fromDisk)) return fromDisk;

  try {
    const live = await fetchLatestOmiMirror(ISTAT_CODE);
    if (live && hasOmiPayload(live)) return live;
  } catch (err) {
    console.warn("OMI mirror fetch failed", err);
  }
  return null;
}
