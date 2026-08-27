import {
  AUTHOR,
  COMUNE_NOME,
  COMUNE_PROVINCIA,
  COMUNE_REGIONE,
  ISTAT_CODE,
} from "@/lib/constants";
import { COMUNE, isUpstreamDeploy } from "@/lib/comune-config";
import { PROJECT_ORIGIN } from "@/lib/project-origin";

/** Host pubblico preferito. Nei fork: `NEXT_PUBLIC_SITE_URL` o `brand.site_url`. */
function resolveCanonicalHost(): string | null {
  const fromBrand = COMUNE.brand.site_url?.trim();
  if (fromBrand) {
    try {
      return new URL(
        fromBrand.startsWith("http") ? fromBrand : `https://${fromBrand}`,
      ).host;
    } catch {
      /* fall through */
    }
  }
  if (isUpstreamDeploy()) {
    try {
      return new URL(PROJECT_ORIGIN.site_url).host;
    } catch {
      return "www.cruscottosanvincenzo.it";
    }
  }
  return null;
}

const CANONICAL_HOST = resolveCanonicalHost();

function normalizeSiteUrl(raw: string): string {
  const trimmed = raw.trim().replace(/\/$/, "");
  try {
    const url = new URL(
      trimmed.startsWith("http") ? trimmed : `https://${trimmed}`,
    );
    if (
      CANONICAL_HOST &&
      (url.hostname === "cruscottosanvincenzo.it" ||
        url.hostname === CANONICAL_HOST)
    ) {
      url.protocol = "https:";
      url.hostname = CANONICAL_HOST;
      url.pathname = "";
      url.search = "";
      url.hash = "";
      return url.origin;
    }
    return `${url.protocol}//${url.host}`;
  } catch {
    return trimmed;
  }
}

/** URL canonico del sito (senza slash finale). */
export function getSiteUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (fromEnv) return normalizeSiteUrl(fromEnv);

  const prod = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (prod) return normalizeSiteUrl(prod);

  const preview = process.env.VERCEL_URL?.trim();
  if (preview) return normalizeSiteUrl(preview);

  if (CANONICAL_HOST) return `https://${CANONICAL_HOST}`;
  return "http://localhost:3000";
}

function clipMeta(text: string, max = 155): string {
  const t = text.trim().replace(/\s+/g, " ");
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1).replace(/\s+\S*$/, "")}…`;
}

export const SITE_NAME = `Cruscotto ${COMUNE_NOME}`;

export const SITE_TITLE_DEFAULT = `${SITE_NAME} | Dati aperti (${COMUNE_PROVINCIA})`;

export const SITE_DESCRIPTION = clipMeta(
  `Dashboard indipendente (non ufficiale) dei dati aperti di ${COMUNE_NOME} (${COMUNE_PROVINCIA}): KPI AgID, mobilità, sanità, scuole, meteo e finanza.`,
);

export const SITE_KEYWORDS = [
  `cruscotto ${COMUNE_NOME}`,
  `${COMUNE_NOME} dati aperti`,
  "Cruscotto Italia",
  "AgID",
  COMUNE_PROVINCIA,
  COMUNE_REGIONE,
  `ISTAT ${ISTAT_CODE}`,
  "open data",
] as const;

export const OG_IMAGE = {
  path: "/og-image.jpg",
  width: 1200,
  height: 630,
  type: "image/jpeg" as const,
};

export function absoluteUrl(path = "/"): string {
  const base = getSiteUrl();
  if (!path || path === "/") return `${base}/`;
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

export function buildOgImages(alt: string) {
  return [
    {
      url: absoluteUrl(OG_IMAGE.path),
      width: OG_IMAGE.width,
      height: OG_IMAGE.height,
      type: OG_IMAGE.type,
      alt,
    },
  ];
}

/** JSON-LD WebSite + WebApplication per la homepage. */
export function buildHomeJsonLd() {
  const origin = getSiteUrl();
  const url = `${origin}/`;
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${origin}/#website`,
        url,
        name: SITE_NAME,
        description: SITE_DESCRIPTION,
        inLanguage: "it-IT",
        publisher: {
          "@type": "Person",
          name: AUTHOR.name,
          email: AUTHOR.email,
        },
      },
      {
        "@type": "WebApplication",
        "@id": `${origin}/#app`,
        name: SITE_NAME,
        url,
        applicationCategory: "DashboardApplication",
        operatingSystem: "Web",
        inLanguage: "it-IT",
        description: SITE_DESCRIPTION,
        isAccessibleForFree: true,
        image: absoluteUrl(OG_IMAGE.path),
        creator: {
          "@type": "Person",
          name: AUTHOR.name,
          email: AUTHOR.email,
        },
        about: {
          "@type": "City",
          name: COMUNE_NOME,
          containedInPlace: {
            "@type": "AdministrativeArea",
            name: `${COMUNE_PROVINCIA}, ${COMUNE_REGIONE}`,
          },
        },
        keywords: SITE_KEYWORDS.join(", "),
      },
    ],
  };
}

export function buildBreadcrumbJsonLd(
  items: Array<{ name: string; path: string }>,
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

function spatialCoverage() {
  return {
    "@type": "City" as const,
    name: COMUNE_NOME,
    containedInPlace: {
      "@type": "AdministrativeArea" as const,
      name: `${COMUNE_PROVINCIA}, ${COMUNE_REGIONE}`,
    },
  };
}

export type DatasetInput = {
  name: string;
  description: string;
  license?: string;
  creator: string;
  url?: string;
};

export function buildDatasetJsonLd(datasets: DatasetInput[]) {
  return datasets.map((d) => ({
    "@context": "https://schema.org",
    "@type": "Dataset",
    name: d.name,
    description: d.description,
    license: d.license,
    url: d.url,
    creator: { "@type": "Organization", name: d.creator },
    isAccessibleForFree: true,
    spatialCoverage: spatialCoverage(),
  }));
}

export function buildFaqJsonLd(
  items: Array<{ question: string; answer: string }>,
) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
}

/** Fonti Dataset per sezione dashboard (id interno). */
export function datasetsForSection(sectionId: string): DatasetInput[] {
  const c = COMUNE_NOME;
  const agid: DatasetInput = {
    name: "Cruscotto Italia (AgID)",
    description: `KPI comunali open data di ${c} da Cruscotto Italia.`,
    license: "https://creativecommons.org/licenses/by/4.0/",
    creator: "AgID",
    url: "https://cruscotto-italia.dati.gov.it/",
  };
  const osm: DatasetInput = {
    name: "OpenStreetMap",
    description: `Dati geografici e punti di interesse a ${c}.`,
    license: "https://opendatacommons.org/licenses/odbl/",
    creator: "OpenStreetMap contributors",
    url: "https://www.openstreetmap.org/copyright",
  };
  switch (sectionId) {
    case "sanita":
      return [
        agid,
        {
          name: "Farmacie di turno",
          description: `Farmacie di turno nel Comune di ${c}.`,
          creator: "Regione / Federfarma",
        },
        {
          name: "OpenAEDMap",
          description: `Defibrillatori automatici (DAE) a ${c}.`,
          license: "https://opendatacommons.org/licenses/odbl/",
          creator: "OpenAEDMap / OpenStreetMap",
          url: "https://openaedmap.org/",
        },
      ];
    case "disabilita":
      return [
        osm,
        {
          name: "Wheelmap",
          description: `Luoghi accessibili a ${c}.`,
          creator: "Sozialhelden / Wheelmap",
          url: "https://wheelmap.org/",
        },
      ];
    case "infra":
      return [
        agid,
        {
          name: "Trasporto pubblico (GTFS / ViaggiaTreno)",
          description: `Orari TPL e treni per ${c}.`,
          creator: "Operatori TPL / RFI",
        },
        {
          name: "Colonnine di ricarica (PUN)",
          description: `Punti di ricarica veicoli elettrici a ${c}.`,
          creator: "Piattaforma Unica Nazionale",
        },
      ];
    case "meteo":
      return [
        {
          name: "OpenWeather",
          description: `Previsioni e osservazioni meteo per ${c}.`,
          creator: "OpenWeather",
          url: "https://openweathermap.org/",
        },
        {
          name: "Allerte Protezione Civile",
          description: `Avvisi di allerta per il territorio di ${c}.`,
          creator: "Dipartimento della Protezione Civile",
        },
      ];
    case "ambiente":
      return [
        {
          name: "ARPAT / agenzie ambientali",
          description: `Balneazione e qualità ambientale a ${c}.`,
          creator: "ARPAT",
        },
        {
          name: "ISPRA rifiuti",
          description: `Indicatori rifiuti urbani di ${c}.`,
          creator: "ISPRA",
        },
      ];
    case "istruzione":
      return [
        agid,
        {
          name: "MIUR open data",
          description: `Scuole e istruzione a ${c}.`,
          creator: "Ministero dell'Istruzione",
          url: "https://dati.istruzione.it/",
        },
      ];
    case "finanza":
      return [
        agid,
        {
          name: "SIOPE / BDAP",
          description: `Finanza locale di ${c}.`,
          creator: "MEF / Ragioneria Generale dello Stato",
        },
        {
          name: "ANAC",
          description: `Contratti pubblici relativi a ${c}.`,
          creator: "ANAC",
        },
      ];
    case "economia":
      return [
        agid,
        {
          name: "ASIA / MEF redditi",
          description: `Imprese e redditi a ${c}.`,
          creator: "ISTAT / MEF",
        },
      ];
    case "mappa":
    case "territorio":
      return [osm, agid];
    default:
      return [agid];
  }
}

export function comeFunzionaFaq() {
  return [
    {
      question: `Il Cruscotto ${COMUNE_NOME} è un sito ufficiale del Comune?`,
      answer: `No. È un progetto indipendente e non ufficiale, non affiliato ad AgID, al Governo italiano o al Comune di ${COMUNE_NOME}. Aggrega dati pubblici aperti.`,
    },
    {
      question: "Da dove arrivano i dati?",
      answer:
        "La fonte principale è Cruscotto Italia (AgID), via MCP. Altre fonti (meteo, trasporti, ARPAT, mappe, MIUR) arrivano da API pubbliche dedicate, in sola lettura.",
    },
    {
      question: "Serve un account o un database?",
      answer:
        "No. Il cruscotto è solo lettura: nessun database proprio e nessuna autenticazione obbligatoria. Le route /api/* fanno da proxy e cache.",
    },
  ];
}
