export const STEMMA = {
  src: "/stemma-san-vincenzo.png",
  width: 399,
  height: 500,
  alt: "Stemma del Comune di San Vincenzo",
  attribution:
    "Stemma di San Vincenzo, disegno di Massimo Ghirardi, per gentile concessione di Araldicacivica.it — CC BY-NC-ND 3.0 IT",
  licenseUrl: "https://creativecommons.org/licenses/by-nc-nd/3.0/it/",
  sourceUrl:
    "https://upload.wikimedia.org/wikipedia/it/8/81/San_Vincenzo_%28Italia%29-Stemma.png",
} as const;

/** Codice ISTAT del Comune di San Vincenzo (LI) — unico comune supportato. */
export const ISTAT_CODE = "049018" as const;

export const COMUNE_NOME = "San Vincenzo";
export const COMUNE_PROVINCIA = "LI";
export const COMUNE_REGIONE = "Toscana";

export const MCP_ENDPOINT = "https://cruscotto-italia-mcp.agid.workers.dev/mcp";

export const CRUSCOTTO_ITALIA_URL = "https://cruscotto-italia.dati.gov.it/";
export const OSM_COPYRIGHT_URL = "https://www.openstreetmap.org/copyright";
export const CATASTO_GEOJSON_URL = `https://cruscotto-italia.dati.gov.it/data/catasto_full/${ISTAT_CODE}_ple.geojson.gz`;

export const AUTHOR = {
  name: "Alessandro Cipriani",
  email: "cipriani.alessandro@gmail.com",
} as const;

/** Centro approssimativo del comune (per mappa iniziale). */
export const MAP_CENTER: [number, number] = [43.085, 10.54];
export const MAP_DEFAULT_ZOOM = 13;

/** Limite punti civici inviati al client (paginazione server-side). */
export const CIVICI_MAP_LIMIT = 1500;

/** Palette istituzionale PA / Bootstrap Italia. */
export const PA_PRIMARY = "#0066CC";
export const CHART_COLORS = [
  "#0066CC",
  "#008758",
  "#CC7A00",
  "#D9364F",
  "#5B2C6F",
  "#117A65",
  "#B9770E",
  "#1A5276",
] as const;

/** Lookup minimi per comuni frequenti nel pendolarismo di San Vincenzo. */
export const COMUNI_LOOKUP: Record<string, string> = {
  "049001": "Bibbona",
  "049002": "Campiglia Marittima",
  "049006": "Castagneto Carducci",
  "049007": "Cecina",
  "049009": "Livorno",
  "049012": "Piombino",
  "049017": "Sassetta",
  "049018": "San Vincenzo",
  "049019": "Suvereto",
  "049020": "Collesalvetti",
  "048017": "Follonica",
  "050026": "Pisa",
  "053009": "Grosseto",
};
