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
  assistente_rag: boolean;
  biblioteca: boolean;
  arpat_aria: boolean;
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
      dae_geojson: str(urls.dae_geojson, "/data/dae-san-vincenzo.geojson"),
      ciclabili_geojson_local: str(
        urls.ciclabili_geojson_local,
        "/data/ciclabili-san-vincenzo.geojson",
      ),
      pedonali_geojson_local: str(
        urls.pedonali_geojson_local,
        "/data/pedonali-san-vincenzo.geojson",
      ),
      trasporti_gtfs_local: str(
        urls.trasporti_gtfs_local,
        "/data/trasporti-gtfs-sv.json",
      ),
    },
    brand: {
      stemma_path: str(brand.stemma_path, "/stemma-san-vincenzo.png"),
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
      ciclabili_pedonali: bool(features.ciclabili_pedonali, false),
      eventi_comune: bool(features.eventi_comune, false),
      eventi_regionali: bool(features.eventi_regionali, false),
      turismo_flussi: bool(features.turismo_flussi, true),
      allerte: bool(features.allerte, true),
      allerte_toscana_sir: bool(features.allerte_toscana_sir, false),
      dae: bool(features.dae, true),
      dae_telegram: bool(features.dae_telegram, false),
      assistente_rag: bool(features.assistente_rag, false),
      biblioteca: bool(features.biblioteca, false),
      arpat_aria: bool(features.arpat_aria, false),
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

/** True se testo/luogo riguarda il comune configurato (o alias / extra). */
export function matchesComuneText(...parts: Array<string | null | undefined>): boolean {
  const hay = parts
    .filter(Boolean)
    .join(" ")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "");
  const needles = [
    COMUNE.nome,
    ...COMUNE.nome_aliases,
    ...COMUNE.eventi_filtro_extra,
  ]
    .map((s) =>
      s
        .toLowerCase()
        .normalize("NFD")
        .replace(/\p{M}/gu, ""),
    )
    .filter(Boolean);
  return needles.some((n) => hay.includes(n));
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
