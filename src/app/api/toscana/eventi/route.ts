import { NextResponse } from "next/server";
import {
  COMUNE_EVENTI_URL,
  COMUNE_NOME,
  HTTP_USER_AGENT,
  REGIONE_TOSCANA_CKAN_API,
  REGIONE_TOSCANA_OPENDATA_URL,
  VISIT_SAN_VINCENZO_EVENTI_URL,
} from "@/lib/constants";
import {
  COMUNE,
  isFeatureEnabled,
  matchesComuneText,
} from "@/lib/comune-config";

const CACHE_DURATION = 7200; // 2 ore

type Resource = {
  nome?: string;
  formato?: string;
  url?: string;
  ultima_modifica?: string;
};

type EventoRegionale = {
  titolo: string;
  luogo: string | null;
  comune: string | null;
  data_inizio: string | null;
  data_fine: string | null;
  categoria: string;
};

async function fetchJsonRecords(
  url: string,
): Promise<Array<Record<string, unknown>>> {
  const res = await fetch(url, {
    headers: { "User-Agent": HTTP_USER_AGENT },
    next: { revalidate: CACHE_DURATION },
  });
  if (!res.ok) return [];
  const data = (await res.json()) as Record<string, unknown>;
  const root = Object.values(data)[0] as
    | { Record?: Array<Record<string, unknown>> | Record<string, unknown> }
    | undefined;
  const rec = root?.Record;
  if (Array.isArray(rec)) return rec;
  if (rec && typeof rec === "object") return [rec as Record<string, unknown>];
  return [];
}

function pick(obj: Record<string, unknown>, keys: string[]): string | null {
  for (const k of keys) {
    const v = obj[k];
    if (typeof v === "string" && v.trim()) return v.trim();
    if (typeof v === "number") return String(v);
  }
  const lower = Object.fromEntries(
    Object.entries(obj).map(([k, v]) => [k.toLowerCase(), v]),
  );
  for (const k of keys) {
    const v = lower[k.toLowerCase()];
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return null;
}

function mapRecord(
  r: Record<string, unknown>,
  categoria: string,
): EventoRegionale | null {
  const titolo = pick(r, [
    "TITOLO",
    "titolo",
    "DENOMINAZIONE",
    "NOME",
    "EVENTO",
    "DESCRIZIONE",
  ]);
  if (!titolo) return null;
  return {
    titolo,
    luogo: pick(r, ["LUOGO", "luogo", "SEDE", "INDIRIZZO", "LOCATION"]),
    comune: pick(r, ["COMUNE", "comune", "CITTA", "DENOMINAZIONE_COMUNE"]),
    data_inizio: pick(r, [
      "DATA_INIZIO",
      "data_inizio",
      "INIZIO",
      "DATA",
      "DAL",
    ]),
    data_fine: pick(r, ["DATA_FINE", "data_fine", "FINE", "AL"]),
    categoria,
  };
}

export async function GET() {
  if (!isFeatureEnabled("eventi_regionali")) {
    return NextResponse.json(
      {
        disponibile: false,
        n_eventi: 0,
        eventi: [],
        messaggio: "Modulo eventi regionali disattivato",
      },
      { status: 404 },
    );
  }

  const ckanId = COMUNE.regione_opendata.eventi_ckan_id || "rt-eventi-sistcult";
  const datasetUrl = `${REGIONE_TOSCANA_OPENDATA_URL.replace(/\/$/, "")}/dataset/${ckanId}`;

  try {
    const packageUrl = `${REGIONE_TOSCANA_CKAN_API}/package_show?id=${encodeURIComponent(ckanId)}`;
    const response = await fetch(packageUrl, {
      headers: { "User-Agent": HTTP_USER_AGENT },
      next: { revalidate: CACHE_DURATION },
    });

    if (!response.ok) {
      throw new Error(`CKAN API error: ${response.status}`);
    }

    const ckanData = await response.json();
    const resources: Resource[] = (ckanData.result?.resources ?? []).map(
      (r: Record<string, unknown>) => ({
        nome: typeof r.name === "string" ? r.name : undefined,
        formato: typeof r.format === "string" ? r.format : undefined,
        url: typeof r.url === "string" ? r.url : undefined,
        ultima_modifica:
          typeof r.last_modified === "string" ? r.last_modified : undefined,
      }),
    );

    const jsonResources = resources.filter(
      (r) =>
        r.url &&
        (r.formato?.toUpperCase() === "JSON" ||
          r.url.toLowerCase().includes(".json")),
    );

    const collected: EventoRegionale[] = [];
    for (const res of jsonResources.slice(0, 4)) {
      if (!res.url) continue;
      const categoria = res.nome?.includes("Bibliotec")
        ? "Biblioteche"
        : res.nome?.toLowerCase().includes("archeolog")
          ? "Archeologia"
          : "Musei / cultura";
      try {
        const records = await fetchJsonRecords(res.url);
        for (const rec of records) {
          const mapped = mapRecord(rec, categoria);
          if (mapped) collected.push(mapped);
        }
      } catch (err) {
        console.warn("Risorsa eventi regionale non leggibile:", res.url, err);
      }
    }

    const locali = collected.filter((e) =>
      matchesComuneText(e.comune, e.luogo, e.titolo),
    );
    const eventi = (locali.length > 0 ? locali : []).slice(0, 40);

    return NextResponse.json(
      {
        disponibile: Boolean(ckanData.success),
        dataset: ckanData.result?.name ?? ckanId,
        title: ckanData.result?.title ?? "Eventi culturali",
        description: ckanData.result?.notes ?? "",
        resources,
        n_record_totali: collected.length,
        n_eventi: eventi.length,
        eventi,
        filtro_territoriale:
          locali.length > 0
            ? `${COMUNE_NOME} (e alias configurati)`
            : collected.length > 0
              ? `Nessun match per ${COMUNE_NOME} nelle risorse JSON`
              : "Nessun record attivo nelle risorse JSON CKAN",
        categorie: ["Musei", "Biblioteche", "Archeologia", "Eventi culturali"],
        note:
          collected.length === 0
            ? `Dataset regionale raggiungibile, ma senza eventi JSON attivi. Consulta il calendario comunale.`
            : locali.length === 0
              ? `Trovati ${collected.length} eventi regionali, nessuno filtrato su ${COMUNE_NOME}.`
              : "Eventi dal Sistema Cultura / open data regionale.",
        fonte: {
          nome: "Open data regionale",
          url: datasetUrl,
          licenza: "CC-BY 4.0",
          calendario_comune: COMUNE_EVENTI_URL || VISIT_SAN_VINCENZO_EVENTI_URL,
        },
      },
      {
        headers: {
          "Cache-Control": `public, s-maxage=${CACHE_DURATION}, stale-while-revalidate`,
        },
      },
    );
  } catch (error) {
    console.error("Errore API eventi regionali:", error);

    return NextResponse.json(
      {
        disponibile: false,
        n_eventi: 0,
        eventi: [],
        messaggio: "Servizio temporaneamente non disponibile",
        categorie: ["Musei", "Biblioteche", "Archeologia"],
        fonte: {
          nome: "Open data regionale",
          url: datasetUrl,
        },
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate",
        },
      },
    );
  }
}
