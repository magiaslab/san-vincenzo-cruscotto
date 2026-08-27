import { COMUNE_NOME } from "@/lib/constants";
import { isTabEnabled } from "@/lib/comune-config";

/** Id interno delle tab (invariato). `infra` resta l’id; lo slug pubblico è `mobilita`. */
export type SectionId =
  | "panoramica"
  | "sanita"
  | "disabilita"
  | "infra"
  | "meteo"
  | "turismo"
  | "porto"
  | "ambiente"
  | "territorio"
  | "mappa"
  | "economia"
  | "istruzione"
  | "societa"
  | "finanza"
  | "partecipa"
  | "come-funziona"
  | "riusa"
  | "esempi"
  | "attribuzioni"
  | "sostieni";

export type SectionKind = "dashboard" | "project";

export type SectionDef = {
  id: SectionId;
  /** Path pubblico, es. `/sanita`. Panoramica = `/`. */
  path: string;
  /** Ultimo segmento, o null per la home. */
  slug: string | null;
  label: string;
  title: string;
  description: string;
  h1: string;
  intro: string;
  group: "evidenza" | "territorio" | "economia" | "progetto";
  kind: SectionKind;
};

const META_MAX = 155;

export function clipMetaDescription(text: string, max = META_MAX): string {
  const t = text.trim().replace(/\s+/g, " ");
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1).replace(/\s+\S*$/, "")}…`;
}

function d(
  id: SectionId,
  rest: Omit<SectionDef, "id" | "description"> & { description: string },
): SectionDef {
  return { id, ...rest, description: clipMetaDescription(rest.description) };
}

function sections(): SectionDef[] {
  const c = COMUNE_NOME;
  return [
    d("panoramica", {
      path: "/",
      slug: null,
      label: "Panoramica",
      title: `Panoramica — Cruscotto ${c}`,
      description: `Panoramica dei dati aperti di ${c}: KPI AgID, servizi utili e accesso alle sezioni. Progetto indipendente, non ufficiale.`,
      h1: `Cruscotto ${c}`,
      intro: `Dati aperti del Comune di ${c}, raccolti in un unico sito. Progetto indipendente, non ufficiale.`,
      group: "evidenza",
      kind: "dashboard",
    }),
    d("sanita", {
      path: "/sanita",
      slug: "sanita",
      label: "Sanità",
      title: `Sanità a ${c}`,
      description: `Sanità a ${c}: farmacie di turno, defibrillatori DAE e strutture. Dati aperti, progetto non ufficiale.`,
      h1: `Sanità a ${c}`,
      intro: `Farmacie di turno, mappa dei defibrillatori (DAE) e indicatori sanitari per ${c}. Fonti: Ministero della Salute, OpenAEDMap/OSM, farmacie di turno regionali.`,
      group: "evidenza",
      kind: "dashboard",
    }),
    d("disabilita", {
      path: "/disabilita",
      slug: "disabilita",
      label: "Disabilità",
      title: `Accessibilità e disabilità a ${c}`,
      description: `Accessibilità a ${c}: luoghi Wheelmap, barriere e servizi. Dati aperti, progetto non ufficiale.`,
      h1: `Disabilità e accessibilità a ${c}`,
      intro: `Luoghi accessibili, segnalazioni Wheelmap e informazioni utili per persone con disabilità a ${c}. Fonte principale: Wheelmap / OpenStreetMap.`,
      group: "evidenza",
      kind: "dashboard",
    }),
    d("infra", {
      path: "/mobilita",
      slug: "mobilita",
      label: "Mobilità",
      title: `Mobilità a ${c}`,
      description: `Mobilità a ${c}: treni, bus, colonnine EV, carburanti e banda ultralarga. Dati aperti, progetto non ufficiale.`,
      h1: `Mobilità a ${c}`,
      intro: `Trasporto pubblico, percorsi ciclabili e pedonali, colonnine di ricarica, carburanti e copertura FTTH a ${c}. Fonti: GTFS/TPL, ViaggiaTreno, PUN, MIMIT, AGCOM.`,
      group: "evidenza",
      kind: "dashboard",
    }),
    d("meteo", {
      path: "/meteo",
      slug: "meteo",
      label: "Meteo",
      title: `Meteo e allerte a ${c}`,
      description: `Meteo e allerte a ${c}: previsioni, radar e Protezione Civile. Dati aperti, progetto non ufficiale.`,
      h1: `Meteo e allerte a ${c}`,
      intro: `Previsioni, radar e avvisi di Protezione Civile per ${c}. Fonti: OpenWeather, Open-Meteo, Allerta Meteo / CFR regionale.`,
      group: "evidenza",
      kind: "dashboard",
    }),
    d("turismo", {
      path: "/turismo",
      slug: "turismo",
      label: "Turismo",
      title: `Turismo a ${c}`,
      description: `Turismo a ${c}: flussi, eventi e luoghi della cultura. Dati aperti, progetto non ufficiale.`,
      h1: `Turismo a ${c}`,
      intro: `Flussi turistici, eventi e luoghi della cultura a ${c}. Fonti: ISTAT/Regione, cataloghi open data e Ministero della Cultura.`,
      group: "territorio",
      kind: "dashboard",
    }),
    d("porto", {
      path: "/porto",
      slug: "porto",
      label: "Porto",
      title: `Porto di ${c}`,
      description: `Porto di ${c}: traffico AIS, webcam e dati marittimi. Dati aperti, progetto non ufficiale.`,
      h1: `Porto di ${c}`,
      intro: `Traffico navale, webcam e informazioni sul porto di ${c}. Fonti: AIS (VesselFinder) e pagine istituzionali del porto, se disponibili.`,
      group: "territorio",
      kind: "dashboard",
    }),
    d("ambiente", {
      path: "/ambiente",
      slug: "ambiente",
      label: "Ambiente",
      title: `Ambiente a ${c}`,
      description: `Ambiente a ${c}: balneazione, aria, rifiuti e acqua. Dati aperti, progetto non ufficiale.`,
      h1: `Ambiente a ${c}`,
      intro: `Qualità delle acque di balneazione, aria, rifiuti e servizio idrico a ${c}. Fonti: ARPAT/agenzie regionali, ISPRA, gestori locali.`,
      group: "territorio",
      kind: "dashboard",
    }),
    d("territorio", {
      path: "/territorio",
      slug: "territorio",
      label: "Territorio",
      title: `Territorio di ${c}`,
      description: `Territorio di ${c}: morfologia, rischio e rilievo 3D. Dati aperti, progetto non ufficiale.`,
      h1: `Territorio di ${c}`,
      intro: `Morfologia, rischio e vista 3D del territorio di ${c}. Fonti: CNR, Protezione Civile, dati aperti regionali.`,
      group: "territorio",
      kind: "dashboard",
    }),
    d("mappa", {
      path: "/mappa",
      slug: "mappa",
      label: "Mappa",
      title: `Mappa di ${c}`,
      description: `Mappa interattiva di ${c}: civici, DAE, trasporti e servizi. OpenStreetMap, progetto non ufficiale.`,
      h1: `Mappa di ${c}`,
      intro: `Mappa dei civici, defibrillatori, trasporti e altri layer geospaziali di ${c}. Sfondi © OpenStreetMap contributors (ODbL).`,
      group: "territorio",
      kind: "dashboard",
    }),
    d("economia", {
      path: "/economia",
      slug: "economia",
      label: "Economia",
      title: `Economia a ${c}`,
      description: `Economia a ${c}: imprese, redditi, PNRR e contratti. Dati aperti AgID, progetto non ufficiale.`,
      h1: `Economia a ${c}`,
      intro: `Imprese ASIA, redditi MEF, PNRR, contratti ANAC e opere BDAP per ${c}. Fonte principale: Cruscotto Italia (AgID).`,
      group: "economia",
      kind: "dashboard",
    }),
    d("istruzione", {
      path: "/istruzione",
      slug: "istruzione",
      label: "Istruzione",
      title: `Istruzione a ${c}`,
      description: `Istruzione a ${c}: scuole e indicatori MIUR. Dati aperti, progetto non ufficiale.`,
      h1: `Istruzione a ${c}`,
      intro: `Scuole e indicatori di istruzione a ${c}. Fonti: MIUR open data e Cruscotto Italia (AgID).`,
      group: "economia",
      kind: "dashboard",
    }),
    d("societa", {
      path: "/societa",
      slug: "societa",
      label: "Società",
      title: `Società a ${c}`,
      description: `Società a ${c}: demografia, terzo settore e servizi. Dati aperti AgID, progetto non ufficiale.`,
      h1: `Società a ${c}`,
      intro: `Demografia, terzo settore (RUNTS) e indicatori sociali di ${c}. Fonte principale: Cruscotto Italia (AgID) e ISTAT.`,
      group: "economia",
      kind: "dashboard",
    }),
    d("finanza", {
      path: "/finanza",
      slug: "finanza",
      label: "Finanza",
      title: `Finanza pubblica a ${c}`,
      description: `Finanza pubblica a ${c}: SIOPE, bilanci e spesa. Dati aperti, progetto non ufficiale.`,
      h1: `Finanza pubblica a ${c}`,
      intro: `Entrate, spese e indicatori di finanza locale per ${c}. Fonti: SIOPE, BDAP, DoveVannoINostriSoldi e Cruscotto Italia (AgID).`,
      group: "economia",
      kind: "dashboard",
    }),
    d("partecipa", {
      path: "/partecipa",
      slug: "partecipa",
      label: "Partecipa",
      title: `Partecipa al Cruscotto ${c}`,
      description: `Suggerimenti e segnalazioni sul Cruscotto ${c}. Progetto indipendente, non ufficiale.`,
      h1: `Partecipa al Cruscotto ${c}`,
      intro: `Come proporre miglioramenti, segnalare errori o nuovi dati per il cruscotto di ${c}.`,
      group: "progetto",
      kind: "project",
    }),
    d("come-funziona", {
      path: "/come-funziona",
      slug: "come-funziona",
      label: "Come funziona",
      title: `Come funziona il Cruscotto ${c}`,
      description: `Come è fatto il Cruscotto ${c}: da dove arrivano i numeri e come leggerli. Progetto indipendente, non ufficiale.`,
      h1: `Come funziona il Cruscotto ${c}`,
      intro: `Come è fatto il Cruscotto ${c}: da dove arrivano i numeri, cosa non è, e come leggerlo.`,
      group: "progetto",
      kind: "project",
    }),
    d("riusa", {
      path: "/riusa",
      slug: "riusa",
      label: "Porta nel tuo comune",
      title: `Porta il cruscotto in un altro comune`,
      description: `Come copiare il cruscotto per un altro comune italiano, anche senza programmare. GitHub, Vercel e file del comune. Progetto non ufficiale.`,
      h1: `Porta il cruscotto nel tuo comune`,
      intro: `Guida passo passo, anche per chi non programma: account gratuiti, duplica il progetto, pubblica il sito.`,
      group: "progetto",
      kind: "project",
    }),
    d("esempi", {
      path: "/esempi",
      slug: "esempi",
      label: "Cruscotti online",
      title: "Cruscotti comunali già online",
      description:
        "I cruscotti già pubblicati (San Vincenzo, Campiglia Marittima) e quelli in lavorazione. Progetto indipendente, non ufficiale.",
      h1: "Cruscotti online",
      intro:
        "I comuni che hanno già un cruscotto pubblico, e quelli ancora in anteprima.",
      group: "progetto",
      kind: "project",
    }),
    d("attribuzioni", {
      path: "/attribuzioni",
      slug: "attribuzioni",
      label: "Attribuzioni e regole",
      title: `Attribuzioni del Cruscotto ${c}`,
      description: `Fonti, licenze e regole d'uso del Cruscotto ${c}. AgID, OSM e altre fonti open. Progetto non ufficiale.`,
      h1: `Attribuzioni e regole del Cruscotto ${c}`,
      intro: `Fonti dati, licenze e condizioni d'uso del cruscotto di ${c}.`,
      group: "progetto",
      kind: "project",
    }),
    d("sostieni", {
      path: "/sostieni",
      slug: "sostieni",
      label: "Supporto",
      title: `Supporto — Cruscotto ${c}`,
      description: `Come sostenere il Cruscotto ${c}: un caffè per hosting e dominio, o una segnalazione. Progetto indipendente, non ufficiale.`,
      h1: `Supporto al Cruscotto ${c}`,
      intro: `Niente budget pubblico: un contributo volontario copre hosting e dominio. Non è una donazione al Comune di ${c}.`,
      group: "progetto",
      kind: "project",
    }),
  ];
}

let cache: SectionDef[] | null = null;

export function getSections(): SectionDef[] {
  if (!cache) cache = sections();
  return cache;
}

export function getSection(id: SectionId): SectionDef {
  const found = getSections().find((s) => s.id === id);
  if (!found) throw new Error(`Sezione sconosciuta: ${id}`);
  return found;
}

export function isSectionId(v: string): v is SectionId {
  return getSections().some((s) => s.id === v);
}

/** Risolve uno slug URL (`mobilita`, `sanita`, anche alias `infra`). */
export function getSectionBySlug(slug: string): SectionDef | undefined {
  const key = slug.replace(/^\/+/, "");
  if (key === "infra") return getSection("infra");
  return getSections().find((s) => s.slug === key);
}

export function sectionPath(id: SectionId): string {
  return getSection(id).path;
}

export function sectionIdFromPathname(pathname: string): SectionId {
  const clean = pathname.replace(/\/$/, "") || "/";
  if (clean === "/") return "panoramica";
  const slug = clean.slice(1);
  return getSectionBySlug(slug)?.id ?? "panoramica";
}

const RESERVED_SLUGS = new Set([
  "api",
  "icons",
  "icon",
  "apple-icon",
  "favicon.svg",
  "sitemap.xml",
  "robots.txt",
  "manifest.webmanifest",
  "og-image.jpg",
]);

/** Sezioni dashboard con URL proprio (non home, non pagine progetto già statiche). */
export function indexableDashboardSections(): SectionDef[] {
  return getSections().filter(
    (s) =>
      s.kind === "dashboard" &&
      s.slug &&
      !RESERVED_SLUGS.has(s.slug) &&
      isTabEnabled(s.id),
  );
}

export function sitemapSectionPaths(): string[] {
  return getSections()
    .filter((s) => s.kind === "dashboard" && isTabEnabled(s.id))
    .map((s) => s.path);
}

export const NAV_GROUP_DEFS: {
  label: string;
  group: SectionDef["group"];
  ids: SectionId[];
}[] = [
  {
    label: "In evidenza",
    group: "evidenza",
    ids: ["panoramica", "sanita", "disabilita", "infra", "meteo"],
  },
  {
    label: "Territorio",
    group: "territorio",
    ids: ["turismo", "porto", "ambiente", "territorio", "mappa"],
  },
  {
    label: "Economia e società",
    group: "economia",
    ids: ["economia", "istruzione", "societa", "finanza"],
  },
  {
    label: "Progetto",
    group: "progetto",
    ids: [
      "partecipa",
      "sostieni",
      "come-funziona",
      "esempi",
      "riusa",
      "attribuzioni",
    ],
  },
];
