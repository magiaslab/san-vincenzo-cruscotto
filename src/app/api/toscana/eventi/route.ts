import { NextResponse } from "next/server";
import { REGIONE_TOSCANA_CKAN_API } from "@/lib/constants";

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
    headers: { "User-Agent": "Cruscotto-San-Vincenzo/1.0" },
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
  // case-insensitive
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

function relevantToSanVincenzo(e: EventoRegionale): boolean {
  const hay = `${e.comune ?? ""} ${e.luogo ?? ""} ${e.titolo}`.toLowerCase();
  return (
    hay.includes("san vincenzo") ||
    hay.includes("piombino") ||
    hay.includes("campiglia") ||
    hay.includes("castagneto") ||
    hay.includes("livorno") ||
    hay.includes("populonia") ||
    hay.includes("baratti")
  );
}

export async function GET() {
  try {
    const packageUrl = `${REGIONE_TOSCANA_CKAN_API}/package_show?id=rt-eventi-sistcult`;
    const response = await fetch(packageUrl, {
      headers: { "User-Agent": "Cruscotto-San-Vincenzo/1.0" },
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
        console.warn("Risorsa eventi Toscana non leggibile:", res.url, err);
      }
    }

    const locali = collected.filter(relevantToSanVincenzo);
    const eventi = (locali.length > 0 ? locali : collected).slice(0, 40);

    return NextResponse.json(
      {
        disponibile: Boolean(ckanData.success),
        dataset: ckanData.result?.name ?? "rt-eventi-sistcult",
        title: ckanData.result?.title ?? "Eventi Sistema Cultura",
        description: ckanData.result?.notes ?? "",
        resources,
        n_record_totali: collected.length,
        n_eventi: eventi.length,
        eventi,
        filtro_territoriale:
          locali.length > 0
            ? "San Vincenzo e comuni limitrofi / provincia"
            : collected.length > 0
              ? "Elenco regionale (nessun match locale)"
              : "Nessun record attivo nelle risorse JSON CKAN",
        categorie: ["Musei", "Biblioteche", "Archeologia", "Eventi culturali"],
        note:
          collected.length === 0
            ? "Il dataset regionale Sistema Cultura risulta raggiungibile, ma le risorse JSON non restituiscono eventi attivi al momento. Consulta il calendario comunale Visit San Vincenzo."
            : "Eventi dal Sistema Cultura Regione Toscana (open data).",
        fonte: {
          nome: "Regione Toscana - Open Data",
          url: "https://dati.toscana.it/dataset/rt-eventi-sistcult",
          licenza: "CC-BY 4.0",
        },
      },
      {
        headers: {
          "Cache-Control": `public, s-maxage=${CACHE_DURATION}, stale-while-revalidate`,
        },
      },
    );
  } catch (error) {
    console.error("Errore API eventi Toscana:", error);

    return NextResponse.json(
      {
        disponibile: false,
        n_eventi: 0,
        eventi: [],
        messaggio: "Servizio temporaneamente non disponibile",
        categorie: ["Musei", "Biblioteche", "Archeologia"],
        fonte: {
          nome: "Regione Toscana - Open Data",
          url: "https://dati.toscana.it/dataset/rt-eventi-sistcult",
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
