"use client";

import type { ReactNode } from "react";
import {
  ARPAT_BALNEAZIONE_URL,
  ARPAT_OPENDATA_URL,
  CARTO_ATTRIBUTION_URL,
  COMUNE_NOME,
  COMUNE_SAN_VINCENZO_URL,
  CRUSCOTTO_ITALIA_URL,
  FARMACIE_DI_TURNO_URL,
  MINISTERO_CULTURA_URL,
  MIUR_ESPLORA_URL,
  MIUR_OPENDATA_URL,
  ALLERTA_METEO_APP_URL,
  CFR_TOSCANA_URL,
  DPC_ALLERTAMENTO_URL,
  OPEN_METEO_ATTRIBUTION_URL,
  OPENWEATHER_ATTRIBUTION_URL,
  OSM_COPYRIGHT_URL,
  RAINVIEWER_ATTRIBUTION_URL,
  REGIONE_TOSCANA_ALLERTA_URL,
  REGIONE_TOSCANA_OPENDATA_URL,
  STEMMA,
} from "@/lib/constants";
import { getForkMaintainer } from "@/lib/comune-config";
import { PROJECT_ORIGIN } from "@/lib/project-origin";
import { AccessibilitaCompliance } from "@/components/AccessibilitaCompliance";
import { GitHubMark, VercelMark } from "@/components/BrandMarks";
import {
  CcByNcNd30ItBadge,
  CreativeCommonsBadgeRow,
} from "@/components/CreativeCommonsBadges";
import { SectionIntro } from "@/components/ui";

function Section({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="mb-8">
      <h3 className="mb-3 text-lg font-bold text-[#17324d] sm:text-xl">
        {title}
      </h3>
      <div className="space-y-3 text-sm leading-relaxed text-[#17324d] sm:text-base">
        {children}
      </div>
    </section>
  );
}

export function AttribuzioniPanel() {
  const forkMaintainer = getForkMaintainer();
  return (
    <section>
      <SectionIntro
        title="Attribuzioni e regole"
        description={`Fonti, licenze e condizioni d'uso del Cruscotto ${COMUNE_NOME}.`}
      />

      <div className="max-w-3xl">
        <Section title="Progetto non ufficiale">
          <p>
            Questo sito è un <strong>progetto indipendente</strong>, non
            affiliato ad AgID, al Governo italiano o al Comune di {COMUNE_NOME}.
            Riaggrega dati pubblici aperti provenienti da Cruscotto Italia e
            dalle fonti citate di seguito.
          </p>
          <p>
            Basato sul{" "}
            <a
              className="text-[#0066CC] underline"
              href={PROJECT_ORIGIN.site_url}
              target="_blank"
              rel="noopener noreferrer"
            >
              Cruscotto {PROJECT_ORIGIN.comune_demo}
            </a>{" "}
            di{" "}
            <a
              className="text-[#0066CC] underline"
              href={`mailto:${PROJECT_ORIGIN.author.email}`}
            >
              {PROJECT_ORIGIN.author.name}
            </a>
            {" — "}
            <a
              className="text-[#0066CC] underline"
              href={PROJECT_ORIGIN.github_repo_url}
              target="_blank"
              rel="noopener noreferrer"
            >
              repository originale
            </a>
            .
            {forkMaintainer ? (
              <>
                {" "}
                Questo fork per {COMUNE_NOME} è curato da{" "}
                {forkMaintainer.email ? (
                  <a
                    className="text-[#0066CC] underline"
                    href={`mailto:${forkMaintainer.email}`}
                  >
                    {forkMaintainer.name}
                  </a>
                ) : (
                  <strong>{forkMaintainer.name}</strong>
                )}
                .
              </>
            ) : null}
          </p>
          <ul className="m-0 flex list-none flex-wrap gap-3 p-0">
            <li>
              <a
                href={PROJECT_ORIGIN.github_repo_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-[var(--pa-border)] bg-white px-3 py-2 text-sm font-semibold text-[var(--pa-ink)] no-underline transition hover:border-[var(--pa-primary)] hover:text-[var(--pa-primary)]"
              >
                <GitHubMark />
                <span>Repo originale</span>
              </a>
            </li>
            <li>
              <a
                href={PROJECT_ORIGIN.vercel_deploy_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-[var(--pa-border)] bg-white px-3 py-2 text-sm font-semibold text-[var(--pa-ink)] no-underline transition hover:border-[var(--pa-primary)] hover:text-[var(--pa-primary)]"
              >
                <VercelMark />
                <span>Deploy su Vercel</span>
              </a>
            </li>
          </ul>
        </Section>

        <Section title="Accuratezza dei dati">
          <p>
            I dati sono riportati così come pubblicati dalle fonti ufficiali al
            momento dell&apos;ultima estrazione, senza garanzia di completezza,
            correttezza o aggiornamento in tempo reale. Per usi ufficiali o
            legali fare sempre riferimento alle fonti primarie.
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
            ISTAT, ISPRA, MIUR, ACI, MEF, GSE/MASE, AGCOM, MIMIT, Ministero del
            Lavoro, Ministero della Salute, Agenzia delle Entrate, Protezione
            Civile, ItaliaMeteo/Cineca. Licenza contenuti CC-BY 4.0 (ove non
            diversamente indicato).
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
              — eventi culturali, orari TPL (GTFS)
            </li>
            <li>
              <a
                className="text-[#0066CC] underline"
                href="https://www.openstreetmap.org/copyright"
                target="_blank"
                rel="noopener noreferrer"
              >
                OpenStreetMap
              </a>
              {" / "}
              <a
                className="text-[#0066CC] underline"
                href="https://cycling.waymarkedtrails.org/"
                target="_blank"
                rel="noopener noreferrer"
              >
                Waymarked Trails
              </a>{" "}
              — percorsi ciclabili, MTB e sentieri (relazioni OSM)
            </li>
            <li>
              <a
                className="text-[#0066CC] underline"
                href={DPC_ALLERTAMENTO_URL}
                target="_blank"
                rel="noopener noreferrer"
              >
                Dipartimento della Protezione Civile
              </a>
              {" / "}
              <a
                className="text-[#0066CC] underline"
                href={REGIONE_TOSCANA_ALLERTA_URL}
                target="_blank"
                rel="noopener noreferrer"
              >
                Allerta Meteo Toscana
              </a>
              {" / "}
              <a
                className="text-[#0066CC] underline"
                href={CFR_TOSCANA_URL}
                target="_blank"
                rel="noopener noreferrer"
              >
                CFR Toscana
              </a>
              {" — allerte meteo-idro (via "}
              <a
                className="text-[#0066CC] underline"
                href={ALLERTA_METEO_APP_URL}
                target="_blank"
                rel="noopener noreferrer"
              >
                allertameteo.app
              </a>
              )
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
              ) — anagrafe scuole, alunni/classi e infanzia per {COMUNE_NOME}
              (IODL 2.0)
            </li>
            <li>
              <a
                className="text-[#0066CC] underline"
                href="https://dati.toscana.it/dataset/rt-oraritb"
                target="_blank"
                rel="noopener noreferrer"
              >
                Regione Toscana — Orari TPL (GTFS)
              </a>{" "}
              — bus e treni programmati;{" "}
              <a
                className="text-[#0066CC] underline"
                href="https://www.viaggiatreno.it/"
                target="_blank"
                rel="noopener noreferrer"
              >
                ViaggiaTreno
              </a>{" "}
              — partenze/arrivi live e ritardi FS (fonte non ufficiale)
            </li>
            <li>
              <a
                className="text-[#0066CC] underline"
                href={OPENWEATHER_ATTRIBUTION_URL}
                target="_blank"
                rel="noopener noreferrer"
              >
                OpenWeather
              </a>{" "}
              — meteo live, previsioni e AQI;{" "}
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
                href="https://www.pienofurbo.it/colonnine"
                target="_blank"
                rel="noopener noreferrer"
              >
                PienoFurbo
              </a>{" "}
              (OpenChargeMap + OpenStreetMap) — prezzi indicativi €/kWh;{" "}
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
                href={COMUNE_SAN_VINCENZO_URL}
                target="_blank"
                rel="noopener noreferrer"
              >
                Comune di {COMUNE_NOME}
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
              — farmacie di turno (orari e date) per {COMUNE_NOME} e comuni
              vicini
            </li>
            <li>
              <a
                className="text-[#0066CC] underline"
                href="https://www.openstreetmap.org/copyright"
                target="_blank"
                rel="noopener noreferrer"
              >
                OpenStreetMap
              </a>{" "}
              /{" "}
              <a
                className="text-[#0066CC] underline"
                href="https://wheelmap.org/"
                target="_blank"
                rel="noopener noreferrer"
              >
                Wheelmap
              </a>{" "}
              — accessibilità (wheelchair, stalli disabili, bagni);{" "}
              <a
                className="text-[#0066CC] underline"
                href="https://www.disabilitaincifre.istat.it/"
                target="_blank"
                rel="noopener noreferrer"
              >
                ISTAT Disabilità in cifre
              </a>
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
          <div className="pt-1">
            <CcByNcNd30ItBadge />
          </div>
        </Section>

        <Section title="Licenza dati">
          <p>
            I contenuti dati sono prevalentemente in licenza{" "}
            <strong>CC BY 4.0</strong>, salvo diversa indicazione della fonte
            primaria. Lo stemma comunale è in{" "}
            <strong>CC BY-NC-ND 3.0 IT</strong>. Questo cruscotto non sostituisce
            i portali ufficiali.
          </p>
          <CreativeCommonsBadgeRow />
          <p className="text-xs text-[var(--pa-muted)] sm:text-sm">
            Loghi ufficiali{" "}
            <a
              className="underline"
              href="https://creativecommons.org/about/downloads/"
              target="_blank"
              rel="noopener noreferrer"
            >
              Creative Commons
            </a>{" "}
            (licensebuttons.net).
          </p>
        </Section>

        <Section title="Accessibilità del sito">
          <AccessibilitaCompliance className="mb-0" />
        </Section>
      </div>
    </section>
  );
}
