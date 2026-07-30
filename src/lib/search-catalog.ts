/** Catalogo ricerca globale: sezioni e servizi del cruscotto. */

export type SearchEntry = {
  id: string;
  /** Tab id di navigazione */
  tab: string;
  label: string;
  hint: string;
  keywords: string[];
};

export const SEARCH_CATALOG: SearchEntry[] = [
  {
    id: "panoramica",
    tab: "panoramica",
    label: "Panoramica",
    hint: "KPI e servizi utili",
    keywords: ["home", "inizio", "overview", "kpi"],
  },
  {
    id: "sanita",
    tab: "sanita",
    label: "Sanità",
    hint: "Farmacie, DAE, Ministero Salute",
    keywords: [
      "farmacia",
      "farmacie",
      "turno",
      "dae",
      "defibrillatore",
      "ospedale",
      "salute",
      "parafarmacia",
    ],
  },
  {
    id: "disabilita",
    tab: "disabilita",
    label: "Disabilità",
    hint: "Accessibilità, stalli, Wheelmap",
    keywords: [
      "accessibilità",
      "accessibilita",
      "barriere",
      "carrozzina",
      "wheelchair",
      "stalli",
      "peba",
    ],
  },
  {
    id: "infra",
    tab: "infra",
    label: "Mobilità",
    hint: "Bus, treni, EV, carburanti",
    keywords: [
      "bus",
      "treno",
      "gtfs",
      "trasporti",
      "colonnine",
      "ev",
      "ricarica",
      "carburanti",
      "benzina",
      "gasolio",
      "ciclabili",
    ],
  },
  {
    id: "meteo",
    tab: "meteo",
    label: "Meteo",
    hint: "Previsioni, radar, allerte",
    keywords: [
      "meteo",
      "tempo",
      "pioggia",
      "allerta",
      "protezione civile",
      "radar",
      "vento",
    ],
  },
  {
    id: "partecipa",
    tab: "partecipa",
    label: "Partecipa",
    hint: "Suggerimenti e issue GitHub",
    keywords: [
      "suggerimenti",
      "feedback",
      "segnala",
      "github",
      "proposta",
      "bug",
      "miglioramento",
    ],
  },
  {
    id: "turismo",
    tab: "turismo",
    label: "Turismo",
    hint: "Eventi, strutture, flussi, biblioteca",
    keywords: [
      "eventi",
      "turismo",
      "hotel",
      "biblioteca",
      "visit",
      "arrivi",
      "presenze",
      "stagionalità",
      "stagionalita",
      "flussi",
    ],
  },
  {
    id: "turismo-flussi",
    tab: "turismo",
    label: "Flussi e stagionalità",
    hint: "Arrivi e presenze Regione Toscana",
    keywords: [
      "arrivi",
      "presenze",
      "stagionalità",
      "permanenza",
      "pressione turistica",
      "stranieri",
    ],
  },
  {
    id: "porto",
    tab: "porto",
    label: "Porto",
    hint: "Posti barca, webcam, AIS",
    keywords: ["porto", "barca", "marina", "ais", "webcam", "ormeggio"],
  },
  {
    id: "ambiente",
    tab: "ambiente",
    label: "Ambiente",
    hint: "Balneazione, rifiuti, aria",
    keywords: [
      "mare",
      "balneazione",
      "arpat",
      "rifiuti",
      "aria",
      "suolo",
      "spiaggia",
    ],
  },
  {
    id: "territorio",
    tab: "territorio",
    label: "Territorio",
    hint: "Morfologia, rischio IdroGEO, catasto",
    keywords: [
      "territorio",
      "rilievo",
      "catasto",
      "elevazione",
      "rischio",
      "frane",
      "alluvioni",
      "erosione",
      "idrogeo",
      "costa",
    ],
  },
  {
    id: "mappa",
    tab: "mappa",
    label: "Mappa",
    hint: "Civici, EV, sanità, beni",
    keywords: ["mappa", "mappa", "civici", "geo"],
  },
  {
    id: "economia",
    tab: "economia",
    label: "Economia",
    hint: "Lavoro, redditi, imprese",
    keywords: ["lavoro", "reddito", "imprese", "occupazione", "economia"],
  },
  {
    id: "istruzione",
    tab: "istruzione",
    label: "Istruzione",
    hint: "Scuole MIUR",
    keywords: ["scuola", "scuole", "miur", "alunni", "istruzione"],
  },
  {
    id: "societa",
    tab: "societa",
    label: "Società",
    hint: "Demografia e terzo settore",
    keywords: ["popolazione", "demografia", "runts", "sociale", "società"],
  },
  {
    id: "finanza",
    tab: "finanza",
    label: "Finanza",
    hint: "SIOPE, PNRR, ANAC",
    keywords: ["finanza", "bilancio", "pnrr", "siope", "contratti", "anac"],
  },
  {
    id: "dae-telegram",
    tab: "sanita",
    label: "Segnala un DAE",
    hint: "Bot Telegram defibrillatori",
    keywords: [
      "telegram",
      "bot",
      "defibrillatore",
      "dae nuovo",
      "segnala dae",
      "openaedmap",
    ],
  },
  {
    id: "farmacie-turno",
    tab: "sanita",
    label: "Farmacie di turno",
    hint: "Turni e orari farmacie",
    keywords: ["farmacia di turno", "turno farmacie", "orario farmacia"],
  },
  {
    id: "allerte",
    tab: "meteo",
    label: "Allerte meteo",
    hint: "Protezione Civile Toscana",
    keywords: ["allerta", "protezione civile", "rischio", "warning", "alert"],
  },
];

function norm(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .trim();
}

export function searchCatalog(query: string, limit = 8): SearchEntry[] {
  const q = norm(query);
  if (q.length < 2) return [];

  const scored = SEARCH_CATALOG.map((entry) => {
    const hay = norm(
      [entry.label, entry.hint, ...entry.keywords].join(" "),
    );
    let score = 0;
    if (norm(entry.label).startsWith(q)) score += 50;
    if (norm(entry.label).includes(q)) score += 30;
    if (entry.keywords.some((k) => norm(k).startsWith(q))) score += 40;
    if (hay.includes(q)) score += 10;
    const parts = q.split(/\s+/).filter(Boolean);
    if (parts.every((p) => hay.includes(p))) score += 15;
    return { entry, score };
  })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score);

  return scored.slice(0, limit).map((x) => x.entry);
}
