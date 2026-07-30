import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { JsonLd } from "@/components/JsonLd";
import {
  AUTHOR,
  COMUNE_NOME,
  CRUSCOTTO_ITALIA_URL,
  GITHUB_REPO_URL,
  ISTAT_CODE,
  VERCEL_DEPLOY_URL,
} from "@/lib/constants";
import {
  SITE_NAME,
  absoluteUrl,
  buildBreadcrumbJsonLd,
  buildOgImages,
} from "@/lib/seo";

const GITHUB_FORK_URL = `${GITHUB_REPO_URL}/fork`;
const GITHUB_DOCS_RIUSO_URL = `${GITHUB_REPO_URL}/blob/master/docs/riuso-fork.md`;
const GITHUB_CONFIG_EXAMPLE_URL = `${GITHUB_REPO_URL}/blob/master/config/comune.example.json`;

const PAGE_DESCRIPTION =
  `Come forkare e riusare il ${SITE_NAME} per un altro comune: stack, checklist ISTAT e guida ai moduli personalizzati.`;

export const metadata: Metadata = {
  title: "Riusa / fork",
  description: PAGE_DESCRIPTION,
  alternates: {
    canonical: "/riusa",
  },
  openGraph: {
    title: `Riusa / fork | ${SITE_NAME}`,
    description: PAGE_DESCRIPTION,
    url: absoluteUrl("/riusa"),
    type: "article",
    siteName: SITE_NAME,
    locale: "it_IT",
    images: buildOgImages(`${SITE_NAME} — riusa e fork`),
  },
  twitter: {
    card: "summary_large_image",
    title: `Riusa / fork | ${SITE_NAME}`,
    description: PAGE_DESCRIPTION,
    images: [absoluteUrl("/og-image.jpg")],
  },
  robots: {
    index: true,
    follow: true,
  },
};

function Section({
  title,
  id,
  children,
}: {
  title: string;
  id?: string;
  children: ReactNode;
}) {
  return (
    <section className="mb-10" id={id}>
      <h2 className="mb-3 text-lg font-bold text-[var(--pa-ink)] sm:text-xl">
        {title}
      </h2>
      <div className="space-y-3 text-sm leading-relaxed text-[var(--pa-ink)] sm:text-base">
        {children}
      </div>
    </section>
  );
}

const CORE_FIELDS: { campo: string; esempio: string; dove: string }[] = [
  {
    campo: "ISTAT_CODE",
    esempio: ISTAT_CODE,
    dove: "src/lib/constants.ts → MCP Cruscotto Italia",
  },
  {
    campo: "COMUNE_NOME / PROVINCIA / REGIONE",
    esempio: `${COMUNE_NOME} / LI / Toscana`,
    dove: "constants, header, SEO, footer",
  },
  {
    campo: "MAP_CENTER · METEO_LAT/LON",
    esempio: "43.085, 10.54",
    dove: "mappe Leaflet, meteo, radar",
  },
  {
    campo: "MIUR_COMUNE_CATASTALE",
    esempio: "I390",
    dove: "scuole MIUR",
  },
  {
    campo: "FARMACIE_DI_TURNO_COD",
    esempio: "49018 (ISTAT senza lo 0)",
    dove: "farmacie di turno",
  },
  {
    campo: "Stemma + NEXT_PUBLIC_SITE_URL",
    esempio: "public/stemma-… · URL del dominio",
    dove: "brand e SEO/PWA",
  },
];

const OPTIONAL_MODULES: { area: string; cerca: string }[] = [
  {
    area: "Allerte meteo",
    cerca: "ALLERTA_METEO_*, /api/meteo/allerte — URL zona Protezione Civile / regione",
  },
  {
    area: "Trasporti e treni",
    cerca: "build-trasporti-gtfs.mjs, FS_STAZIONE_*, /api/trasporti/treni (ViaggiaTreno)",
  },
  {
    area: "DAE / Telegram",
    cerca: "dae:sync, public/data/dae-*.geojson, TELEGRAM_* env",
  },
  {
    area: "Open data comunale",
    cerca: "URL ldpgis, eventi, webcam porto, Visit…",
  },
  {
    area: "Ambiente / turismo regionale",
    cerca: "ARPAT, GTFS regionale, flussi turismo CKAN",
  },
  {
    area: "Assistente RAG",
    cerca: "modal_rag/, ASSISTENTE_MODAL_URL, corpus locale",
  },
  {
    area: "Testi i18n",
    cerca: "stringhe con il nome del comune in pannelli e src/lib/i18n/en.ts",
  },
];

export default function RiusaPage() {
  return (
    <>
      <JsonLd
        data={buildBreadcrumbJsonLd([
          { name: SITE_NAME, path: "/" },
          { name: "Riusa / fork", path: "/riusa" },
        ])}
      />
      <Header brandAsHeading={false} />
      <main className="flex-1">
        <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-8">
          <nav aria-label="Breadcrumb" className="mb-2 text-sm">
            <ol className="m-0 flex list-none flex-wrap gap-1 p-0 text-[var(--pa-muted)]">
              <li>
                <Link
                  href="/"
                  className="text-[var(--pa-primary)] underline underline-offset-2"
                >
                  Cruscotto
                </Link>
                <span aria-hidden className="mx-1">
                  /
                </span>
              </li>
              <li aria-current="page">Riusa / fork</li>
            </ol>
          </nav>

          <h1 className="mb-2 text-2xl font-bold text-[var(--pa-ink)] sm:text-3xl">
            Riusa questo cruscotto
          </h1>
          <p className="mb-8 text-[var(--pa-muted)]">
            Guida per duplicare lo stack su un altro comune italiano: fork del
            repository, checklist dei dati essenziali e cosa personalizzare in
            seguito. Non serve replicare ogni pannello locale di {COMUNE_NOME}.
          </p>

          <Section title="In sintesi" id="sintesi">
            <p>
              Questo sito è un cruscotto <strong>monocomune</strong> open data
              (un deploy = un comune), alimentato in larga parte da{" "}
              <a
                className="underline"
                href={CRUSCOTTO_ITALIA_URL}
                target="_blank"
                rel="noopener noreferrer"
              >
                Cruscotto Italia (AgID)
              </a>{" "}
              via codice ISTAT. Il riuso consigliato è:{" "}
              <strong>fork → cambia identità comunale → deploy</strong>, poi
              aggiungi solo i moduli locali che ti servono.
            </p>
            <ul className="m-0 flex list-none flex-wrap gap-3 p-0">
              <li>
                <a
                  href={GITHUB_FORK_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-11 items-center rounded-lg border border-[var(--pa-border)] bg-white px-3 py-2 text-sm font-semibold text-[var(--pa-ink)] no-underline transition hover:border-[var(--pa-primary)] hover:text-[var(--pa-primary)]"
                >
                  Fork su GitHub
                </a>
              </li>
              <li>
                <a
                  href={GITHUB_REPO_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-11 items-center rounded-lg border border-[var(--pa-border)] bg-white px-3 py-2 text-sm font-semibold text-[var(--pa-ink)] no-underline transition hover:border-[var(--pa-primary)] hover:text-[var(--pa-primary)]"
                >
                  Repository sorgente
                </a>
              </li>
              <li>
                <a
                  href={GITHUB_DOCS_RIUSO_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-11 items-center rounded-lg border border-[var(--pa-border)] bg-white px-3 py-2 text-sm font-semibold text-[var(--pa-ink)] no-underline transition hover:border-[var(--pa-primary)] hover:text-[var(--pa-primary)]"
                >
                  docs/riuso-fork.md
                </a>
              </li>
              <li>
                <a
                  href={VERCEL_DEPLOY_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-11 items-center rounded-lg border border-[var(--pa-border)] bg-white px-3 py-2 text-sm font-semibold text-[var(--pa-ink)] no-underline transition hover:border-[var(--pa-primary)] hover:text-[var(--pa-primary)]"
                >
                  Esempio deploy Vercel
                </a>
              </li>
            </ul>
          </Section>

          <Section title="Come duplicare il repo" id="duplicare">
            <p>
              <strong>Opzione A — Fork GitHub</strong> (consigliata): dal pulsante
              sopra crei una copia sotto il tuo account/organizzazione, poi
              colleghi Vercel al nuovo repo.
            </p>
            <p>
              <strong>Opzione B — Nuovo repository</strong> (mirror pulito):
            </p>
            <pre className="overflow-x-auto rounded-lg border border-[var(--pa-border)] bg-white p-3 text-xs leading-relaxed sm:text-sm">
              {`git clone --depth 1 ${GITHUB_REPO_URL}.git mio-cruscotto
cd mio-cruscotto
rm -rf .git && git init
git remote add origin git@github.com:TUO_USER/mio-cruscotto.git
git add -A && git commit -m "Fork iniziale cruscotto comunale"
git push -u origin main`}
            </pre>
            <p>
              Checklist dati di esempio (non ancora caricata a runtime):{" "}
              <a
                className="underline"
                href={GITHUB_CONFIG_EXAMPLE_URL}
                target="_blank"
                rel="noopener noreferrer"
              >
                config/comune.example.json
              </a>
              . Copia i valori in{" "}
              <code>src/lib/constants.ts</code> e negli asset indicati.
            </p>
            <p className="text-[var(--pa-muted)]">
              Per l’architettura dello stack vedi anche{" "}
              <Link href="/come-funziona" className="underline">
                Come funziona
              </Link>
              .
            </p>
          </Section>

          <Section title="Minimo indispensabile" id="minimo">
            <p>
              Con questi cambi il nucleo KPI (MCP AgID) e la shell del dashboard
              puntano al nuovo comune. Non serve riscrivere React.
            </p>
            <div className="overflow-x-auto rounded-lg border border-[var(--pa-border)] bg-white">
              <table className="w-full min-w-[28rem] border-collapse text-left text-sm">
                <caption className="sr-only">
                  Campi minimi da aggiornare per un nuovo comune
                </caption>
                <thead>
                  <tr className="border-b border-[var(--pa-border)] bg-[var(--pa-surface-soft)]">
                    <th scope="col" className="px-3 py-2.5 font-bold">
                      Campo
                    </th>
                    <th scope="col" className="px-3 py-2.5 font-bold">
                      Esempio ({COMUNE_NOME})
                    </th>
                    <th scope="col" className="px-3 py-2.5 font-bold">
                      Dove
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {CORE_FIELDS.map((row) => (
                    <tr
                      key={row.campo}
                      className="border-b border-[var(--pa-border)] last:border-b-0"
                    >
                      <td className="px-3 py-2.5 align-top">
                        <code className="text-xs sm:text-sm">{row.campo}</code>
                      </td>
                      <td className="px-3 py-2.5 align-top text-[var(--pa-muted)]">
                        {row.esempio}
                      </td>
                      <td className="px-3 py-2.5 align-top text-[var(--pa-muted)]">
                        {row.dove}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <ol className="list-decimal space-y-1 pl-5">
              <li>
                Aggiorna constants, stemma e <code>NEXT_PUBLIC_SITE_URL</code>
              </li>
              <li>
                <code>npm install && npm run dev</code>
              </li>
              <li>
                Smoke test:{" "}
                <code>curl -s localhost:3000/api/kpi</code> deve restituire
                demografia del tuo ISTAT
              </li>
              <li>Deploy su Vercel (nessuna env obbligatoria per il solo MCP)</li>
            </ol>
          </Section>

          <Section title="Moduli personalizzati (opzionali)" id="moduli">
            <p>
              Porto, balneazione, GTFS regionale, bot DAE, RAG, eventi comunali
              sono <strong>extra</strong>: nel fork puoi lasciarli, spegnerli o
              sostituirli. Cerca questi punti nel codice.
            </p>
            <ul className="m-0 list-none space-y-3 p-0">
              {OPTIONAL_MODULES.map((m) => (
                <li
                  key={m.area}
                  className="rounded-lg border border-[var(--pa-border)] bg-white px-3 py-3 sm:px-4"
                >
                  <p className="m-0 font-bold">{m.area}</p>
                  <p className="mb-0 mt-1 text-sm text-[var(--pa-muted)]">
                    {m.cerca}
                  </p>
                </li>
              ))}
            </ul>
            <p>
              Non c’è l’obbligo di portare tutto a parità di {COMUNE_NOME}: un
              MVP utile è spesso “KPI nazionali + mappa + 1–2 fonti locali”.
            </p>
          </Section>

          <Section title="Cosa non fare" id="limiti">
            <ul className="list-disc space-y-2 pl-5">
              <li>
                Non aspettarti un selettore multi-comune out-of-the-box: un
                deploy resta dedicato a un ISTAT.
              </li>
              <li>
                Non rimuovere disclaimer e{" "}
                <Link href="/attribuzioni" className="underline">
                  attribuzioni
                </Link>
                : resta un progetto indipendente sulle fonti citate.
              </li>
              <li>
                Non committare token (<code>TELEGRAM_*</code>,{" "}
                <code>GITHUB_TOKEN</code>, chiavi meteo): usa env su Vercel.
              </li>
            </ul>
            <p>
              Domande sul riuso:{" "}
              <a className="underline" href={`mailto:${AUTHOR.email}`}>
                {AUTHOR.email}
              </a>{" "}
              oppure{" "}
              <Link href="/#partecipa" className="underline">
                Partecipa
              </Link>
              .
            </p>
          </Section>
        </div>
      </main>
      <Footer />
    </>
  );
}
