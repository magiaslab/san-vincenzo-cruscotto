import { inflateSync } from "node:zlib";

/**
 * Allerte meteo Regione Toscana (CFR/SIR) per la zona E2 — San Vincenzo.
 *
 * allertameteo.app espone solo i rischi DPC nazionali (idro/idraulico/temporali)
 * e può risultare verde mentre il bollettino regionale ha già giallo/arancione
 * (anche vento, mareggiate, neve, ghiaccio). Qui campioniamo le mappe ufficiali
 * SIR `risks_395/{YYYYMMDD}_{rischio}.png` nel centroid della zona E2.
 */

export const TOSCANA_ZONE_E2 = "E2" as const;
export const TOSCANA_ZONE_LABEL = "Etruria-Costa Nord" as const;

/** Centroid poligono E2 sulla mappa SIR 250×264 (usemap Regione Toscana). */
export const E2_SAMPLE = { x: 98, y: 152 } as const;

export const SIR_RISKS_BASE =
  "https://www.sir.toscana.it/supports/images/risks_395" as const;

export const TOSCANA_RISKS = [
  "idrogeologico",
  "idraulico",
  "temporali",
  "vento",
  "mareggiate",
  "neve",
  "ghiaccio",
] as const;

export type ToscanaRischio = (typeof TOSCANA_RISKS)[number];

export type AllertaColore = "verde" | "giallo" | "arancione" | "rosso";

const COLOR_RANK: Record<AllertaColore, number> = {
  verde: 1,
  giallo: 2,
  arancione: 3,
  rosso: 4,
};

const COLOR_LABEL: Record<AllertaColore, string> = {
  verde: "Nessuna Allerta",
  giallo: "Allerta Gialla",
  arancione: "Allerta Arancione",
  rosso: "Allerta Rossa",
};

const RISK_LABEL: Record<ToscanaRischio, string> = {
  idrogeologico: "Idrogeologico",
  idraulico: "Idraulico",
  temporali: "Temporali",
  vento: "Vento",
  mareggiate: "Mareggiate",
  neve: "Neve",
  ghiaccio: "Ghiaccio",
};

/** Palette ufficiale approssimata delle mappe SIR (fill zone). */
const PALETTE_TARGETS: { colore: AllertaColore; rgb: [number, number, number] }[] =
  [
    { colore: "verde", rgb: [153, 204, 51] },
    { colore: "verde", rgb: [102, 204, 51] },
    { colore: "giallo", rgb: [255, 255, 0] },
    { colore: "giallo", rgb: [255, 204, 0] },
    { colore: "giallo", rgb: [255, 170, 0] },
    { colore: "arancione", rgb: [255, 128, 0] },
    { colore: "arancione", rgb: [255, 102, 0] },
    { colore: "arancione", rgb: [204, 102, 0] },
    { colore: "rosso", rgb: [204, 0, 0] },
    { colore: "rosso", rgb: [255, 0, 0] },
    { colore: "rosso", rgb: [187, 34, 0] },
  ];

export function rankColore(colore: string): number {
  return COLOR_RANK[colore as AllertaColore] ?? 1;
}

export function maxColore(a: string, b: string): AllertaColore {
  return rankColore(a) >= rankColore(b)
    ? (a as AllertaColore)
    : (b as AllertaColore);
}

export function labelColore(colore: AllertaColore): string {
  return COLOR_LABEL[colore];
}

export function labelRischio(r: ToscanaRischio): string {
  return RISK_LABEL[r];
}

function dist2(
  a: [number, number, number],
  b: [number, number, number],
): number {
  const dr = a[0] - b[0];
  const dg = a[1] - b[1];
  const db = a[2] - b[2];
  return dr * dr + dg * dg + db * db;
}

/** Classifica RGB → livello allerta Toscana. */
export function classifyRgb(r: number, g: number, b: number): AllertaColore {
  // Sfondo / bordo grigio → trattati come assenza
  if (Math.abs(r - g) < 18 && Math.abs(g - b) < 18 && r > 160) {
    return "verde";
  }
  let best: AllertaColore = "verde";
  let bestD = Number.POSITIVE_INFINITY;
  for (const t of PALETTE_TARGETS) {
    const d = dist2([r, g, b], t.rgb);
    if (d < bestD) {
      bestD = d;
      best = t.colore;
    }
  }
  // Heuristica di fallback se lontano da tutte le palette
  if (bestD > 90 * 90) {
    if (g > r + 25 && g > b + 25) return "verde";
    if (r > 180 && g > 180 && b < 80) return "giallo";
    if (r > 180 && g >= 90 && g <= 180 && b < 80) return "arancione";
    if (r > 150 && g < 90 && b < 90) return "rosso";
    return "verde";
  }
  return best;
}

type PngIndexed = {
  width: number;
  height: number;
  palette: Buffer;
  pixels: Buffer;
};

function readPngChunk(buf: Buffer, offset: number) {
  const len = buf.readUInt32BE(offset);
  const type = buf.toString("ascii", offset + 4, offset + 8);
  const data = buf.subarray(offset + 8, offset + 8 + len);
  return { type, data, next: offset + 12 + len };
}

/** Decoder minimo PNG indexed 8-bit (colormap) — formato mappe SIR. */
export function decodeIndexedPng(buf: Buffer): PngIndexed {
  if (buf.length < 24 || buf.toString("ascii", 1, 4) !== "PNG") {
    throw new Error("PNG non valido");
  }
  let offset = 8;
  let width = 0;
  let height = 0;
  let bitDepth = 0;
  let colorType = -1;
  let palette: Buffer | null = null;
  const idats: Buffer[] = [];

  while (offset + 12 <= buf.length) {
    const chunk = readPngChunk(buf, offset);
    if (chunk.type === "IHDR") {
      width = chunk.data.readUInt32BE(0);
      height = chunk.data.readUInt32BE(4);
      bitDepth = chunk.data[8] ?? 0;
      colorType = chunk.data[9] ?? -1;
    } else if (chunk.type === "PLTE") {
      palette = Buffer.from(chunk.data);
    } else if (chunk.type === "IDAT") {
      idats.push(Buffer.from(chunk.data));
    } else if (chunk.type === "IEND") {
      break;
    }
    offset = chunk.next;
  }

  if (!width || !height || colorType !== 3 || bitDepth !== 8 || !palette) {
    throw new Error(
      `PNG non supportato (ct=${colorType} bd=${bitDepth} w=${width} h=${height})`,
    );
  }

  const inflated = inflateSync(Buffer.concat(idats));
  const stride = width;
  const pixels = Buffer.alloc(width * height);
  const prev = Buffer.alloc(stride);
  let src = 0;

  for (let y = 0; y < height; y++) {
    const filter = inflated[src++];
    if (filter === undefined) throw new Error("PNG truncato");
    const row = inflated.subarray(src, src + stride);
    src += stride;
    const out = pixels.subarray(y * stride, (y + 1) * stride);

    if (filter === 0) {
      row.copy(out);
    } else if (filter === 1) {
      for (let i = 0; i < stride; i++) {
        out[i] = ((row[i] ?? 0) + (i >= 1 ? (out[i - 1] ?? 0) : 0)) & 255;
      }
    } else if (filter === 2) {
      for (let i = 0; i < stride; i++) {
        out[i] = ((row[i] ?? 0) + (prev[i] ?? 0)) & 255;
      }
    } else if (filter === 3) {
      for (let i = 0; i < stride; i++) {
        const a = i >= 1 ? (out[i - 1] ?? 0) : 0;
        const b = prev[i] ?? 0;
        out[i] = ((row[i] ?? 0) + Math.floor((a + b) / 2)) & 255;
      }
    } else if (filter === 4) {
      for (let i = 0; i < stride; i++) {
        const a = i >= 1 ? (out[i - 1] ?? 0) : 0;
        const b = prev[i] ?? 0;
        const c = i >= 1 ? (prev[i - 1] ?? 0) : 0;
        const p = a + b - c;
        const pa = Math.abs(p - a);
        const pb = Math.abs(p - b);
        const pc = Math.abs(p - c);
        const pr = pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
        out[i] = ((row[i] ?? 0) + pr) & 255;
      }
    } else {
      throw new Error(`Filtro PNG non supportato: ${filter}`);
    }
    out.copy(prev);
  }

  return { width, height, palette, pixels };
}

export function sampleIndexedColor(
  png: PngIndexed,
  x: number,
  y: number,
): { r: number; g: number; b: number; colore: AllertaColore } {
  if (x < 0 || y < 0 || x >= png.width || y >= png.height) {
    throw new Error("Campione fuori immagine");
  }
  const idx = png.pixels[y * png.width + x] ?? 0;
  const r = png.palette[idx * 3] ?? 0;
  const g = png.palette[idx * 3 + 1] ?? 0;
  const b = png.palette[idx * 3 + 2] ?? 0;
  return { r, g, b, colore: classifyRgb(r, g, b) };
}

/** Data civile Europe/Rome come YYYYMMDD. */
export function romeYmd(date = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Rome",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const y = parts.find((p) => p.type === "year")?.value ?? "1970";
  const m = parts.find((p) => p.type === "month")?.value ?? "01";
  const d = parts.find((p) => p.type === "day")?.value ?? "01";
  return `${y}${m}${d}`;
}

export function addDaysYmd(ymd: string, days: number): string {
  const y = Number(ymd.slice(0, 4));
  const m = Number(ymd.slice(4, 6));
  const d = Number(ymd.slice(6, 8));
  // Usa mezzogiorno UTC per evitare ambiguità DST sul calendario civile
  const dt = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
  dt.setUTCDate(dt.getUTCDate() + days);
  const yy = dt.getUTCFullYear();
  const mm = String(dt.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(dt.getUTCDate()).padStart(2, "0");
  return `${yy}${mm}${dd}`;
}

export function formatYmdIt(ymd: string): string {
  return `${ymd.slice(6, 8)}/${ymd.slice(4, 6)}/${ymd.slice(0, 4)}`;
}

async function fetchRiskColor(
  ymd: string,
  rischio: ToscanaRischio,
): Promise<AllertaColore | null> {
  const url = `${SIR_RISKS_BASE}/${ymd}_${rischio}.png`;
  const res = await fetch(url, {
    headers: { Accept: "image/png,*/*" },
    next: { revalidate: 900 },
  });
  if (!res.ok) return null;
  const ab = await res.arrayBuffer();
  const png = decodeIndexedPng(Buffer.from(ab));
  return sampleIndexedColor(png, E2_SAMPLE.x, E2_SAMPLE.y).colore;
}

export type ToscanaDayAlert = {
  ymd: string;
  data: string;
  colore: AllertaColore;
  descrizione: string;
  livello: number;
  attiva: boolean;
  dettagli: Record<ToscanaRischio, AllertaColore>;
  rischi_attivi: ToscanaRischio[];
};

async function buildDay(ymd: string): Promise<ToscanaDayAlert> {
  const dettagli = {} as Record<ToscanaRischio, AllertaColore>;
  const rischi_attivi: ToscanaRischio[] = [];
  let top: AllertaColore = "verde";

  const results = await Promise.all(
    TOSCANA_RISKS.map(async (rischio) => {
      try {
        const colore = await fetchRiskColor(ymd, rischio);
        return { rischio, colore: colore ?? ("verde" as AllertaColore) };
      } catch (err) {
        console.warn(`Allerta Toscana ${ymd}/${rischio}`, err);
        return { rischio, colore: "verde" as AllertaColore };
      }
    }),
  );

  for (const { rischio, colore } of results) {
    dettagli[rischio] = colore;
    if (colore !== "verde") rischi_attivi.push(rischio);
    top = maxColore(top, colore);
  }

  return {
    ymd,
    data: formatYmdIt(ymd),
    colore: top,
    descrizione: labelColore(top),
    livello: COLOR_RANK[top],
    attiva: top !== "verde",
    dettagli,
    rischi_attivi,
  };
}

export type ToscanaAllerte = {
  zona: typeof TOSCANA_ZONE_E2;
  zona_label: typeof TOSCANA_ZONE_LABEL;
  oggi: ToscanaDayAlert;
  domani: ToscanaDayAlert;
  has_alert: boolean;
  fonte: string;
};

/** Scarica e interpreta le mappe SIR per oggi/domani (zona E2). */
export async function fetchAllerteToscanaE2(): Promise<ToscanaAllerte> {
  const oggiYmd = romeYmd();
  const domaniYmd = addDaysYmd(oggiYmd, 1);
  const [oggi, domani] = await Promise.all([
    buildDay(oggiYmd),
    buildDay(domaniYmd),
  ]);
  return {
    zona: TOSCANA_ZONE_E2,
    zona_label: TOSCANA_ZONE_LABEL,
    oggi,
    domani,
    has_alert: oggi.attiva || domani.attiva,
    fonte: SIR_RISKS_BASE,
  };
}

export function dettaglioLabel(colore: AllertaColore): string {
  if (colore === "verde") {
    return "Assenza di fenomeni significativi prevedibili / NESSUNA ALLERTA";
  }
  return labelColore(colore).toUpperCase();
}
