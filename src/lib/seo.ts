import {
  AUTHOR,
  COMUNE_NOME,
  COMUNE_PROVINCIA,
  COMUNE_REGIONE,
  ISTAT_CODE,
} from "@/lib/constants";

/** URL canonico del sito (senza slash finale). */
export function getSiteUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (fromEnv) return fromEnv.replace(/\/$/, "");

  const prod = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (prod) return `https://${prod.replace(/^https?:\/\//, "")}`;

  const preview = process.env.VERCEL_URL?.trim();
  if (preview) return `https://${preview.replace(/^https?:\/\//, "")}`;

  return "https://san-vincenzo-cruscotto.vercel.app";
}

export const SITE_NAME = `Cruscotto ${COMUNE_NOME}`;

export const SITE_TITLE_DEFAULT = `${SITE_NAME} | Dati aperti (${COMUNE_PROVINCIA})`;

export const SITE_DESCRIPTION =
  `Dashboard indipendente dei dati aperti del Comune di ${COMUNE_NOME} (${COMUNE_PROVINCIA}, ${COMUNE_REGIONE}). KPI, mobilità, sanità, scuole, meteo e finanza pubblica da Cruscotto Italia (AgID) e fonti open data. Progetto non ufficiale.`;

export const SITE_KEYWORDS = [
  `cruscotto ${COMUNE_NOME}`,
  `${COMUNE_NOME} dati aperti`,
  `open data ${COMUNE_NOME}`,
  `KPI comunale ${COMUNE_NOME}`,
  "Cruscotto Italia",
  "AgID",
  "Livorno",
  "Toscana",
  `ISTAT ${ISTAT_CODE}`,
  "farmacie di turno",
  "carburanti",
  "FTTH",
  "balneazione ARPAT",
] as const;

export function absoluteUrl(path = "/"): string {
  const base = getSiteUrl();
  if (!path || path === "/") return base;
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
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
