import {
  MAP_CENTER,
  PIENOFURBO_COLONNINE_SEARCH_URL,
  PIENOFURBO_COLONNINE_URL,
  PUN_IDR_URL,
} from "@/lib/constants";
import { matchesComuneNome, COMUNE } from "@/lib/comune-config";
import { getCachedDashboard } from "@/lib/dashboard";

export type EvStationRow = {
  id: string;
  nome: string | null;
  gestore: string | null;
  indirizzo: string | null;
  potenza_kw: number | null;
  corrente: string | null;
  categoria: string | null;
  n_punti: number;
  attivo: boolean;
  stato: string | null;
  lat: number | null;
  lon: number | null;
  prezzo_eur_kwh: number | null;
  prezzo_display: string | null;
  prezzo_fonte: string | null;
  prezzo_verificato: string | null;
  detail_url: string | null;
  fonte_anagrafica: "pun" | "pienofurbo";
};

export type EvPrezziPayload = {
  disponibile: boolean;
  aggiornato_at: string;
  n_stazioni: number;
  n_con_prezzo: number;
  prezzo_min_eur_kwh: number | null;
  prezzo_medio_eur_kwh: number | null;
  stazioni: EvStationRow[];
  disclaimer: string;
  fonti: {
    anagrafica: { label: string; url: string };
    prezzi: { label: string; url: string };
  };
  note?: string;
};

type PunPoint = {
  id_evse?: string;
  lat?: number;
  lon?: number;
  indirizzo?: string;
  stato?: string;
  cpo?: string;
  potenza_w?: number;
  potenza_categoria?: string;
  corrente?: string;
};

type PfStation = {
  id?: string;
  nome_stazione?: string | null;
  gestore?: string | null;
  indirizzo?: string | null;
  comune?: string | null;
  lat?: string | number | null;
  lon?: string | number | null;
  potenza_kw?: number | null;
  corrente?: string | null;
  prezzo_per_kwh?: number | null;
  prezzo_display?: string | null;
  data_ultima_verifica?: string | null;
  detail_url?: string | null;
  distanza_km?: number | null;
  source?: string | null;
};

const DISCLAIMER =
  "I prezzi €/kWh sono indicativi e spesso incompleti (non esiste un obbligo nazionale di pubblicazione come per i carburanti MIMIT). Verifica sempre sulla fonte ufficiale, sull’app del gestore (CPO/EMSP) o sul terminale della colonnina prima di ricaricare.";

function toNum(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim()) {
    const n = Number(v.replace(",", "."));
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function haversineKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

function roundCoord(n: number): number {
  return Math.round(n * 1e4) / 1e4;
}

async function fetchPienofurboNearComune(): Promise<PfStation[]> {
  const [lat, lon] = MAP_CENTER;
  const url = new URL(PIENOFURBO_COLONNINE_SEARCH_URL);
  url.searchParams.set("lat", String(lat));
  url.searchParams.set("lon", String(lon));
  url.searchParams.set("radius", "8");
  url.searchParams.set("solo_con_prezzo", "0");
  url.searchParams.set("sort", "prezzo");
  url.searchParams.set("limit", "80");

  const res = await fetch(url.toString(), {
    headers: {
      Accept: "application/json",
      "User-Agent":
        COMUNE.brand.user_agent ||
        "Cruscotto-Comunale/1.0 (+https://github.com/magiaslab/san-vincenzo-cruscotto)",
    },
    next: { revalidate: 3600 },
  });
  if (!res.ok) throw new Error(`pienofurbo_http_${res.status}`);
  const json = (await res.json()) as {
    status?: string;
    message?: string;
    data?: PfStation[];
  };
  if (json.status !== "success" || !Array.isArray(json.data)) {
    throw new Error(json.message || "pienofurbo_error");
  }
  return json.data;
}

function groupPunStations(punti: PunPoint[]): EvStationRow[] {
  const map = new Map<string, EvStationRow & { _potenze: number[] }>();

  for (const p of punti) {
    const lat = toNum(p.lat);
    const lon = toNum(p.lon);
    if (lat == null || lon == null) continue;
    const cpo = (p.cpo ?? "").trim() || "Gestore non indicato";
    const key = `${roundCoord(lat)}|${roundCoord(lon)}|${cpo.toLowerCase()}`;
    const potenzaKw = p.potenza_w != null ? p.potenza_w / 1000 : null;
    const attivo = String(p.stato ?? "")
      .toLowerCase()
      .includes("attiv");

    const existing = map.get(key);
    if (!existing) {
      map.set(key, {
        id: `pun:${key}`,
        nome: null,
        gestore: cpo,
        indirizzo: p.indirizzo?.trim() || null,
        potenza_kw: potenzaKw,
        corrente: p.corrente ?? null,
        categoria: p.potenza_categoria ?? null,
        n_punti: 1,
        attivo,
        stato: p.stato ?? null,
        lat,
        lon,
        prezzo_eur_kwh: null,
        prezzo_display: null,
        prezzo_fonte: null,
        prezzo_verificato: null,
        detail_url: null,
        fonte_anagrafica: "pun",
        _potenze: potenzaKw != null ? [potenzaKw] : [],
      });
      continue;
    }

    existing.n_punti += 1;
    if (attivo) existing.attivo = true;
    if (p.indirizzo && !existing.indirizzo) existing.indirizzo = p.indirizzo;
    if (p.corrente && existing.corrente && !existing.corrente.includes(p.corrente)) {
      existing.corrente = `${existing.corrente}|${p.corrente}`;
    } else if (p.corrente && !existing.corrente) {
      existing.corrente = p.corrente;
    }
    if (potenzaKw != null) {
      existing._potenze.push(potenzaKw);
      existing.potenza_kw = Math.max(...existing._potenze);
    }
  }

  return [...map.values()].map((row) => {
    const copy: EvStationRow & { _potenze?: number[] } = { ...row };
    delete copy._potenze;
    return copy;
  });
}

function enrichWithPrices(
  stations: EvStationRow[],
  pf: PfStation[],
  maxKm = 0.25,
): EvStationRow[] {
  const priced = pf.filter((p) => toNum(p.prezzo_per_kwh) != null);
  return stations.map((s) => {
    if (s.lat == null || s.lon == null) return s;
    let best: { dist: number; p: PfStation } | null = null;
    for (const p of priced) {
      const plat = toNum(p.lat);
      const plon = toNum(p.lon);
      if (plat == null || plon == null) continue;
      const dist = haversineKm(s.lat, s.lon, plat, plon);
      if (dist > maxKm) continue;
      if (!best || dist < best.dist) best = { dist, p };
    }
    if (!best) return s;
    const prezzo = toNum(best.p.prezzo_per_kwh);
    return {
      ...s,
      nome: s.nome || best.p.nome_stazione || null,
      prezzo_eur_kwh: prezzo,
      prezzo_display:
        best.p.prezzo_display ||
        (prezzo != null ? `${prezzo.toFixed(3).replace(".", ",")} €/kWh` : null),
      prezzo_fonte: best.p.source ? `pienofurbo/${best.p.source}` : "pienofurbo",
      prezzo_verificato: best.p.data_ultima_verifica || null,
      detail_url: best.p.detail_url || null,
    };
  });
}

function pfOnlyInComune(
  pf: PfStation[],
  already: EvStationRow[],
): EvStationRow[] {
  const used = already
    .filter((s) => s.lat != null && s.lon != null)
    .map((s) => ({ lat: s.lat as number, lon: s.lon as number }));

  const out: EvStationRow[] = [];
  for (const p of pf) {
    const lat = toNum(p.lat);
    const lon = toNum(p.lon);
    const dist = toNum(p.distanza_km);
    const inComune =
      matchesComuneNome(p.comune) || (dist != null && dist <= 2.5);
    if (!inComune || lat == null || lon == null) continue;

    const nearExisting = used.some(
      (u) => haversineKm(u.lat, u.lon, lat, lon) < 0.2,
    );
    if (nearExisting) continue;

    const prezzo = toNum(p.prezzo_per_kwh);
    out.push({
      id: `pf:${p.id ?? `${lat},${lon}`}`,
      nome: p.nome_stazione ?? null,
      gestore: p.gestore ?? null,
      indirizzo: p.indirizzo ?? null,
      potenza_kw: toNum(p.potenza_kw),
      corrente: p.corrente ?? null,
      categoria: null,
      n_punti: 1,
      attivo: true,
      stato: null,
      lat,
      lon,
      prezzo_eur_kwh: prezzo,
      prezzo_display:
        p.prezzo_display ||
        (prezzo != null ? `${prezzo.toFixed(3).replace(".", ",")} €/kWh` : null),
      prezzo_fonte: p.source ? `pienofurbo/${p.source}` : "pienofurbo",
      prezzo_verificato: p.data_ultima_verifica || null,
      detail_url: p.detail_url || null,
      fonte_anagrafica: "pienofurbo",
    });
    used.push({ lat, lon });
  }
  return out;
}

export async function buildEvPrezziPayload(): Promise<EvPrezziPayload> {
  const dashboard = await getCachedDashboard();
  const pun = dashboard.pun as { punti?: PunPoint[] } | undefined;
  const punStations = groupPunStations(pun?.punti ?? []);

  let pf: PfStation[] = [];
  let note: string | undefined;
  try {
    pf = await fetchPienofurboNearComune();
  } catch (err) {
    note = `Prezzi PienoFurbo non disponibili al momento (${
      err instanceof Error ? err.message : "errore"
    }). Mostro anagrafica PUN/IDR.`;
  }

  const enriched = enrichWithPrices(punStations, pf);
  const extra = pf.length ? pfOnlyInComune(pf, enriched) : [];
  const stazioni = [...enriched, ...extra].sort((a, b) => {
    const pa = a.prezzo_eur_kwh ?? Number.POSITIVE_INFINITY;
    const pb = b.prezzo_eur_kwh ?? Number.POSITIVE_INFINITY;
    if (pa !== pb) return pa - pb;
    return (a.gestore ?? "").localeCompare(b.gestore ?? "", "it");
  });

  const conPrezzo = stazioni
    .map((s) => s.prezzo_eur_kwh)
    .filter((v): v is number => v != null);
  const prezzoMin = conPrezzo.length ? Math.min(...conPrezzo) : null;
  const prezzoMedio = conPrezzo.length
    ? conPrezzo.reduce((a, b) => a + b, 0) / conPrezzo.length
    : null;

  return {
    disponibile: stazioni.length > 0,
    aggiornato_at: new Date().toISOString(),
    n_stazioni: stazioni.length,
    n_con_prezzo: conPrezzo.length,
    prezzo_min_eur_kwh: prezzoMin,
    prezzo_medio_eur_kwh: prezzoMedio,
    stazioni,
    disclaimer: DISCLAIMER,
    note,
    fonti: {
      anagrafica: { label: "PUN / IDR", url: PUN_IDR_URL },
      prezzi: {
        label: "PienoFurbo (OpenChargeMap + OSM)",
        url: PIENOFURBO_COLONNINE_URL,
      },
    },
  };
}
