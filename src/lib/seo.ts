import {
  AUTHOR,
  COMUNE_NOME,
  COMUNE_PROVINCIA,
  COMUNE_REGIONE,
  ISTAT_CODE,
} from "@/lib/constants";
import { COMUNE, isComuneConfigured, isLandingSite } from "@/lib/comune-config";
import { PROJECT_ORIGIN } from "@/lib/project-origin";
import { getProductName, getProductTagline } from "@/lib/product";

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
  if (COMUNE.fork.is_upstream) {
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
    if (CANONICAL_HOST && url.hostname === CANONICAL_HOST) {
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

export const SITE_NAME = isLandingSite()
  ? getProductName()
  : `Cruscotto ${COMUNE_NOME}`;

export const SITE_TITLE_DEFAULT = isLandingSite()
  ? `${SITE_NAME} — ${getProductTagline()}`
  : `${SITE_NAME} | Dati aperti (${COMUNE_PROVINCIA})`;

export const SITE_DESCRIPTION = isLandingSite()
  ? `${getProductName()}: template open source per pubblicare una dashboard di dati aperti comunali. Nato dal Cruscotto San Vincenzo. Progetto indipendente, non ufficiale.`
  : `Dashboard indipendente dei dati aperti del Comune di ${COMUNE_NOME} (${COMUNE_PROVINCIA}, ${COMUNE_REGIONE}). KPI, mobilità e TPL, accessibilità, sanità, scuole, meteo e allerte, finanza pubblica da Cruscotto Italia (AgID) e fonti open data. Progetto non ufficiale.`;

export const SITE_KEYWORDS = isLandingSite()
  ? ([
      "Cruscotto Comune",
      "open data comunale",
      "dati aperti comuni italiani",
      "Cruscotto Italia",
      "AgID",
      "dashboard comunale",
      "riuso open source",
      "fork cruscotto",
      "ISTAT",
      "PA digitale",
    ] as const)
  : ([
      `cruscotto ${COMUNE_NOME}`,
      `${COMUNE_NOME} dati aperti`,
      `open data ${COMUNE_NOME}`,
      `KPI comunale ${COMUNE_NOME}`,
      "Cruscotto Italia",
      "AgID",
      COMUNE_PROVINCIA,
      COMUNE_REGIONE,
      `ISTAT ${ISTAT_CODE}`,
      "farmacie di turno",
      "allerte meteo",
      "dati aperti",
    ] as const);

export const OG_IMAGE = {
  path: "/og-image.jpg",
  width: 1200,
  height: 630,
  type: "image/jpeg" as const,
};

export function absoluteUrl(path = "/"): string {
  const base = getSiteUrl();
  if (!path || path === "/") return base;
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
  const url = getSiteUrl();
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${url}/#website`,
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
        "@id": `${url}/#app`,
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
        about: isLandingSite()
          ? {
              "@type": "SoftwareApplication",
              name: SITE_NAME,
              applicationCategory: "DashboardApplication",
            }
          : isComuneConfigured()
            ? {
                "@type": "City",
                name: COMUNE_NOME,
                containedInPlace: {
                  "@type": "AdministrativeArea",
                  name: `${COMUNE_PROVINCIA}, ${COMUNE_REGIONE}`,
                },
              }
            : undefined,
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
