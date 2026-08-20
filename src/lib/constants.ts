import {
  allertameteoApiUrl,
  allertameteoPageUrl,
  COMUNE,
  getForkMaintainer,
  isUpstreamDeploy,
} from "@/lib/comune-config";
import { PROJECT_ORIGIN } from "@/lib/project-origin";

export const STEMMA = {
  src: COMUNE.brand.stemma_path,
  width: COMUNE.brand.stemma_width,
  height: COMUNE.brand.stemma_height,
  alt: COMUNE.brand.stemma_alt,
  attribution: COMUNE.brand.stemma_attribution,
  licenseUrl: COMUNE.brand.stemma_license_url,
  sourceUrl: COMUNE.brand.stemma_source_url,
} as const;

/** Codice ISTAT del comune configurato in `config/comune.json`. */
export const ISTAT_CODE = COMUNE.istat_code;

export const COMUNE_NOME = COMUNE.nome;
export const COMUNE_PROVINCIA = COMUNE.provincia;
export const COMUNE_REGIONE = COMUNE.regione;

export const MCP_ENDPOINT = "https://cruscotto-italia-mcp.agid.workers.dev/mcp";

export const CRUSCOTTO_ITALIA_URL = "https://cruscotto-italia.dati.gov.it/";
export const OSM_COPYRIGHT_URL = "https://www.openstreetmap.org/copyright";
export const CATASTO_GEOJSON_URL = `https://cruscotto-italia.dati.gov.it/data/catasto_full/${ISTAT_CODE}_ple.geojson.gz`;

/**
 * Contatti “locali” del deploy: autore originale sull’upstream,
 * maintainer del fork altrimenti (fallback all’autore originale).
 */
const forkMaintainer = getForkMaintainer();
export const AUTHOR = {
  name:
    !isUpstreamDeploy() && forkMaintainer?.name
      ? forkMaintainer.name
      : PROJECT_ORIGIN.author.name,
  email:
    !isUpstreamDeploy() && forkMaintainer?.email
      ? forkMaintainer.email
      : PROJECT_ORIGIN.author.email,
} as const;

/** Repository del progetto ORIGINALE (fork button, docs, attribuzioni). */
export const GITHUB_REPO_URL = PROJECT_ORIGIN.github_repo_url;
/** Deploy Button Vercel → clone del repo originale. */
export const VERCEL_DEPLOY_URL = PROJECT_ORIGIN.vercel_deploy_url;

/** Repo GitHub di QUESTO deploy (Issues Partecipa / DAE). Default = origin. */
export const GITHUB_FORK_REPO_URL =
  (!isUpstreamDeploy() && forkMaintainer?.github_repo_url) ||
  PROJECT_ORIGIN.github_repo_url;

/** Centro approssimativo del comune (per mappa iniziale). */
export const MAP_CENTER: [number, number] = COMUNE.geo.map_center;
export const MAP_DEFAULT_ZOOM = COMUNE.geo.map_default_zoom;

/** Mappa globale OpenAEDMap centrata sul comune. */
export const OPENAEDMAP_URL = `https://openaedmap.org/it/#map=14/${MAP_CENTER[0]}/${MAP_CENTER[1]}`;

/** GeoJSON locale dei DAE comunali (export OpenStreetMap / OpenAEDMap). */
export const DAE_GEOJSON_PATH = COMUNE.urls.dae_geojson;

/**
 * Deep-link bot Telegram per segnalare nuovi DAE.
 * Vedi docs/dae-telegram-bot.md.
 */
export const TELEGRAM_DAE_BOT_URL =
  process.env.NEXT_PUBLIC_TELEGRAM_BOT_URL?.trim() ||
  "https://t.me/DaesanvincenzoBot";

/** GeoJSON overlay segnalazioni cittadine (approvate). */
export const DAE_SEGNALAZIONI_API = "/api/dae/segnalazioni";

/** Coordinate meteo (centro comune) per Open-Meteo / overlay radar. */
export const METEO_LAT = COMUNE.geo.meteo[0];
export const METEO_LON = COMUNE.geo.meteo[1];

export const OPEN_METEO_URL = "https://api.open-meteo.com/v1/forecast";
export const OPEN_METEO_ATTRIBUTION_URL = "https://open-meteo.com/";
export const RAINVIEWER_MAPS_URL =
  "https://api.rainviewer.com/public/weather-maps.json";
export const RAINVIEWER_ATTRIBUTION_URL = "https://www.rainviewer.com/";

/** OpenWeather (piano free): current, forecast 5d/3h, air pollution. */
export const OPENWEATHER_BASE_URL = "https://api.openweathermap.org/data/2.5";
export const OPENWEATHER_ATTRIBUTION_URL = "https://openweathermap.org/";

/** Allerte meteo-idro Protezione Civile (comune configurato). */
export const ALLERTA_METEO_APP_URL = "https://allertameteo.app/" as const;
export const ALLERTA_METEO_SV_PAGE_URL = allertameteoPageUrl();
export const ALLERTA_METEO_SV_API_URL = allertameteoApiUrl();
export const CFR_TOSCANA_URL =
  COMUNE.regione_opendata.cfr_url || "https://www.cfr.toscana.it/";
export const REGIONE_TOSCANA_ALLERTA_URL =
  COMUNE.regione_opendata.allerta_url ||
  "https://www.regione.toscana.it/allertameteo";
export const DPC_CRITICITA_REPO_URL =
  "https://github.com/pcm-dpc/DPC-Bollettini-Criticita-Idrogeologica-Idraulica" as const;
export const DPC_ALLERTAMENTO_URL =
  "https://rischi.protezionecivile.gov.it/it/meteo-idro/allertamento/" as const;

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

/** Lookup minimi per comuni frequenti nel pendolarismo (estendibile nel fork). */
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
  "051004": "Bibbiena",
  "051017": "Poppi",
  "051002": "Arezzo",
};

/** URL fonti open data aggiuntive (da `config/comune.json`). */
export const SAN_VINCENZO_OPENDATA_URL = COMUNE.urls.opendata;
export const COMUNE_SAN_VINCENZO_URL = COMUNE.urls.comune;
export const COMUNE_EVENTI_URL = COMUNE.urls.eventi_comune;
export const VISIT_SAN_VINCENZO_EVENTI_URL = COMUNE.urls.eventi_calendario;
export const BIBLIOTECA_COMUNALE_URL = COMUNE.urls.biblioteca;
export const BIBLIOTECA_OPAC_URL = COMUNE.urls.biblioteca_opac;
export const ARPAT_BASE_URL = COMUNE.regione_opendata.arpat_base_url;
export const ARPAT_OPENDATA_URL = `${ARPAT_BASE_URL.replace(/\/$/, "")}/opendata`;
export const ARPAT_BALNEAZIONE_URL = `${ARPAT_BASE_URL.replace(/\/$/, "")}/tema-ambientale/balneazione/`;
export const REGIONE_TOSCANA_OPENDATA_URL = COMUNE.regione_opendata.portal_url;
export const REGIONE_TOSCANA_CKAN_API = COMUNE.regione_opendata.ckan_api;

/**
 * CSV/ODS opzionale più recente per flussi turistici comunali (mensile).
 * Vuoto di default: la route scopre dinamicamente CKAN + pagina statistiche RT.
 */
export const TURISMO_CSV_FALLBACK_URL =
  process.env.TURISMO_CSV_FALLBACK_URL?.trim() || "";

export const REGIONE_TOSCANA_TURISMO_STATS_URL =
  COMUNE.regione_opendata.turismo_stats_url ||
  "https://www.regione.toscana.it/statistiche/dati-statistici/turismo";

/** Orari TPL regionale (GTFS) — dataset Regione (configurabile). */
export const RT_ORARITB_DATASET_URL =
  COMUNE.regione_opendata.gtfs_dataset_url ||
  "https://dati.toscana.it/dataset/rt-oraritb";
export const RT_ORARITB_CKAN_ID =
  COMUNE.regione_opendata.gtfs_ckan_id || "rt-oraritb";
export const AUTOLINEE_GTFS_URL =
  "https://regionetoscana.smartregion.toscana.it/mobility/artifacts/gtfs" as const;
export const TRASPORTI_GTFS_SV_PATH = COMUNE.urls.trasporti_gtfs_local;

/** Board live treni (proxy ViaggiaTreno) — stazione FS configurata. */
export const TRASPORTI_TRENI_LIVE_API = "/api/trasporti/treni" as const;
export const VIAGGIATRENO_ATTRIBUTION_URL =
  "https://www.viaggiatreno.it/" as const;

/** Aree ciclabili / pedonali (open data comunale / regionale). */
export const CICLABILI_DATASET_URL =
  "https://dati.toscana.it/dataset/aree-di-circolazione-ciclabili28" as const;
export const PEDONALI_DATASET_URL =
  "https://dati.toscana.it/dataset/aree-di-circolazione-pedonale29" as const;
export const CICLABILI_GEOJSON_LIVE_URL = COMUNE.urls.ciclabili_geojson;
export const PEDONALI_GEOJSON_LIVE_URL = COMUNE.urls.pedonali_geojson;
export const CICLABILI_GEOJSON_PATH = COMUNE.urls.ciclabili_geojson_local;
export const PEDONALI_GEOJSON_PATH = COMUNE.urls.pedonali_geojson_local;
export const MINISTERO_CULTURA_URL = "https://dati.beniculturali.it/";
export const MINISTERO_CULTURA_API = "https://opendata.beniculturali.it";
export const CARTO_ATTRIBUTION_URL = "https://carto.com/";

/** Codice comune per API Ministero Cultura */
export const COMUNE_ISTAT_CULTURA = ISTAT_CODE;

/**
 * Prezzi colonnine EV aggregati (OpenChargeMap + OSM) via PienoFurbo.
 * Non c’è un obbligo nazionale tipo MIMIT: i prezzi sono parziali e indicativi.
 */
export const PIENOFURBO_COLONNINE_URL =
  "https://www.pienofurbo.it/colonnine" as const;
export const PIENOFURBO_COLONNINE_SEARCH_URL =
  "https://www.pienofurbo.it/colonnine/search" as const;
export const OPENCHARGEMAP_URL = "https://openchargemap.org/" as const;
export const PUN_IDR_URL = "https://www.piattaformaunicanazionale.it/idr" as const;

/** Farmacie di turno — codice farmaciediturno.org = ISTAT senza lo 0 iniziale. */
export const FARMACIE_DI_TURNO_COD = COMUNE.farmacie_di_turno_cod;
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
export const MIUR_COMUNE_CATASTALE = COMUNE.miur_codice_catastale;

/** User-Agent HTTP per scrape/proxy (configurabile). */
export const HTTP_USER_AGENT = COMUNE.brand.user_agent;
