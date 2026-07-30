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

/** Repository e deploy di questo cruscotto. */
export const GITHUB_REPO_URL =
  "https://github.com/magiaslab/san-vincenzo-cruscotto" as const;
export const VERCEL_DEPLOY_URL =
  "https://vercel.com/magiaslab/san-vincenzo-cruscotto" as const;

/** Centro approssimativo del comune (per mappa iniziale). */
export const MAP_CENTER: [number, number] = [43.085, 10.54];
export const MAP_DEFAULT_ZOOM = 13;

/** Mappa globale OpenAEDMap centrata su San Vincenzo. */
export const OPENAEDMAP_URL = "https://openaedmap.org/it/#map=14/43.085/10.54";

/** GeoJSON locale dei DAE comunali (export OpenStreetMap / OpenAEDMap). */
export const DAE_GEOJSON_PATH = "/data/dae-san-vincenzo.geojson";

/** Coordinate meteo (centro comune) per Open-Meteo / overlay radar. */
export const METEO_LAT = 43.085;
export const METEO_LON = 10.54;

export const OPEN_METEO_URL = "https://api.open-meteo.com/v1/forecast";
export const OPEN_METEO_ATTRIBUTION_URL = "https://open-meteo.com/";
export const RAINVIEWER_MAPS_URL =
  "https://api.rainviewer.com/public/weather-maps.json";
export const RAINVIEWER_ATTRIBUTION_URL = "https://www.rainviewer.com/";

/** OpenWeather (piano free): current, forecast 5d/3h, air pollution. */
export const OPENWEATHER_BASE_URL = "https://api.openweathermap.org/data/2.5";
export const OPENWEATHER_ATTRIBUTION_URL = "https://openweathermap.org/";

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

/** URL fonti open data aggiuntive */
export const SAN_VINCENZO_OPENDATA_URL = "https://cloud.ldpgis.it/sanvincenzoopen/";
export const COMUNE_SAN_VINCENZO_URL = "https://www.comune.sanvincenzo.li.it/";
export const COMUNE_EVENTI_URL =
  "https://www.comune.sanvincenzo.li.it/Vivere-il-comune/Eventi";
export const VISIT_SAN_VINCENZO_EVENTI_URL =
  "https://visitsanvincenzo.it/it/calendario-eventi/";
export const BIBLIOTECA_COMUNALE_URL =
  "https://www.comune.sanvincenzo.li.it/Vivere-il-comune/Luoghi/Biblioteca-Comunale-Giorgio-Calandra";
export const BIBLIOTECA_OPAC_URL =
  "https://opacsol.comune.livorno.it/SebinaOpac/library/SAN%20VINCENZO%20-%20Biblioteca%20comunale/LIASA";
export const ARPAT_BASE_URL = "https://www.arpat.toscana.it";
export const ARPAT_OPENDATA_URL = "https://www.arpat.toscana.it/opendata";
export const ARPAT_BALNEAZIONE_URL =
  "https://www.arpat.toscana.it/tema-ambientale/balneazione/";
export const REGIONE_TOSCANA_OPENDATA_URL = "https://dati.toscana.it/";
export const REGIONE_TOSCANA_CKAN_API = "https://dati.toscana.it/api/3/action";

/** Orari TPL regionale (GTFS) — dataset Regione Toscana. */
export const RT_ORARITB_DATASET_URL =
  "https://dati.toscana.it/dataset/rt-oraritb" as const;
export const RT_ORARITB_CKAN_ID = "rt-oraritb" as const;
export const AUTOLINEE_GTFS_URL =
  "https://regionetoscana.smartregion.toscana.it/mobility/artifacts/gtfs" as const;
export const TRASPORTI_GTFS_SV_PATH = "/data/trasporti-gtfs-sv.json" as const;

/** Aree ciclabili / pedonali (open data comunale via dati.toscana.it / ldpgis). */
export const CICLABILI_DATASET_URL =
  "https://dati.toscana.it/dataset/aree-di-circolazione-ciclabili28" as const;
export const PEDONALI_DATASET_URL =
  "https://dati.toscana.it/dataset/aree-di-circolazione-pedonale29" as const;
export const CICLABILI_GEOJSON_LIVE_URL =
  "https://sanvincenzo.ldpgis.it/metarepo2/api/datasets/area_di_circolazione_ciclabile/resources/139/GeoJSON" as const;
export const PEDONALI_GEOJSON_LIVE_URL =
  "https://sanvincenzo.ldpgis.it/metarepo2/api/datasets/area_di_circolazione_pedonale/resources/138/GeoJSON" as const;
export const CICLABILI_GEOJSON_PATH =
  "/data/ciclabili-san-vincenzo.geojson" as const;
export const PEDONALI_GEOJSON_PATH =
  "/data/pedonali-san-vincenzo.geojson" as const;
export const MINISTERO_CULTURA_URL = "https://dati.beniculturali.it/";
export const MINISTERO_CULTURA_API = "https://opendata.beniculturali.it";
export const CARTO_ATTRIBUTION_URL = "https://carto.com/";

/** Codice comune per API Ministero Cultura */
export const COMUNE_ISTAT_CULTURA = "049018";

/** Farmacie di turno (San Vincenzo) — codice farmaciediturno.org = ISTAT senza lo 0 iniziale. */
export const FARMACIE_DI_TURNO_COD = "49018" as const;
export const FARMACIE_DI_TURNO_URL =
  `https://www.farmaciediturno.org/ricercaditurno.asp?cod=${FARMACIE_DI_TURNO_COD}` as const;
export const FARMACIE_DI_TURNO_BASE = "https://www.farmaciediturno.org";

/**
 * Endpoint POST del RAG su Modal (workspace magiaslab).
 * Sovrascrivibile con ASSISTENTE_MODAL_URL.
 */
export const ASSISTENTE_MODAL_URL_DEFAULT =
  "https://magiaslab--san-vincenzo-rag-ragservice-web-ask.modal.run" as const;

/** Open data Ministero dell'Istruzione — Portale Unico dei Dati della Scuola. */
export const MIUR_OPENDATA_URL = "https://dati.istruzione.it/opendata/" as const;
export const MIUR_ESPLORA_URL =
  "https://dati.istruzione.it/opendata/esploraidati/" as const;
export const MIUR_CATALOG_BASE =
  "https://dati.istruzione.it/opendata/opendata/catalogo/elements1" as const;
/** Codice catastale comune (campo CODICECOMUNESCUOLA nei CSV MIUR). */
export const MIUR_COMUNE_CATASTALE = "I390" as const;
