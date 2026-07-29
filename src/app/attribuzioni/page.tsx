import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { JsonLd } from "@/components/JsonLd";
import {
  ARPAT_BALNEAZIONE_URL,
  ARPAT_OPENDATA_URL,
  AUTHOR,
  CARTO_ATTRIBUTION_URL,
  COMUNE_NOME,
  CRUSCOTTO_ITALIA_URL,
  FARMACIE_DI_TURNO_URL,
  MINISTERO_CULTURA_URL,
  MIUR_ESPLORA_URL,
  MIUR_OPENDATA_URL,
  OPEN_METEO_ATTRIBUTION_URL,
  OSM_COPYRIGHT_URL,
  RAINVIEWER_ATTRIBUTION_URL,
  REGIONE_TOSCANA_OPENDATA_URL,
  STEMMA,
} from "@/lib/constants";
import {
  SITE_NAME,
  absoluteUrl,
  buildBreadcrumbJsonLd,
} from "@/lib/seo";

const ATTRIBUZIONI_DESCRIPTION =
  `Fonti dati, licenze, attribuzioni e regole d'uso del ${SITE_NAME}: Cruscotto Italia (AgID), ARPAT, MIUR, OpenStreetMap e altre fonti open.`;

export const metadata: Metadata = {
  title: "Attribuzioni e regole",
  description: ATTRIBUZIONI_DESCRIPTION,
  alternates: {
    canonical: "/attribuzioni",
  },
  openGraph: {
    title: `Attribuzioni e regole | ${SITE_NAME}`,
    description: ATTRIBUZIONI_DESCRIPTION,
    url: absoluteUrl("/attribuzioni"),
    type: "article",
  },
  twitter: {
    card: "summary",
    title: `Attribuzioni e regole | ${SITE_NAME}`,
    description: ATTRIBUZIONI_DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
  },
};

function Section({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="mb-8">
      <h2 className="mb-3 text-lg font-bold text-[#17324d] sm:text-xl">{title}</h2>
      <div className="space-y-3 text-sm leading-relaxed text-[#17324d] sm:text-base">
        {children}
      </div>
    </section>
  );
}

export default function AttribuzioniPage() {
  return (
    <>
      <JsonLd
        data={buildBreadcrumbJsonLd([
          { name: SITE_NAME, path: "/" },
          { name: "Attribuzioni e regole", path: "/attribuzioni" },
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
              <li aria-current="page">Attribuzioni e regole</li>
            </ol>
          </nav>
          <h1 className="mb-2 text-2xl font-bold text-[var(--pa-ink)] sm:text-3xl">
            Attribuzioni e regole
          </h1>
          <p className="mb-8 text-[#5b6f82]">
            Fonti, licenze e condizioni d&apos;uso del Cruscotto {COMUNE_NOME}.
          </p>

          <Section title="Progetto non ufficiale">
            <p>
              Questo sito è un <strong>progetto indipendente</strong>, non
              affiliato ad AgID, al Governo italiano o al Comune di San
              Vincenzo. Riaggrega dati pubblici aperti provenienti da Cruscotto
              Italia e dalle fonti citate di seguito.
            </p>
            <p>
              Realizzato da{" "}
              <a
                className="text-[#0066CC] underline"
                href={`mailto:${AUTHOR.email}`}
              >
                {AUTHOR.name}
              </a>
              .
            </p>
          </Section>

          <Section title="Accuratezza dei dati">
            <p>
              I dati sono riportati così come pubblicati dalle fonti ufficiali
              al momento dell&apos;ultima estrazione, senza garanzia di
              completezza, correttezza o aggiornamento in tempo reale. Per usi
              ufficiali o legali fare sempre riferimento alle fonti primarie.
            </p>
          </Section>

          <Section title="Cruscotto Italia (AgID)">
            <p>
              Fonte principale dei KPI comunali:{" "}
              <a
                className="text-[#0066CC] underline"
                href={CRUSCOTTO_ITALIA_URL}
                target="_blank"
                rel="noopener noreferrer"
              >
                cruscotto-italia.dati.gov.it
              </a>
              . Fonti federate tipiche: ANAC, BDAP-MOP, SIOPE, Italia Domani,
              ISTAT, ISPRA, MIUR, ACI, MEF, GSE/MASE, AGCOM, MIMIT, Ministero
              del Lavoro, Ministero della Salute, Agenzia delle Entrate,
              Protezione Civile, ItaliaMeteo/Cineca. Licenza contenuti CC-BY
              4.0 (ove non diversamente indicato).
            </p>
            <p>
              Cruscotto Italia è progettato e sviluppato da{" "}
              <a
                className="text-[#0066CC] underline"
                href="https://github.com/piersoft"
                target="_blank"
                rel="noopener noreferrer"
              >
                Francesco Piero Paolicelli (Piersoft)
              </a>{" "}
              per AgID. Codice sorgente{" "}
              <a
                className="text-[#0066CC] underline"
                href="https://github.com/AgID/cruscotto-italia"
                target="_blank"
                rel="noopener noreferrer"
              >
                su GitHub
              </a>{" "}
              (AGPL-3.0).
            </p>
          </Section>

          <Section title="Fonti aggiuntive">
            <ul className="list-disc space-y-2 pl-5">
              <li>
                <a
                  className="text-[#0066CC] underline"
                  href={ARPAT_OPENDATA_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  ARPAT
                </a>{" "}
                — aria;{" "}
                <a
                  className="text-[#0066CC] underline"
                  href={ARPAT_BALNEAZIONE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  balneazione
                </a>
              </li>
              <li>
                <a
                  className="text-[#0066CC] underline"
                  href={REGIONE_TOSCANA_OPENDATA_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Regione Toscana Open Data
                </a>{" "}
                — eventi culturali e dataset territoriali
              </li>
              <li>
                <a
                  className="text-[#0066CC] underline"
                  href={MINISTERO_CULTURA_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Ministero della Cultura
                </a>{" "}
                — luoghi e beni culturali
              </li>
              <li>
                <a
                  className="text-[#0066CC] underline"
                  href={MIUR_OPENDATA_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Portale Unico dei Dati della Scuola (MIUR)
                </a>{" "}
                (
                <a
                  className="text-[#0066CC] underline"
                  href={MIUR_ESPLORA_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Esplora i dati
                </a>
                ) — anagrafe scuole, alunni/classi e infanzia per San Vincenzo
                (IODL 2.0)
              </li>
              <li>
                <a
                  className="text-[#0066CC] underline"
                  href={OPEN_METEO_ATTRIBUTION_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Open-Meteo
                </a>{" "}
                — previsioni;{" "}
                <a
                  className="text-[#0066CC] underline"
                  href={RAINVIEWER_ATTRIBUTION_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  RainViewer
                </a>{" "}
                — radar precipitazioni
              </li>
              <li>
                <a
                  className="text-[#0066CC] underline"
                  href="https://www.piattaformaunicanazionale.it/idr"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  PUN / IDR
                </a>{" "}
                — punti ricarica EV;{" "}
                <a
                  className="text-[#0066CC] underline"
                  href="https://www.mimit.gov.it/it/open-data/elenco-dataset/osservatorio-prezzi-carburanti"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  MIMIT
                </a>{" "}
                — carburanti;{" "}
                <a
                  className="text-[#0066CC] underline"
                  href="https://geo.agcom.it/agcomapps/BB4/BB4_BBwired_na_app16_4/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  AGCOM Broadband Map
                </a>{" "}
                — FTTH
              </li>
              <li>
                <a
                  className="text-[#0066CC] underline"
                  href="https://www.vesselfinder.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  VesselFinder
                </a>{" "}
                — traffico AIS (embed); webcam porto:{" "}
                <a
                  className="text-[#0066CC] underline"
                  href="https://lnx.comune.sanvincenzo.li.it/webcam/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Comune di San Vincenzo
                </a>
              </li>
              <li>
                <a
                  className="text-[#0066CC] underline"
                  href={FARMACIE_DI_TURNO_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  FarmacieDiTurno.org
                </a>{" "}
                — farmacie di turno (orari e date) per San Vincenzo e comuni
                vicini
              </li>
            </ul>
          </Section>

          <Section title="Mappe e cartografia">
            <p>
              ©{" "}
              <a
                className="text-[#0066CC] underline"
                href={OSM_COPYRIGHT_URL}
                target="_blank"
                rel="noopener noreferrer"
              >
                OpenStreetMap contributors
              </a>{" "}
              (ODbL). Basemap{" "}
              <a
                className="text-[#0066CC] underline"
                href={CARTO_ATTRIBUTION_URL}
                target="_blank"
                rel="noopener noreferrer"
              >
                CARTO
              </a>{" "}
              dove indicato.
            </p>
          </Section>

          <Section title="Stemma comunale">
            <p>
              {STEMMA.attribution} — licenza{" "}
              <a
                className="text-[#0066CC] underline"
                href={STEMMA.licenseUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                CC BY-NC-ND 3.0 IT
              </a>
              . Uso non commerciale; nessuna opera derivata (ammesso solo
              ridimensionamento CSS/HTML). Fonte:{" "}
              <a
                className="text-[#0066CC] underline"
                href={STEMMA.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                Wikimedia Commons
              </a>
              .
            </p>
          </Section>

          <Section title="Licenza dati">
            <p>
              I contenuti dati sono prevalentemente in licenza{" "}
              <strong>CC-BY 4.0</strong>, salvo diversa indicazione della fonte
              primaria. Questo cruscotto non sostituisce i portali ufficiali.
            </p>
          </Section>
        </div>
      </main>
      <Footer />
    </>
  );
}
