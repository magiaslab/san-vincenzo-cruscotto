/**
 * Config comunale runtime (`config/comune.json`).
 * Un deploy = un comune: adatta il JSON e spegni i moduli non pertinenti.
 */
import raw from "../../config/comune.json";

export type ComuneFeatures = {
  porto: boolean;
  balneazione: boolean;
  treni: boolean;
  gtfs_locale: boolean;
  ciclabili_pedonali: boolean;
  eventi_comune: boolean;
  eventi_regionali: boolean;
  turismo_flussi: boolean;
  allerte: boolean;
  allerte_toscana_sir: boolean;
  dae: boolean;
  dae_telegram: boolean;
  /** WFS IdroGEO dinamica litoranea. Off per comuni non costieri. */
  erosione_costiera: boolean;
  assistente_rag: boolean;
  biblioteca: boolean;
  arpat_aria: boolean;
  /**
   * Catasto ISPRA rifiuti urbani (CSV nazionale, filtro ISTAT).
   * Default true: funziona in qualsiasi comune italiano.
   */
  rifiuti_ispra: boolean;
  /**
   * Servizio idrico: etichette/fontanelle WFS del gestore (ASA o analogo)
   * se `gestori.acqua.geoserver_wfs` è valorizzato.
   */
  acqua_sii: boolean;
};

export type ComuneConfig = {
  istat_code: string;
  nome: string;
  nome_aliases: string[];
  provincia: string;
  regione: string;
  miur_codice_catastale: string;
  farmacie_di_turno_cod: string;
  residenti_fallback: number;
  geo: {
    map_center: [number, number];
    meteo: [number, number];
    map_default_zoom: number;
    /** [lonMin, latMin, lonMax, latMax]. Se assente, si deriva da centro + raggio. */
    bbox: [number, number, number, number] | null;
    bbox_radius_km: number;
    /**
     * Lato mare del rilievo 3D stilizzato.
     * `none` = comune interno (niente piano mare, collina al centro).
     */
    terrain_sea_side: TerrainSeaSide;
  };
  ferrovie: {
    stazione_viaggiatreno: string;
    stazione_nome: string;
  };
  allerte: {
    allertameteo_comune: string;
    allertameteo_page_path: string;
    toscana_zona: string;
    toscana_zona_label: string;
    toscana_sample: [number, number];
  };
  urls: {
    comune: string;
    opendata: string;
    eventi_comune: string;
    eventi_calendario: string;
    eventi_calendario_kind: string;
    biblioteca: string;
    biblioteca_opac: string;
    ciclabili_geojson: string;
    pedonali_geojson: string;
    dae_geojson: string;
    stalli_disabili: string;
    ciclabili_geojson_local: string;
    pedonali_geojson_local: string;
    trasporti_gtfs_local: string;
  };
  brand: {
    stemma_path: string;
    stemma_width: number;
    stemma_height: number;
    stemma_alt: string;
    stemma_attribution: string;
    stemma_license_url: string;
    stemma_source_url: string;
    site_url: string;
    user_agent: string;
  };
  regione_opendata: {
    portal_url: string;
    ckan_api: string;
    turismo_stats_url: string;
    gtfs_dataset_url: string;
    gtfs_ckan_id: string;
    eventi_ckan_id: string;
    allerta_url: string;
    cfr_url: string;
    arpat_base_url: string;
    nota: string;
  };
  /**
   * Gestori locali (acqua / rifiuti). URL vuoti = modulo solo con fonti nazionali.
   * Il WFS etichette è tipico di ASA (ATO 5 Toscana Costa), non universale.
   */
  gestori: {
    acqua: GestoreAcquaConfig;
    rifiuti: GestoreRifiutiConfig;
  };
  features: ComuneFeatures;
  eventi_filtro_extra: string[];
  /**
   * Metadati del fork. `is_upstream: true` = deploy ufficiale San Vincenzo.
   * Nei fork: `is_upstream: false` + nome/email/url del maintainer.
   * I crediti al progetto originale restano in `src/lib/project-origin.ts`.
   */
  fork: {
    is_upstream: boolean;
    maintainer_name: string;
    maintainer_email: string;
    maintainer_url: string;
    github_repo_url: string;
  };
};

export type GestoreAcquaConfig = {
  nome: string;
  url: string;
  etichette_map_url: string;
  fontanelle_map_url: string;
  composizione_url: string;
  /** Endpoint WFS GeoServer (es. http://asamap.it:8080/geoserver/asa_geoserver/ows). */
  geoserver_wfs: string;
  etichette_layer: string;
  fontanelle_layer: string;
  fontanelle_aq_layer: string;
  ait_opendata_url: string;
};

export type GestoreRifiutiConfig = {
  nome: string;
  url: string;
  calendario_url: string;
  centri_url: string;
  centro_url: string;
};

export type TerrainSeaSide = "west" | "east" | "south" | "north" | "none";

const SEA_SIDES: TerrainSeaSide[] = ["west", "east", "south", "north", "none"];

function asSeaSide(v: unknown, fallback: TerrainSeaSide): TerrainSeaSide {
  return typeof v === "string" && SEA_SIDES.includes(v as TerrainSeaSide)
    ? (v as TerrainSeaSide)
    : fallback;
}

function asQuad(
  v: unknown,
): [number, number, number, number] | null {
  if (
    Array.isArray(v) &&
    v.length >= 4 &&
    typeof v[0] === "number" &&
    typeof v[1] === "number" &&
    typeof v[2] === "number" &&
    typeof v[3] === "number"
  ) {
    return [v[0], v[1], v[2], v[3]];
  }
  return null;
}

function asPair(v: unknown, fallback: [number, number]): [number, number] {
  if (
    Array.isArray(v) &&
    v.length >= 2 &&
    typeof v[0] === "number" &&
    typeof v[1] === "number"
  ) {
    return [v[0], v[1]];
  }
  return fallback;
}

function bool(v: unknown, fallback: boolean): boolean {
  return typeof v === "boolean" ? v : fallback;
}

function str(v: unknown, fallback = ""): string {
  return typeof v === "string" ? v : fallback;
}

function num(v: unknown, fallback: number): number {
  return typeof v === "number" && Number.isFinite(v) ? v : fallback;
}

function parseConfig(input: unknown): ComuneConfig {
  const c = (input && typeof input === "object" ? input : {}) as Record<
    string,
    unknown
  >;
  const geo = (c.geo ?? {}) as Record<string, unknown>;
  const ferrovie = (c.ferrovie ?? {}) as Record<string, unknown>;
  const allerte = (c.allerte ?? {}) as Record<string, unknown>;
  const urls = (c.urls ?? {}) as Record<string, unknown>;
  const brand = (c.brand ?? {}) as Record<string, unknown>;
  const reg = (c.regione_opendata ?? {}) as Record<string, unknown>;
  const features = (c.features ?? {}) as Record<string, unknown>;
  const gestori = (c.gestori ?? {}) as Record<string, unknown>;
  const acqua = (gestori.acqua ?? {}) as Record<string, unknown>;
  const rifiuti = (gestori.rifiuti ?? {}) as Record<string, unknown>;
  const fork = (c.fork ?? {}) as Record<string, unknown>;

  return {
    istat_code: str(c.istat_code, "049018"),
    nome: str(c.nome, "San Vincenzo"),
    nome_aliases: Array.isArray(c.nome_aliases)
      ? c.nome_aliases.filter((x): x is string => typeof x === "string")
      : [],
    provincia: str(c.provincia, "LI"),
    regione: str(c.regione, "Toscana"),
    miur_codice_catastale: str(c.miur_codice_catastale, "I390"),
    farmacie_di_turno_cod: str(c.farmacie_di_turno_cod, "49018"),
    residenti_fallback: num(c.residenti_fallback, 0),
    geo: {
      map_center: asPair(geo.map_center, [43.085, 10.54]),
      meteo: asPair(geo.meteo, [43.085, 10.54]),
      map_default_zoom: num(geo.map_default_zoom, 13),
      bbox: asQuad(geo.bbox),
      bbox_radius_km: num(geo.bbox_radius_km, 8),
      terrain_sea_side: asSeaSide(geo.terrain_sea_side, "none"),
    },
    ferrovie: {
      stazione_viaggiatreno: str(ferrovie.stazione_viaggiatreno),
      stazione_nome: str(ferrovie.stazione_nome),
    },
    allerte: {
      allertameteo_comune: str(allerte.allertameteo_comune, str(c.nome)),
      allertameteo_page_path: str(allerte.allertameteo_page_path),
      toscana_zona: str(allerte.toscana_zona),
      toscana_zona_label: str(allerte.toscana_zona_label),
      toscana_sample: asPair(allerte.toscana_sample, [98, 152]),
    },
    urls: {
      comune: str(urls.comune),
      opendata: str(urls.opendata),
      eventi_comune: str(urls.eventi_comune),
      eventi_calendario: str(urls.eventi_calendario),
      eventi_calendario_kind: str(urls.eventi_calendario_kind, "none"),
      biblioteca: str(urls.biblioteca),
      biblioteca_opac: str(urls.biblioteca_opac),
      ciclabili_geojson: str(urls.ciclabili_geojson),
      pedonali_geojson: str(urls.pedonali_geojson),
      dae_geojson: str(urls.dae_geojson, "/data/dae.geojson"),
      stalli_disabili: str(urls.stalli_disabili),
      ciclabili_geojson_local: str(urls.ciclabili_geojson_local),
      pedonali_geojson_local: str(urls.pedonali_geojson_local),
      trasporti_gtfs_local: str(urls.trasporti_gtfs_local),
    },
    brand: {
      stemma_path: str(brand.stemma_path, "/stemma.png"),
      stemma_width: num(brand.stemma_width, 399),
      stemma_height: num(brand.stemma_height, 500),
      stemma_alt: str(brand.stemma_alt, "Stemma comunale"),
      stemma_attribution: str(brand.stemma_attribution),
      stemma_license_url: str(brand.stemma_license_url),
      stemma_source_url: str(brand.stemma_source_url),
      site_url: str(brand.site_url),
      user_agent: str(
        brand.user_agent,
        "Cruscotto-Comunale/1.0 (+https://github.com/magiaslab/san-vincenzo-cruscotto)",
      ),
    },
    regione_opendata: {
      portal_url: str(reg.portal_url, "https://dati.toscana.it/"),
      ckan_api: str(reg.ckan_api, "https://dati.toscana.it/api/3/action"),
      turismo_stats_url: str(reg.turismo_stats_url),
      gtfs_dataset_url: str(reg.gtfs_dataset_url),
      gtfs_ckan_id: str(reg.gtfs_ckan_id),
      eventi_ckan_id: str(reg.eventi_ckan_id, "rt-eventi-sistcult"),
      allerta_url: str(reg.allerta_url),
      cfr_url: str(reg.cfr_url),
      arpat_base_url: str(reg.arpat_base_url, "https://www.arpat.toscana.it"),
      nota: str(reg.nota),
    },
    features: {
      porto: bool(features.porto, false),
      balneazione: bool(features.balneazione, false),
      treni: bool(features.treni, false),
      gtfs_locale: bool(features.gtfs_locale, false),
      ciclabili_pedonali: bool(features.ciclabili_pedonali, true),
      eventi_comune: bool(features.eventi_comune, false),
      eventi_regionali: bool(features.eventi_regionali, false),
      turismo_flussi: bool(features.turismo_flussi, true),
      allerte: bool(features.allerte, true),
      allerte_toscana_sir: bool(features.allerte_toscana_sir, false),
      dae: bool(features.dae, true),
      dae_telegram: bool(features.dae_telegram, false),
      erosione_costiera: bool(features.erosione_costiera, false),
      assistente_rag: bool(features.assistente_rag, false),
      biblioteca: bool(features.biblioteca, false),
      arpat_aria: bool(features.arpat_aria, false),
      rifiuti_ispra: bool(features.rifiuti_ispra, true),
      acqua_sii: bool(features.acqua_sii, false),
    },
    gestori: {
      acqua: {
        nome: str(acqua.nome),
        url: str(acqua.url),
        etichette_map_url: str(acqua.etichette_map_url),
        fontanelle_map_url: str(acqua.fontanelle_map_url),
        composizione_url: str(acqua.composizione_url),
        geoserver_wfs: str(acqua.geoserver_wfs),
        etichette_layer: str(acqua.etichette_layer, "asa_geoserver:etichette"),
        fontanelle_layer: str(acqua.fontanelle_layer, "asa_geoserver:fontanelle"),
        fontanelle_aq_layer: str(
          acqua.fontanelle_aq_layer,
          "asa_geoserver:fontanelle_aq",
        ),
        ait_opendata_url: str(acqua.ait_opendata_url),
      },
      rifiuti: {
        nome: str(rifiuti.nome),
        url: str(rifiuti.url),
        calendario_url: str(rifiuti.calendario_url),
        centri_url: str(rifiuti.centri_url),
        centro_url: str(rifiuti.centro_url),
      },
    },
    eventi_filtro_extra: Array.isArray(c.eventi_filtro_extra)
      ? c.eventi_filtro_extra.filter((x): x is string => typeof x === "string")
      : [],
    fork: {
      // Default true: il repo originale è upstream finché un fork non lo spegne
      is_upstream: bool(fork.is_upstream, true),
      maintainer_name: str(fork.maintainer_name),
      maintainer_email: str(fork.maintainer_email),
      maintainer_url: str(fork.maintainer_url),
      github_repo_url: str(fork.github_repo_url),
    },
  };
}

export const COMUNE: ComuneConfig = parseConfig(raw);

export function isFeatureEnabled(key: keyof ComuneFeatures): boolean {
  return Boolean(COMUNE.features[key]);
}

/** Deploy ufficiale (San Vincenzo / magiaslab) vs fork di terze parti. */
export function isUpstreamDeploy(): boolean {
  return COMUNE.fork.is_upstream;
}

export function getForkMaintainer(): {
  name: string;
  email: string;
  url: string;
  github_repo_url: string;
} | null {
  if (COMUNE.fork.is_upstream) return null;
  const name = COMUNE.fork.maintainer_name.trim();
  if (!name) return null;
  return {
    name,
    email: COMUNE.fork.maintainer_email.trim(),
    url: COMUNE.fork.maintainer_url.trim(),
    github_repo_url: COMUNE.fork.github_repo_url.trim(),
  };
}

/** Tab UI da nascondere quando il modulo è spento. */
export function isTabEnabled(tabId: string): boolean {
  switch (tabId) {
    case "porto":
      return isFeatureEnabled("porto");
    default:
      return true;
  }
}

function normalizeMatchText(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}

function matchesNeedles(
  parts: Array<string | null | undefined>,
  needles: string[],
): boolean {
  const hay = normalizeMatchText(parts.filter(Boolean).join(" "));
  if (!hay) return false;
  return needles
    .map(normalizeMatchText)
    .filter(Boolean)
    .some((n) => hay.includes(n));
}

/** True se il testo coincide col nome/alias del comune (es. farmacie di turno). */
export function matchesComuneNome(
  ...parts: Array<string | null | undefined>
): boolean {
  return matchesNeedles(parts, [COMUNE.nome, ...COMUNE.nome_aliases]);
}

/** True se testo/luogo riguarda il comune configurato (o alias / extra). */
export function matchesComuneText(
  ...parts: Array<string | null | undefined>
): boolean {
  return matchesNeedles(parts, [
    COMUNE.nome,
    ...COMUNE.nome_aliases,
    ...COMUNE.eventi_filtro_extra,
  ]);
}

export function allertameteoApiUrl(): string {
  const name = encodeURIComponent(COMUNE.allerte.allertameteo_comune || COMUNE.nome);
  return `https://allertameteo.app/api/alert/${name}`;
}

export function allertameteoPageUrl(): string {
  const path = COMUNE.allerte.allertameteo_page_path.trim();
  if (path) return `https://allertameteo.app/${path.replace(/^\//, "")}`;
  return `https://allertameteo.app/`;
}

export type ComuneBbox = {
  lonMin: number;
  latMin: number;
  lonMax: number;
  latMax: number;
};

/** BBox territoriale: `geo.bbox` oppure cerchio intorno a `map_center`. */
export function getComuneBbox(): ComuneBbox {
  const explicit = COMUNE.geo.bbox;
  if (explicit) {
    return {
      lonMin: explicit[0],
      latMin: explicit[1],
      lonMax: explicit[2],
      latMax: explicit[3],
    };
  }
  const [lat, lon] = COMUNE.geo.map_center;
  const km = Math.max(COMUNE.geo.bbox_radius_km || 8, 1);
  const dLat = km / 111;
  const cos = Math.cos((lat * Math.PI) / 180);
  const dLon = km / (111 * Math.max(Math.abs(cos), 0.2));
  return {
    lonMin: lon - dLon,
    latMin: lat - dLat,
    lonMax: lon + dLon,
    latMax: lat + dLat,
  };
}

export function inComuneBbox(lat: number, lon: number): boolean {
  const b = getComuneBbox();
  return (
    lon >= b.lonMin && lon <= b.lonMax && lat >= b.latMin && lat <= b.latMax
  );
}
