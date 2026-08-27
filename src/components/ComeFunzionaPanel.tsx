"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import {
  AUTHOR,
  COMUNE_NOME,
  CRUSCOTTO_ITALIA_URL,
  GITHUB_REPO_URL,
  ISTAT_CODE,
  MCP_ENDPOINT,
  VERCEL_DEPLOY_URL,
} from "@/lib/constants";
import { SectionIntro } from "@/components/ui";

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
      <h3 className="mb-3 text-lg font-bold text-[var(--pa-ink)] sm:text-xl">
        {title}
      </h3>
      <div className="space-y-3 text-sm leading-relaxed text-[var(--pa-ink)] sm:text-base">
        {children}
      </div>
    </section>
  );
}

const STACK_ITEMS: { name: string; role: string }[] = [
  {
    name: "Next.js 16 (App Router) + TypeScript",
    role: "Applicazione web, routing, rendering e API route server-side.",
  },
  {
    name: "React 19 + Tailwind CSS 4",
    role: "Interfaccia dashboard a sidebar, componenti e tema PA / Design Italia.",
  },
  {
    name: "Chart.js / react-chartjs-2",
    role: "Grafici KPI, serie storiche e confronti tra indicatori.",
  },
  {
    name: "Leaflet / react-leaflet + OpenStreetMap / CARTO",
    role: "Mappe interattive (civici, DAE, trasporti, meteo, accessibilità).",
  },
  {
    name: "Three.js",
    role: "Vista 3D stilizzata della morfologia del territorio.",
  },
  {
    name: "@modelcontextprotocol/sdk",
    role: "Client MCP verso Cruscotto Italia (AgID) per i KPI comunali.",
  },
  {
    name: "Modal + Hugging Face (opzionale)",
    role: "Assistente RAG: embedding e generazione senza API LLM a pagamento.",
  },
  {
    name: "Vercel",
    role: "Hosting, CDN e cache delle route API.",
  },
];

const FLOW_STEPS: { title: string; body: string }[] = [
  {
    title: "Fonti aperte",
    body: "Cruscotto Italia (AgID) e altre API pubbliche (ARPAT, Regione Toscana, meteo, OSM, MIUR, …) espongono i dati in lettura.",
  },
  {
    title: "Proxy Next.js",
    body: "Le route /api/* sul server recuperano, normalizzano e mettono in cache le risposte. Il browser non parla direttamente con l’MCP AgID.",
  },
  {
    title: "Dashboard",
    body: `I pannelli React leggono JSON dalle API interne e mostrano KPI, mappe, grafici e sezioni tematiche per ${COMUNE_NOME} (ISTAT ${ISTAT_CODE}).`,
  },
  {
    title: "Degrado controllato",
    body: "I pannelli opzionali (meteo, ARPAT, cultura, porto, …) falliscono in modo indipendente: il resto del cruscotto resta consultabile.",
  },
];

const API_ROWS: { route: string; desc: string }[] = [
  { route: "GET /api/kpi", desc: "Proxy comune_kpi (cache ~24h)" },
  {
    route: "GET /api/dettaglio",
    desc: "Sotto-sezioni comune_dashboard (SIOPE, ANAC, …)",
  },
  {
    route: "GET /api/mappa",
    desc: "Layer GeoJSON (civici, EV, beni, sanità)",
  },
  { route: "GET /api/meteo*", desc: "Meteo live, previsioni, radar, allerte" },
  { route: "GET /api/percorsi", desc: "Percorsi ciclabili/pedonali OSM (lista, mappa, GPX)" },
  { route: "GET /api/dae", desc: "Defibrillatori da GeoJSON locale / OSM" },
  { route: "POST /api/feedback", desc: "Suggerimenti → issue GitHub" },
  { route: "POST /api/assistente", desc: "Proxy RAG su Modal (se configurato)" },
  { route: "GET /api/amministratori", desc: "Anagrafe DAIT (empty-safe)" },
  { route: "GET /api/terremoti", desc: "INGV nel bbox comunale" },
  { route: "GET /api/ipa", desc: "Domicili digitali IPA" },
  { route: "GET /api/demografia-mensile", desc: "ISTAT D7B (ZIP latin-1)" },
  { route: "GET /api/stazioni", desc: "WFS stazioni meteo-idro regionali" },
  { route: "GET /api/pubblico/*", desc: "Export JSON/CSV indicizzabili" },
];

const SEZIONI: { name: string; desc: string }[] = [
  {
    name: "In evidenza",
    desc: "Panoramica, Sanità, Disabilità, Mobilità, Meteo, Partecipa",
  },
  {
    name: "Territorio e mare",
    desc: "Turismo, Porto, Ambiente, Territorio, Mappa",
  },
  {
    name: "Economia e PA",
    desc: "Economia, Istruzione, Società, Chi amministra, Confronto, Finanza",
  },
];

export function ComeFunzionaPanel({ asPage = false }: { asPage?: boolean }) {
  return (
    <section>
      <SectionIntro
        asPage={asPage}
        title={
          asPage
            ? `Come funziona il Cruscotto ${COMUNE_NOME}`
            : "Come funziona"
        }
        description={`Architettura, stack tecnologico e flusso operativo del Cruscotto ${COMUNE_NOME}: come i dati aperti diventano la dashboard che vedi.`}
      />

      <div className="max-w-3xl">
        <Section title="In sintesi" id="sintesi">
          <p>
            Il cruscotto è un&apos;applicazione{" "}
            <strong>solo lettura</strong>: non ha database proprio, né
            autenticazione obbligatoria. Aggrega dati pubblici del Comune di{" "}
            {COMUNE_NOME} (codice ISTAT <code>{ISTAT_CODE}</code>) e li presenta
            in sezioni tematiche. La fonte principale è{" "}
            <a
              className="underline"
              href={CRUSCOTTO_ITALIA_URL}
              target="_blank"
              rel="noopener noreferrer"
            >
              Cruscotto Italia (AgID)
            </a>
            , raggiungibile via MCP; altre fonti (meteo, trasporti, ARPAT,
            mappe) arrivano da API dedicate.
          </p>
          <p>
            Realizzato da{" "}
            <a className="underline" href={`mailto:${AUTHOR.email}`}>
              {AUTHOR.name}
            </a>
            . Progetto indipendente e non ufficiale — vedi anche le{" "}
            <Link href="/attribuzioni" className="underline">
              attribuzioni e regole
            </Link>
            .
          </p>
        </Section>

        <Section title="Flusso operativo" id="flusso">
          <p>
            Dal dato pubblico alla schermata: quattro passaggi, tutti lato server
            o client senza scrittura sui sistemi delle fonti.
          </p>
          <ol className="m-0 list-none space-y-3 p-0">
            {FLOW_STEPS.map((step, i) => (
              <li
                key={step.title}
                className="flex gap-3 rounded-lg border border-[var(--pa-border)] bg-white p-3 sm:p-4"
              >
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--pa-primary)] text-sm font-bold text-white"
                  aria-hidden
                >
                  {i + 1}
                </span>
                <div className="min-w-0">
                  <p className="m-0 font-bold text-[var(--pa-ink)]">
                    {step.title}
                  </p>
                  <p className="mb-0 mt-1 text-sm text-[var(--pa-muted)]">
                    {step.body}
                  </p>
                </div>
              </li>
            ))}
          </ol>
          <p className="text-sm text-[var(--pa-muted)]">
            Endpoint MCP AgID:{" "}
            <code className="break-all text-[var(--pa-ink)]">{MCP_ENDPOINT}</code>
          </p>
        </Section>

        <Section title="Stack tecnologico" id="stack">
          <p>
            Tutto gira su un unico processo Next.js in sviluppo (
            <code>npm run dev</code>
            ); in produzione su Vercel. Non serve avviare database o
            microservizi locali.
          </p>
          <ul className="m-0 list-none divide-y divide-[var(--pa-border)] rounded-lg border border-[var(--pa-border)] bg-white p-0">
            {STACK_ITEMS.map((item) => (
              <li key={item.name} className="px-3 py-3 sm:px-4 sm:py-3.5">
                <p className="m-0 font-bold text-[var(--pa-ink)]">{item.name}</p>
                <p className="mb-0 mt-1 text-sm text-[var(--pa-muted)]">
                  {item.role}
                </p>
              </li>
            ))}
          </ul>
          <ul className="m-0 flex list-none flex-wrap gap-3 p-0">
            <li>
              <a
                href={GITHUB_REPO_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-11 items-center rounded-lg border border-[var(--pa-border)] bg-white px-3 py-2 text-sm font-semibold text-[var(--pa-ink)] no-underline transition hover:border-[var(--pa-primary)] hover:text-[var(--pa-primary)]"
              >
                Codice su GitHub
              </a>
            </li>
            <li>
              <a
                href={VERCEL_DEPLOY_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-11 items-center rounded-lg border border-[var(--pa-border)] bg-white px-3 py-2 text-sm font-semibold text-[var(--pa-ink)] no-underline transition hover:border-[var(--pa-primary)] hover:text-[var(--pa-primary)]"
              >
                Deploy su Vercel
              </a>
            </li>
          </ul>
        </Section>

        <Section title="API interne" id="api">
          <p>
            Il frontend chiama solo route locali sotto <code>/api/*</code>. Sono
            proxy/cache sottili: nessuna persistenza proprietaria dei dataset.
          </p>
          <div className="overflow-x-auto rounded-lg border border-[var(--pa-border)] bg-white">
            <table className="w-full min-w-[28rem] border-collapse text-left text-sm">
              <caption className="sr-only">
                Principali route API interne del cruscotto
              </caption>
              <thead>
                <tr className="border-b border-[var(--pa-border)] bg-[var(--pa-surface-soft)]">
                  <th scope="col" className="px-3 py-2.5 font-bold">
                    Route
                  </th>
                  <th scope="col" className="px-3 py-2.5 font-bold">
                    Ruolo
                  </th>
                </tr>
              </thead>
              <tbody>
                {API_ROWS.map((row) => (
                  <tr
                    key={row.route}
                    className="border-b border-[var(--pa-border)] last:border-b-0"
                  >
                    <td className="px-3 py-2.5 align-top">
                      <code className="whitespace-nowrap">{row.route}</code>
                    </td>
                    <td className="px-3 py-2.5 text-[var(--pa-muted)]">
                      {row.desc}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>

        <Section title="Sezioni del cruscotto" id="sezioni">
          <p>
            La navigazione (sidebar desktop / menu mobile) raggruppa i temi in
            tre aree. Ogni sezione è un deep-link (<code>#sanita</code>,{" "}
            <code>#infra</code>, …).
          </p>
          <ul className="m-0 list-none space-y-3 p-0">
            {SEZIONI.map((s) => (
              <li
                key={s.name}
                className="rounded-lg border border-[var(--pa-border)] bg-white px-3 py-3 sm:px-4"
              >
                <p className="m-0 font-bold">{s.name}</p>
                <p className="mb-0 mt-1 text-sm text-[var(--pa-muted)]">
                  {s.desc}
                </p>
              </li>
            ))}
          </ul>
          <p>
            <Link
              href="/"
              className="inline-flex min-h-11 items-center font-semibold underline underline-offset-2"
            >
              Torna al cruscotto
            </Link>
          </p>
        </Section>

        <Section title="Servizi opzionali" id="opzionali">
          <ul className="list-disc space-y-2 pl-5">
            <li>
              <strong>Assistente RAG</strong> — corpus locale + modelli HF su
              Modal; richiede <code>ASSISTENTE_MODAL_URL</code> in ambiente.
              Senza variabile, l&apos;assistente resta limitato alle FAQ
              integrate.
            </li>
            <li>
              <strong>Bot Telegram DAE</strong> — segnalazioni cittadine di
              defibrillatori; webhook e overlay mappa se configurati.
            </li>
            <li>
              <strong>PWA</strong> — installabile sulla schermata Home; offline
              solo per pagine già visitate.
            </li>
            <li>
              <strong>Form Partecipa</strong> — i suggerimenti diventano issue
              sul repository GitHub del progetto.
            </li>
          </ul>
        </Section>

        <Section title="Limiti e trasparenza" id="limiti">
          <p>
            I dati sono quelli pubblicati dalle fonti al momento
            dell&apos;estrazione: non c&apos;è garanzia di aggiornamento in tempo
            reale su tutti i dataset. Per usi ufficiali o legali fare sempre
            riferimento alle fonti primarie. Licenze, stemma e elenco completo
            delle fonti sono in{" "}
            <Link href="/attribuzioni" className="underline">
              Attribuzioni e regole
            </Link>
            . Per duplicare lo stack su un altro comune vedi{" "}
            <Link href="/riusa" className="underline">
              Riusa / fork
            </Link>
            .
          </p>
        </Section>
      </div>
    </section>
  );
}
