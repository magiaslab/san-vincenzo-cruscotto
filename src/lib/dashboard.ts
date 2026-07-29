import { unstable_cache } from "next/cache";
import { fetchComuneDashboard, fetchComuneKpi } from "./mcp";

export const getCachedKpi = unstable_cache(
  async () => fetchComuneKpi(),
  ["comune-kpi-049018"],
  { revalidate: 86400, tags: ["kpi"] },
);

export const getCachedDashboard = unstable_cache(
  async () => fetchComuneDashboard(),
  ["comune-dashboard-049018"],
  { revalidate: 86400, tags: ["dashboard"] },
);

/** Sezioni estratte da comune_dashboard via query `sezioni`. */
export const SECTION_ALIASES: Record<string, string[]> = {
  siope: ["siope"],
  anac: ["anac"],
  bdap: ["opere", "bdap_kpi"],
  opere: ["opere", "bdap_kpi"],
  pnrr: ["pnrr"],
  asia: ["asia"],
  imprese: ["asia"],
  ateco: ["asia"],
  civici: ["anncsu"],
  anncsu: ["anncsu"],
  ev: ["pun"],
  pun: ["pun"],
  beni: ["beni_culturali"],
  beni_culturali: ["beni_culturali"],
  pendolarismo: ["pendolarismo"],
  turismo: ["turismo"],
  territorio: ["territorio"],
  morfologia: ["morfologia"],
  meteo: ["meteo"],
  veicoli: ["veicoli"],
  banda: ["agcom_bbmap"],
  agcom: ["agcom_bbmap"],
  sanita: ["sanita_mds"],
  runts: ["runts"],
  carburanti: ["carburanti"],
  demografia: ["demografia", "profilo"],
  profilo: ["profilo", "demografia"],
  redditi: ["redditi"],
  scuole: ["scuole"],
  censimento: ["censimento"],
  patrimonio: ["immobili_pa"],
  immobili: ["immobili_pa"],
  panoramica: [
    "demografia",
    "profilo",
    "censimento",
    "scuole",
    "redditi",
    "turismo",
    "territorio",
    "pnrr",
    "siope",
    "asia",
  ],
};

export function extractSections(
  dashboard: Record<string, unknown>,
  sezioni: string[],
): Record<string, unknown> {
  const out: Record<string, unknown> = {
    _generated_at: dashboard._generated_at,
    _etl_version: dashboard._etl_version,
    anagrafica: dashboard.anagrafica,
  };

  const keys = new Set<string>();
  for (const s of sezioni) {
    const mapped = SECTION_ALIASES[s.toLowerCase()] ?? [s];
    mapped.forEach((k) => keys.add(k));
  }

  for (const key of keys) {
    if (key in dashboard) {
      out[key] = slimSection(key, dashboard[key]);
    }
  }

  return out;
}

/** Riduce payload pesanti (civici, voci SIOPE grezze, piramide completa). */
function slimSection(key: string, value: unknown): unknown {
  if (key === "anncsu" && value && typeof value === "object") {
    const ann = value as {
      kpi?: unknown;
      punti?: unknown[];
      _snapshot_date?: string;
      _source?: string;
    };
    return {
      kpi: ann.kpi,
      _snapshot_date: ann._snapshot_date,
      _source: ann._source,
      n_punti_disponibili: Array.isArray(ann.punti) ? ann.punti.length : 0,
    };
  }

  if (key === "siope" && value && typeof value === "object") {
    return buildSiopeSeries(value as SiopeRaw);
  }

  if (key === "asia" && value && typeof value === "object") {
    const asia = value as {
      kpi?: unknown;
      serie_storica?: unknown;
      _latest_year?: number;
      _source?: string;
      ateco_dettaglio?: Record<string, unknown>;
    };
    const year = String(asia._latest_year ?? "");
    const detail = asia.ateco_dettaglio?.[year];
    return {
      kpi: asia.kpi,
      serie_storica: asia.serie_storica,
      _latest_year: asia._latest_year,
      _source: asia._source,
      top_ateco: summarizeAteco(detail),
    };
  }

  if (key === "demografia" && value && typeof value === "object") {
    const d = value as Record<string, unknown>;
    const piramide = Array.isArray(d.piramide)
      ? (d.piramide as Array<{ eta: number; m: number; f: number; tot: number }>)
      : [];
    // Aggrega piramide in fasce quinquennali per ridurre payload
    const fasce5: Array<{ label: string; m: number; f: number; tot: number }> = [];
    for (let start = 0; start <= 95; start += 5) {
      const end = start + 4;
      const slice = piramide.filter((p) => p.eta >= start && p.eta <= end);
      if (!slice.length) continue;
      fasce5.push({
        label: start >= 95 ? "95+" : `${start}-${end}`,
        m: slice.reduce((a, p) => a + (p.m ?? 0), 0),
        f: slice.reduce((a, p) => a + (p.f ?? 0), 0),
        tot: slice.reduce((a, p) => a + (p.tot ?? 0), 0),
      });
    }
    return {
      ...d,
      piramide_fasce: fasce5,
      piramide: undefined,
    };
  }

  if (key === "redditi" && value && typeof value === "object") {
    const r = value as {
      trend?: unknown;
      anni?: Record<string, Record<string, unknown>>;
      anni_disponibili?: number[];
      fonte?: string;
      last_update?: string;
    };
    const years = (r.anni_disponibili ?? Object.keys(r.anni ?? {}).map(Number)).sort(
      (a, b) => b - a,
    );
    const latestYear = years[0];
    const latest = latestYear != null ? r.anni?.[String(latestYear)] : null;
    return {
      trend: r.trend,
      anni_disponibili: years,
      fonte: r.fonte,
      last_update: r.last_update,
      latest_year: latestYear,
      latest: latest
        ? {
            contribuenti: latest.contribuenti,
            reddito_complessivo: latest.reddito_complessivo,
            imposta_netta: latest.imposta_netta,
            addizionale_comunale: latest.addizionale_comunale,
            fasce: latest.fasce,
            tipologie: latest.tipologie,
          }
        : null,
    };
  }

  if (key === "immobili_pa" && value && typeof value === "object") {
    const im = value as {
      kpi?: unknown;
      anno_rilevazione?: number;
      _source?: string;
      punti?: unknown[];
    };
    return {
      kpi: im.kpi,
      anno_rilevazione: im.anno_rilevazione,
      _source: im._source,
      n_punti: Array.isArray(im.punti) ? im.punti.length : 0,
    };
  }

  if (key === "carburanti" && value && typeof value === "object") {
    const c = value as {
      kpi?: unknown;
      punti?: Array<Record<string, unknown>>;
      _source?: string;
      _data_last_modified?: string;
    };
    return {
      kpi: c.kpi,
      _source: c._source,
      _data_last_modified: c._data_last_modified,
      punti: (c.punti ?? []).map((p) => ({
        name: p.name,
        brand: p.brand,
        tipo: p.tipo,
        indirizzo: p.indirizzo,
        lat: p.lat,
        lon: p.lon,
        prezzi: p.prezzi,
        ultimo_aggiornamento: p.ultimo_aggiornamento,
      })),
    };
  }

  if (key === "censimento" && value && typeof value === "object") {
    const c = value as Record<string, unknown>;
    return {
      kpi_comune: c.kpi_comune,
      distribuzioni_comune: c.distribuzioni_comune,
      _anno_rilevazione: c._anno_rilevazione,
      _source: c._source,
    };
  }

  if (key === "pnrr" && value && typeof value === "object") {
    const p = value as {
      kpi?: unknown;
      per_missione?: unknown;
      progetti?: Array<Record<string, unknown>>;
      fonte?: string;
      data_estrazione?: string;
    };
    return {
      kpi: p.kpi,
      per_missione: p.per_missione,
      fonte: p.fonte,
      data_estrazione: p.data_estrazione,
      progetti: (p.progetti ?? []).map((pr) => ({
        cup: pr.cup,
        titolo: pr.titolo,
        missione: pr.missione,
        missione_descrizione: pr.missione_descrizione,
        finanziamento_pnrr: pr.finanziamento_pnrr,
        finanziamento_totale: pr.finanziamento_totale,
        stato_avanzamento: pr.stato_avanzamento,
        fase_iter: pr.fase_iter,
        data_fine_effettiva: pr.data_fine_effettiva,
        data_fine_prevista: pr.data_fine_prevista,
      })),
    };
  }

  if (key === "opere" && value && typeof value === "object") {
    const o = value as {
      n_progetti?: number;
      progetti?: Array<Record<string, unknown>>;
      _source?: string;
    };
    return {
      n_progetti: o.n_progetti,
      _source: o._source,
      progetti: (o.progetti ?? []).map((pr) => ({
        cup: pr.cup,
        descrizione: String(pr.descrizione ?? "").slice(0, 160),
        stato: pr.stato,
        settore: pr.settore,
        costo_prev: pr.costo_prev,
        costo_eff: pr.costo_eff,
        data_inizio: pr.data_inizio,
      })),
    };
  }

  return value;
}

type SiopeRaw = {
  per_anno?: Record<
    string,
    {
      anno: number;
      parziale?: boolean;
      mesi_disponibili?: string[];
      totale_anno?: number;
      saldo_cassa?: number;
      voci?: Array<{ mensili?: Record<string, number> }>;
      entrate?: {
        totale_anno?: number;
        voci?: Array<{ mensili?: Record<string, number> }>;
      };
    }
  >;
  anni_disponibili?: number[];
  anno_default?: number;
};

function monthlyFromCumulative(
  voci: Array<{ mensili?: Record<string, number> }> | undefined,
  mesi: string[],
): number[] {
  return mesi.map((mese, idx) => {
    let total = 0;
    for (const voce of voci ?? []) {
      const prevKey = idx > 0 ? mesi[idx - 1] : null;
      const curr = voce.mensili?.[mese] ?? 0;
      const prev = prevKey ? (voce.mensili?.[prevKey] ?? 0) : 0;
      total += curr - prev;
    }
    return Math.round(total * 100) / 100;
  });
}

function buildSiopeSeries(raw: SiopeRaw) {
  const annoKey = String(raw.anno_default ?? raw.anni_disponibili?.[0] ?? "");
  const year = raw.per_anno?.[annoKey];
  if (!year) {
    return { disponibile: false };
  }
  const mesi = year.mesi_disponibili ?? [];
  return {
    disponibile: true,
    anno: year.anno,
    parziale: year.parziale ?? false,
    mesi,
    labels: mesi.map((m) => {
      const [, mm] = m.split("/");
      return mm;
    }),
    uscite_mensili: monthlyFromCumulative(year.voci, mesi),
    entrate_mensili: monthlyFromCumulative(year.entrate?.voci, mesi),
    totale_uscite: year.totale_anno,
    totale_entrate: year.entrate?.totale_anno,
    saldo_cassa: year.saldo_cassa,
  };
}

type AtecoCell = { TOTAL?: { ul?: number; addetti?: number }; label?: string };

function summarizeAteco(detail: unknown) {
  if (!detail || typeof detail !== "object") return [];
  const rows: Array<{ code: string; ul: number; addetti: number }> = [];
  for (const [code, cell] of Object.entries(detail as Record<string, AtecoCell>)) {
    const ul = cell?.TOTAL?.ul ?? 0;
    const addetti = cell?.TOTAL?.addetti ?? 0;
    if (ul > 0) rows.push({ code, ul, addetti });
  }
  return rows.sort((a, b) => b.ul - a.ul).slice(0, 15);
}
