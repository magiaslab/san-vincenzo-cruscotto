import { unstable_cache } from "next/cache";
import {
  COMUNE_NOME,
  MIUR_CATALOG_BASE,
  MIUR_COMUNE_CATASTALE,
  MIUR_OPENDATA_URL,
} from "@/lib/constants";

export type MiurScuola = {
  codice: string;
  denominazione: string;
  tipologia: string;
  indirizzo: string;
  cap: string;
  email: string | null;
  pec: string | null;
  sito: string | null;
  istituto_riferimento: string;
  codice_istituto: string;
  sede_direttivo: boolean;
};

export type MiurAlunniAnno = {
  codice_scuola: string;
  ordine: string;
  anno_corso: string;
  alunni: number;
  italiani: number;
  non_italiani: number;
  non_italiani_ue: number;
  non_italiani_extra_ue: number;
  classi: number;
  maschi: number;
  femmine: number;
};

export type MiurScuolePayload = {
  comune: string;
  codice_catastale: string;
  anno_anagrafe: string | null;
  anno_alunni: string | null;
  kpi: {
    n_plessi: number;
    n_istituti: number;
    alunni_totale: number;
    classi_totale: number;
    alunni_italiani: number;
    alunni_non_italiani: number;
    pct_non_italiani: number | null;
    infanzia_bambini: number;
    infanzia_classi: number;
  };
  scuole: MiurScuola[];
  per_ordine: Array<{
    ordine: string;
    alunni: number;
    classi: number;
    non_italiani: number;
  }>;
  alunni_per_anno: MiurAlunniAnno[];
  fonte: {
    nome: string;
    url: string;
    licenza: string;
    dataset: Array<{ id: string; label: string; file: string | null }>;
  };
  fetched_at: string;
};

type CsvRow = Record<string, string>;

function formatAnnoScolastico(raw: string | null | undefined): string | null {
  if (!raw || raw.length < 6) return raw || null;
  // es. 202526 → 2025/26
  return `${raw.slice(0, 4)}/${raw.slice(4, 6)}`;
}

function toInt(v: string | undefined): number {
  const n = Number(String(v ?? "").replace(",", ".").trim());
  return Number.isFinite(n) ? n : 0;
}

function cleanName(s: string): string {
  return s.replace(/^"+|"+$/g, "").trim();
}

async function latestCsvFile(
  area: string,
  datasetId: string,
  prefix: string,
): Promise<string | null> {
  const url = `${MIUR_CATALOG_BASE}/leaf?area=${encodeURIComponent(area)}&datasetId=${encodeURIComponent(datasetId)}`;
  const res = await fetch(url, {
    headers: { Accept: "text/html" },
    next: { revalidate: 86400 },
  });
  if (!res.ok) return null;
  const html = await res.text();
  const re = new RegExp(`href="(${prefix}[0-9]+\\.csv)"`, "gi");
  const files = [...html.matchAll(re)].map((m) => m[1]);
  // Il catalogo elenca le distribuzioni dalla più recente.
  return files[0] ?? null;
}

async function* iterateCsv(url: string): AsyncGenerator<CsvRow> {
  const res = await fetch(url, {
    headers: { Accept: "text/csv,*/*" },
    next: { revalidate: 86400 },
  });
  if (!res.ok || !res.body) {
    throw new Error(`Download MIUR fallito: ${res.status} ${url}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder("utf-8");
  let buffer = "";
  let headers: string[] | null = null;

  const parseLine = (line: string): string[] => {
    const out: string[] = [];
    let cur = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (ch === "," && !inQuotes) {
        out.push(cur);
        cur = "";
      } else {
        cur += ch;
      }
    }
    out.push(cur);
    return out;
  };

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    let nl: number;
    while ((nl = buffer.indexOf("\n")) >= 0) {
      let line = buffer.slice(0, nl);
      buffer = buffer.slice(nl + 1);
      if (line.endsWith("\r")) line = line.slice(0, -1);
      if (!line) continue;
      const cells = parseLine(line);
      if (!headers) {
        headers = cells;
        continue;
      }
      const row: CsvRow = {};
      headers.forEach((h, i) => {
        row[h] = cells[i] ?? "";
      });
      yield row;
    }
  }
  if (buffer.trim() && headers) {
    const cells = parseLine(buffer.replace(/\r$/, ""));
    const row: CsvRow = {};
    headers.forEach((h, i) => {
      row[h] = cells[i] ?? "";
    });
    yield row;
  }
}

async function collectAnagrafe(file: string | null): Promise<{
  scuole: MiurScuola[];
  codes: Set<string>;
  anno: string | null;
}> {
  if (!file) return { scuole: [], codes: new Set(), anno: null };
  const url = `${MIUR_CATALOG_BASE}/${file}`;
  const scuole: MiurScuola[] = [];
  const codes = new Set<string>();
  let anno: string | null = null;

  for await (const row of iterateCsv(url)) {
    if (row.CODICECOMUNESCUOLA !== MIUR_COMUNE_CATASTALE) continue;
    anno = row.ANNOSCOLASTICO || anno;
    const codice = row.CODICESCUOLA;
    if (!codice) continue;
    codes.add(codice);
    if (row.CODICEISTITUTORIFERIMENTO) codes.add(row.CODICEISTITUTORIFERIMENTO);
    scuole.push({
      codice,
      denominazione: cleanName(row.DENOMINAZIONESCUOLA || ""),
      tipologia: row.DESCRIZIONETIPOLOGIAGRADOISTRUZIONESCUOLA || "",
      indirizzo: row.INDIRIZZOSCUOLA || "",
      cap: row.CAPSCUOLA || "",
      email: row.INDIRIZZOEMAILSCUOLA || null,
      pec: row.INDIRIZZOPECSCUOLA || null,
      sito: row.SITOWEBSCUOLA || null,
      istituto_riferimento: cleanName(row.DENOMINAZIONEISTITUTORIFERIMENTO || ""),
      codice_istituto: row.CODICEISTITUTORIFERIMENTO || "",
      sede_direttivo: (row.INDICAZIONESEDEDIRETTIVO || "").toUpperCase() === "SI",
    });
  }

  scuole.sort((a, b) => a.tipologia.localeCompare(b.tipologia, "it"));
  return { scuole, codes, anno };
}

async function collectAlunni(
  codes: Set<string>,
  files: {
    cit: string | null;
    classi: string | null;
    infanzia: string | null;
  },
): Promise<{
  rows: MiurAlunniAnno[];
  anno: string | null;
  infanzia_bambini: number;
  infanzia_classi: number;
}> {
  const byKey = new Map<string, MiurAlunniAnno>();
  let anno: string | null = null;

  if (files.cit) {
    for await (const row of iterateCsv(`${MIUR_CATALOG_BASE}/${files.cit}`)) {
      if (!codes.has(row.CODICESCUOLA)) continue;
      anno = row.ANNOSCOLASTICO || anno;
      const key = `${row.CODICESCUOLA}|${row.ANNOCORSO}`;
      byKey.set(key, {
        codice_scuola: row.CODICESCUOLA,
        ordine: row.ORDINESCUOLA || "",
        anno_corso: row.ANNOCORSO || "",
        alunni: toInt(row.ALUNNI),
        italiani: toInt(row.ALUNNICITTADINANZAITALIANA),
        non_italiani: toInt(row.ALUNNICITTADINANZANONITALIANA),
        non_italiani_ue: toInt(row.ALUNNICITTADINANZANONITALIANAPAESIUE),
        non_italiani_extra_ue: toInt(
          row.ALUNNICITTADINANZANONITALIANAPAESINONUE,
        ),
        classi: 0,
        maschi: 0,
        femmine: 0,
      });
    }
  }

  if (files.classi) {
    for await (const row of iterateCsv(`${MIUR_CATALOG_BASE}/${files.classi}`)) {
      if (!codes.has(row.CODICESCUOLA)) continue;
      anno = row.ANNOSCOLASTICO || anno;
      const key = `${row.CODICESCUOLA}|${row.ANNOCORSOCLASSE}`;
      const prev = byKey.get(key) ?? {
        codice_scuola: row.CODICESCUOLA,
        ordine: row.ORDINESCUOLA || "",
        anno_corso: row.ANNOCORSOCLASSE || "",
        alunni: toInt(row.ALUNNIMASCHI) + toInt(row.ALUNNIFEMMINE),
        italiani: 0,
        non_italiani: 0,
        non_italiani_ue: 0,
        non_italiani_extra_ue: 0,
        classi: 0,
        maschi: 0,
        femmine: 0,
      };
      prev.classi = toInt(row.CLASSI);
      prev.maschi = toInt(row.ALUNNIMASCHI);
      prev.femmine = toInt(row.ALUNNIFEMMINE);
      if (!prev.alunni) {
        prev.alunni = prev.maschi + prev.femmine;
      }
      byKey.set(key, prev);
    }
  }

  let infanzia_bambini = 0;
  let infanzia_classi = 0;
  if (files.infanzia) {
    for await (const row of iterateCsv(
      `${MIUR_CATALOG_BASE}/${files.infanzia}`,
    )) {
      if (!codes.has(row.CODICESCUOLA)) continue;
      anno = row.ANNOSCOLASTICO || anno;
      const m = toInt(row.BAMBINIMASCHI);
      const f = toInt(row.BAMBINIFEMMINE);
      const classi = toInt(row.CLASSI);
      infanzia_bambini += m + f;
      infanzia_classi += classi;
      const key = `${row.CODICESCUOLA}|INF`;
      byKey.set(key, {
        codice_scuola: row.CODICESCUOLA,
        ordine: "SCUOLA INFANZIA",
        anno_corso: "—",
        alunni: m + f,
        italiani: 0,
        non_italiani: 0,
        non_italiani_ue: 0,
        non_italiani_extra_ue: 0,
        classi,
        maschi: m,
        femmine: f,
      });
    }
  }

  const rows = [...byKey.values()].sort((a, b) => {
    const o = a.ordine.localeCompare(b.ordine, "it");
    if (o !== 0) return o;
    return String(a.anno_corso).localeCompare(String(b.anno_corso), "it");
  });

  return { rows, anno, infanzia_bambini, infanzia_classi };
}

export async function buildMiurScuole(): Promise<MiurScuolePayload> {
  const [anagFile, citFile, claFile, infFile] = await Promise.all([
    latestCsvFile("Scuole", "DS0400SCUANAGRAFESTAT", "SCUANAGRAFESTAT"),
    latestCsvFile("Studenti", "DS0050ALUITASTRACITSTA", "ALUITASTRACITSTA"),
    latestCsvFile("Studenti", "DS0030ALUCORSOINDCLASTA", "ALUCORSOINDCLASTA"),
    latestCsvFile("Studenti", "DS1114INFANZIACLASTA", "INFANZIACLASTA"),
  ]);

  const { scuole, codes, anno: annoAnag } = await collectAnagrafe(anagFile);
  const {
    rows: alunni_per_anno,
    anno: annoAlunni,
    infanzia_bambini,
    infanzia_classi,
  } = await collectAlunni(codes, {
    cit: citFile,
    classi: claFile,
    infanzia: infFile,
  });

  const alunni_totale = alunni_per_anno.reduce((s, r) => s + r.alunni, 0);
  const classi_totale = alunni_per_anno.reduce((s, r) => s + r.classi, 0);
  const alunni_italiani = alunni_per_anno.reduce((s, r) => s + r.italiani, 0);
  const alunni_non_italiani = alunni_per_anno.reduce(
    (s, r) => s + r.non_italiani,
    0,
  );
  const baseCit = alunni_italiani + alunni_non_italiani;

  const perOrdineMap = new Map<
    string,
    { ordine: string; alunni: number; classi: number; non_italiani: number }
  >();
  for (const r of alunni_per_anno) {
    const cur = perOrdineMap.get(r.ordine) ?? {
      ordine: r.ordine,
      alunni: 0,
      classi: 0,
      non_italiani: 0,
    };
    cur.alunni += r.alunni;
    cur.classi += r.classi;
    cur.non_italiani += r.non_italiani;
    perOrdineMap.set(r.ordine, cur);
  }

  const istituti = new Set(
    scuole.map((s) => s.codice_istituto).filter(Boolean),
  );

  return {
    comune: COMUNE_NOME,
    codice_catastale: MIUR_COMUNE_CATASTALE,
    anno_anagrafe: formatAnnoScolastico(annoAnag),
    anno_alunni: formatAnnoScolastico(annoAlunni),
    kpi: {
      n_plessi: scuole.length,
      n_istituti: istituti.size,
      alunni_totale,
      classi_totale,
      alunni_italiani,
      alunni_non_italiani,
      pct_non_italiani: baseCit > 0 ? (alunni_non_italiani / baseCit) * 100 : null,
      infanzia_bambini,
      infanzia_classi,
    },
    scuole,
    per_ordine: [...perOrdineMap.values()],
    alunni_per_anno,
    fonte: {
      nome: "Portale Unico dei Dati della Scuola (MIUR)",
      url: MIUR_OPENDATA_URL,
      licenza: "IODL 2.0",
      dataset: [
        {
          id: "DS0400SCUANAGRAFESTAT",
          label: "Anagrafe scuole statali",
          file: anagFile,
        },
        {
          id: "DS0050ALUITASTRACITSTA",
          label: "Alunni per cittadinanza",
          file: citFile,
        },
        {
          id: "DS0030ALUCORSOINDCLASTA",
          label: "Alunni e classi per anno di corso",
          file: claFile,
        },
        {
          id: "DS1114INFANZIACLASTA",
          label: "Infanzia: bambini e classi",
          file: infFile,
        },
      ],
    },
    fetched_at: new Date().toISOString(),
  };
}

export const getCachedMiurScuole = unstable_cache(
  async () => buildMiurScuole(),
  ["miur-scuole-san-vincenzo-i390"],
  { revalidate: 86400, tags: ["miur-scuole"] },
);
