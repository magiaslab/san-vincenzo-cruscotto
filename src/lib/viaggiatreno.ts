/**
 * Client non ufficiale verso l’API pubblica ViaggiaTreno (RFI / Trenitalia).
 * Usata solo server-side per arrivi/partenze live e ritardi a S.Vincenzo.
 */

export const VIAGGIATRENO_BASE =
  "https://www.viaggiatreno.it/infomobilita/resteasy/viaggiatreno" as const;

/** Codice stazione FS San Vincenzo (coincide con prefisso GTFS S06030_1). */
export const FS_STAZIONE_SAN_VINCENZO = "S06030" as const;

export const VIAGGIATRENO_ATTRIBUTION_URL =
  "https://www.viaggiatreno.it/" as const;

export type TreniBoardKind = "partenze" | "arrivi";

export type TrenoBoardRow = {
  kind: TreniBoardKind;
  numero: string;
  categoria: string | null;
  /** Destinazione (partenze) o origine (arrivi). */
  verso: string | null;
  orario: string | null;
  ritardo_min: number | null;
  binario: string | null;
  soppresso: boolean;
  non_partito?: boolean;
  arrivato?: boolean;
};

type VtRaw = Record<string, unknown>;

/** Formato data atteso da ViaggiaTreno (simile a Date.toString() in fuso Roma). */
export function formatViaggiaTrenoDate(date = new Date()): string {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      timeZone: "Europe/Rome",
      weekday: "short",
      month: "short",
      day: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
      timeZoneName: "shortOffset",
    })
      .formatToParts(date)
      .filter((p) => p.type !== "literal")
      .map((p) => [p.type, p.value]),
  ) as Record<string, string>;

  let off = parts.timeZoneName || "GMT+2";
  // GMT+2 → GMT+0200
  const m = off.match(/^GMT([+-])(\d{1,2})(?::?(\d{2}))?$/i);
  if (m) {
    off = `GMT${m[1]}${m[2].padStart(2, "0")}${(m[3] ?? "00").padStart(2, "0")}`;
  }

  const tzName =
    off.includes("+01") || off.endsWith("+0100")
      ? "Central European Time"
      : "Central European Summer Time";

  return `${parts.weekday} ${parts.month} ${parts.day} ${parts.year} ${parts.hour}:${parts.minute}:${parts.second} ${off} (${tzName})`;
}

function asString(v: unknown): string | null {
  if (v == null) return null;
  const s = String(v).trim();
  return s.length ? s : null;
}

function asNumber(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim() && Number.isFinite(Number(v))) {
    return Number(v);
  }
  return null;
}

function binarioFrom(raw: VtRaw, kind: TreniBoardKind): string | null {
  if (kind === "partenze") {
    return (
      asString(raw.binarioEffettivoPartenzaDescrizione) ||
      asString(raw.binarioProgrammatoPartenzaDescrizione)
    );
  }
  return (
    asString(raw.binarioEffettivoArrivoDescrizione) ||
    asString(raw.binarioProgrammatoArrivoDescrizione)
  );
}

function mapRow(raw: VtRaw, kind: TreniBoardKind): TrenoBoardRow | null {
  const numero = asString(raw.numeroTreno);
  if (!numero) return null;
  const categoria = asString(raw.categoria) || asString(raw.categoriaDescrizione);
  const verso =
    kind === "partenze"
      ? asString(raw.destinazione)
      : asString(raw.origine);
  const orario =
    kind === "partenze"
      ? asString(raw.compOrarioPartenza) || asString(raw.compOrarioPartenzaZero)
      : asString(raw.compOrarioArrivo) || asString(raw.compOrarioArrivoZero);

  const provvedimento = asNumber(raw.provvedimento) ?? 0;
  const tipoTreno = asString(raw.tipoTreno);
  const soppresso =
    tipoTreno === "ST" ||
    tipoTreno === "SF" ||
    tipoTreno === "SI" ||
    provvedimento === 1;

  return {
    kind,
    numero,
    categoria,
    verso,
    orario,
    ritardo_min: asNumber(raw.ritardo),
    binario: binarioFrom(raw, kind),
    soppresso,
    non_partito: Boolean(raw.nonPartito),
    arrivato: Boolean(raw.arrivato),
  };
}

async function fetchBoard(
  kind: TreniBoardKind,
  stationId: string,
  when: Date,
): Promise<TrenoBoardRow[]> {
  const whenParam = encodeURIComponent(formatViaggiaTrenoDate(when));
  const url = `${VIAGGIATRENO_BASE}/${kind}/${encodeURIComponent(stationId)}/${whenParam}`;
  const res = await fetch(url, {
    headers: {
      Accept: "application/json",
      "User-Agent": "cruscotto-san-vincenzo/1.0 (+https://www.cruscottosanvincenzo.it)",
    },
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`ViaggiaTreno ${kind} HTTP ${res.status}`);
  }
  const raw = (await res.json()) as unknown;
  if (!Array.isArray(raw)) return [];
  return raw
    .map((row) => mapRow(row as VtRaw, kind))
    .filter((r): r is TrenoBoardRow => r != null);
}

export async function fetchTreniLive(
  stationId: string = FS_STAZIONE_SAN_VINCENZO,
  when: Date = new Date(),
): Promise<{
  partenze: TrenoBoardRow[];
  arrivi: TrenoBoardRow[];
  fetched_at: string;
  station_id: string;
}> {
  const [partenze, arrivi] = await Promise.all([
    fetchBoard("partenze", stationId, when),
    fetchBoard("arrivi", stationId, when),
  ]);
  return {
    partenze,
    arrivi,
    fetched_at: new Date().toISOString(),
    station_id: stationId,
  };
}
