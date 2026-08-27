/**
 * Client MCP verso DoveVannoINostriSoldi (read-only).
 * Non proxya Cruscotto Italia AgID: dataset distinti, provenance separata.
 */
import { COMUNE } from "@/lib/comune-config";
import {
  DVNS_MCP_ENDPOINT,
  DVNS_SITE_URL,
  HTTP_USER_AGENT,
  ISTAT_CODE,
} from "@/lib/constants";

export const DVNS_FONTE = "DoveVannoINostriSoldi";
export const DVNS_MCP_URL = DVNS_MCP_ENDPOINT;

export type IrpefMisura = {
  coverage: string;
  frequency: number | null;
  euro: number | null;
};

export type IrpefComunale = {
  anno_imposta: number;
  pubblicato: string | null;
  contribuenti: number | null;
  reddito_complessivo: IrpefMisura | null;
  reddito_imponibile: IrpefMisura | null;
  imposta_netta_dichiarata: IrpefMisura | null;
  addizionale_regionale: IrpefMisura | null;
  addizionale_comunale: IrpefMisura | null;
  reddito_medio_eur: number | null;
};

export type OpenCivitasFabbisogni = {
  anno: number;
  spesa_storica_eur: number | null;
  spesa_standard_eur: number | null;
  differenza_eur: number | null;
  spesa_storica_ab_eur: number | null;
  spesa_standard_ab_eur: number | null;
  differenza_ab_eur: number | null;
  differenza_pct: number | null;
  livello_spesa: number | null;
  livello_servizi: number | null;
  caveat: string;
};

export type SiopeRegioneDvns = {
  regione: string;
  anno: number | null;
  fino_a_mese: number | null;
  per_abitante_eur: number | null;
  totale_eur: number | null;
  comuni: number | null;
};

export type DvnsFinanzaData = {
  istat: string;
  comune: string;
  irpef: IrpefComunale | null;
  opencivitas: OpenCivitasFabbisogni | null;
  siope_regione: SiopeRegioneDvns | null;
};

type Json = Record<string, unknown>;

function asObj(v: unknown): Json {
  return v && typeof v === "object" && !Array.isArray(v) ? (v as Json) : {};
}

function asNum(v: unknown): number | null {
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}

function asStr(v: unknown): string | null {
  return typeof v === "string" && v.trim() ? v.trim() : null;
}

function centsToEuro(v: unknown): number | null {
  const n = asNum(v);
  return n == null ? null : n / 100;
}

function parseMisura(v: unknown): IrpefMisura | null {
  const o = asObj(v);
  if (!("amountCents" in o) && !("frequency" in o)) return null;
  return {
    coverage: asStr(o.coverage) ?? "",
    frequency: asNum(o.frequency),
    euro: centsToEuro(o.amountCents),
  };
}

function parseSseOrJson(raw: string): unknown {
  const trimmed = raw.trim();
  if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
    return JSON.parse(trimmed);
  }
  for (const line of raw.split("\n")) {
    if (line.startsWith("data: ")) {
      return JSON.parse(line.slice(6));
    }
  }
  throw new Error("Risposta MCP DVNS non JSON");
}

function extractToolJson(payload: unknown): unknown {
  const root = asObj(payload);
  if (root.error && typeof root.error === "object") {
    const err = asObj(root.error);
    throw new Error(asStr(err.message) ?? "Errore MCP DVNS");
  }
  const result = asObj(root.result);
  const content = Array.isArray(result.content) ? result.content : [];
  const text = content
    .filter((c) => asObj(c).type === "text" && typeof asObj(c).text === "string")
    .map((c) => String(asObj(c).text))
    .join("");
  if (!text) throw new Error("Risposta MCP DVNS vuota");
  return JSON.parse(text);
}

async function queryDataset(
  args: Record<string, unknown>,
): Promise<unknown> {
  const res = await fetch(DVNS_MCP_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json, text/event-stream",
      "User-Agent": HTTP_USER_AGENT,
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "tools/call",
      params: { name: "query_dataset", arguments: args },
    }),
    next: { revalidate: 86400 },
  });
  if (!res.ok) throw new Error(`DVNS MCP HTTP ${res.status}`);
  const raw = await res.text();
  return extractToolJson(parseSseOrJson(raw));
}

function unwrapData(payload: unknown): Json {
  const root = asObj(payload);
  if (root.ok === false) {
    throw new Error(asStr(root.error) ?? asStr(root.message) ?? "query_dataset ko");
  }
  return asObj(root.data ?? root);
}

function parseIrpef(payload: unknown, istat: string): IrpefComunale | null {
  const data = unwrapData(payload);
  const period = asObj(data.period);
  const rows = Array.isArray(data.data) ? data.data : [];
  const want = istat.replace(/\D/g, "");
  const row = rows
    .map(asObj)
    .find((r) => {
      const code = asStr(asObj(r.territory).code)?.replace(/\D/g, "") ?? "";
      return code === want || code.endsWith(want);
    });
  if (!row) return null;
  const measures = asObj(row.measures);
  const complessivo = parseMisura(measures.comprehensiveIncome);
  const contribuenti = asNum(row.taxpayers);
  const reddito_medio_eur =
    complessivo?.euro != null && contribuenti && contribuenti > 0
      ? complessivo.euro / contribuenti
      : null;
  return {
    anno_imposta: asNum(period.taxYear) ?? 2024,
    pubblicato: asStr(period.publishedAt),
    contribuenti,
    reddito_complessivo: complessivo,
    reddito_imponibile: parseMisura(measures.taxableIncome),
    imposta_netta_dichiarata: parseMisura(measures.netTaxDeclared),
    addizionale_regionale: parseMisura(measures.regionalSurtaxDue),
    addizionale_comunale: parseMisura(measures.municipalSurtaxDue),
    reddito_medio_eur,
  };
}

function parseOpenCivitas(payload: unknown): OpenCivitasFabbisogni | null {
  const data = unwrapData(payload);
  const rows = Array.isArray(data.data) ? data.data : [];
  const row = asObj(rows[0]);
  if (!asStr(row.istatCode) && asNum(row.historicalSpendingCents) == null) {
    return null;
  }
  const method = asObj(data.methodology);
  const bp = asNum(row.differenceBasisPoints);
  return {
    anno: asNum(data.referenceYear) ?? 2022,
    spesa_storica_eur: centsToEuro(row.historicalSpendingCents),
    spesa_standard_eur: centsToEuro(row.standardSpendingCents),
    differenza_eur: centsToEuro(row.differenceCents),
    spesa_storica_ab_eur: centsToEuro(row.historicalPerCapitaCents),
    spesa_standard_ab_eur: centsToEuro(row.standardPerCapitaCents),
    differenza_ab_eur: centsToEuro(row.differencePerCapitaCents),
    differenza_pct: bp == null ? null : bp / 100,
    livello_spesa: asNum(row.spendingLevel),
    livello_servizi: asNum(row.serviceLevel),
    caveat:
      asStr(method.differenceMeaning) ??
      "Differenza tra spesa storica e spesa standard. Non è una misura di spreco.",
  };
}

function parseSiopeRegione(payload: unknown, regione: string): SiopeRegioneDvns | null {
  const data = unwrapData(payload);
  const regions = Array.isArray(data.regions) ? data.regions : [];
  const row =
    regions.map(asObj).find((r) => {
      const name = asStr(r.region) ?? "";
      return name.toLowerCase() === regione.toLowerCase();
    }) ?? asObj(regions[0]);
  const name = asStr(row.region);
  if (!name) return null;
  return {
    regione: name,
    anno: asNum(data.year),
    fino_a_mese: asNum(data.latestMonth),
    per_abitante_eur: asNum(row.perCapita),
    totale_eur: asNum(row.value),
    comuni: asNum(row.municipalities),
  };
}

export function hasDvnsPayload(data: DvnsFinanzaData | null): boolean {
  if (!data) return false;
  return Boolean(data.irpef || data.opencivitas || data.siope_regione);
}

export async function buildDvnsFinanzaData(): Promise<DvnsFinanzaData> {
  const istat = ISTAT_CODE;
  const regione = COMUNE.regione;
  const [irpefRaw, civitasRaw, siopeRaw] = await Promise.allSettled([
    queryDataset({
      dataset: "mef_irpef_comunale",
      code: istat,
      level: "municipality",
      limit: 5,
    }),
    queryDataset({
      dataset: "opencivitas_fabbisogni",
      code: istat,
      limit: 5,
    }),
    regione
      ? queryDataset({
          dataset: "siope_comuni",
          region: regione,
        })
      : Promise.resolve(null),
  ]);

  let irpef: IrpefComunale | null = null;
  let opencivitas: OpenCivitasFabbisogni | null = null;
  let siope_regione: SiopeRegioneDvns | null = null;

  if (irpefRaw.status === "fulfilled") {
    try {
      irpef = parseIrpef(irpefRaw.value, istat);
    } catch (err) {
      console.warn("DVNS IRPEF parse", err);
    }
  } else {
    console.warn("DVNS IRPEF fetch", irpefRaw.reason);
  }
  if (civitasRaw.status === "fulfilled") {
    try {
      opencivitas = parseOpenCivitas(civitasRaw.value);
    } catch (err) {
      console.warn("DVNS OpenCivitas parse", err);
    }
  } else {
    console.warn("DVNS OpenCivitas fetch", civitasRaw.reason);
  }
  if (siopeRaw.status === "fulfilled" && siopeRaw.value) {
    try {
      siope_regione = parseSiopeRegione(siopeRaw.value, regione);
    } catch (err) {
      console.warn("DVNS SIOPE regione parse", err);
    }
  }

  return {
    istat,
    comune: COMUNE.nome,
    irpef,
    opencivitas,
    siope_regione,
  };
}

export { DVNS_SITE_URL };
