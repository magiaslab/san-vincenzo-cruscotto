"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import {
  AUTHOR,
  COMUNE_NOME,
  CRUSCOTTO_ITALIA_URL,
  GITHUB_REPO_URL,
  ISTAT_CODE,
} from "@/lib/constants";
import { SectionIntro } from "@/components/ui";

function Faq({ q, children }: { q: string; children: ReactNode }) {
  return (
    <details className="guide-card">
      <summary className="cursor-pointer list-none font-bold text-[var(--pa-ink)] marker:content-none [&::-webkit-details-marker]:hidden">
        {q}
      </summary>
      <div className="mt-2 text-sm leading-relaxed text-[var(--pa-muted)] sm:text-base">
        {children}
      </div>
    </details>
  );
}

export function ComeFunzionaPanel({ asPage = false }: { asPage?: boolean }) {
  return (
    <section className="guide-prose">
      <SectionIntro
        asPage={asPage}
        title={
          asPage
            ? `Come funziona il Cruscotto ${COMUNE_NOME}`
            : "Come funziona"
        }
        description={`Una lettura in chiaro: da dove arrivano i numeri, chi li pubblica e cosa questo sito non è.`}
      />

      <p>
        Il Cruscotto {COMUNE_NOME} è un sito indipendente. Non è l’ufficio del
        Comune, non è AgID e non è un canale ufficiale. Mette insieme dati
        pubblici già disponibili in rete e li mostra in sezioni (sanità,
        scuole, meteo, finanza…) così non devi aprire dieci portali diversi.
      </p>
      <p>
        I numeri principali arrivano da{" "}
        <a
          href={CRUSCOTTO_ITALIA_URL}
          target="_blank"
          rel="noopener noreferrer"
        >
          Cruscotto Italia
        </a>
        , il progetto AgID sui dati aperti comunali. Il codice ISTAT di{" "}
        {COMUNE_NOME} è <code>{ISTAT_CODE}</code>. Accanto ci sono meteo,
        mappe, treni, farmacie, scuole: ognuno dalla propria fonte.
      </p>
      <p>
        L’ha realizzato{" "}
        <a href={`mailto:${AUTHOR.email}`}>{AUTHOR.name}</a> nel tempo
        libero. Licenze e elenco delle fonti:{" "}
        <Link href="/attribuzioni">Attribuzioni e regole</Link>.
      </p>

      <h2 className="guide-h2">Dal dato alla pagina</h2>
      <ol className="not-prose step-list mb-4">
        <li>
          <span className="step-num" aria-hidden>
            1
          </span>
          <div>
            <p className="m-0 font-bold">Qualcuno pubblica i dati</p>
            <p className="mb-0 mt-1 text-sm text-[var(--pa-muted)]">
              AgID, ISTAT, Ministero della Salute, OpenStreetMap, la Regione,
              i gestori locali. Noi non li inventiamo.
            </p>
          </div>
        </li>
        <li>
          <span className="step-num" aria-hidden>
            2
          </span>
          <div>
            <p className="m-0 font-bold">Il sito li raccoglie</p>
            <p className="mb-0 mt-1 text-sm text-[var(--pa-muted)]">
              Le pagine interne <code>/api/…</code> chiedono i dati al
              server, li puliscono e li tengono in cache. Il tuo browser non
              parla direttamente con AgID.
            </p>
          </div>
        </li>
        <li>
          <span className="step-num" aria-hidden>
            3
          </span>
          <div>
            <p className="m-0 font-bold">Tu li consulti</p>
            <p className="mb-0 mt-1 text-sm text-[var(--pa-muted)]">
              Grafici, mappe e schede. Se una fonte è giù (il meteo, una
              webcam), il resto del cruscotto resta comunque apribile.
            </p>
          </div>
        </li>
      </ol>

      <h2 className="guide-h2">Cosa c’è dentro</h2>
      <ul className="not-prose m-0 list-none space-y-3 p-0">
        {[
          {
            t: "In evidenza",
            d: "Panoramica, sanità, disabilità, mobilità, meteo: quello che serve in giornata.",
          },
          {
            t: "Territorio",
            d: "Turismo, porto (se c’è), ambiente, rischio, mappa.",
          },
          {
            t: "Economia e società",
            d: "Imprese, scuole, demografia, bilanci e spesa.",
          },
          {
            t: "Progetto",
            d: "Come è fatto, come replicarlo, chi lo sostiene, da dove arrivano i dati.",
          },
        ].map((s) => (
          <li key={s.t} className="guide-card">
            <p className="m-0 font-bold">{s.t}</p>
            <p className="mb-0 mt-1 text-sm text-[var(--pa-muted)]">{s.d}</p>
          </li>
        ))}
      </ul>

      <h2 className="guide-h2">Tecnologie, in breve</h2>
      <p>
        Il sito è un’applicazione Next.js ospitata su Vercel. Non ha un
        database proprio né un login obbligatorio: legge fonti pubbliche e
        basta. Il codice è su{" "}
        <a href={GITHUB_REPO_URL} target="_blank" rel="noopener noreferrer">
          GitHub
        </a>
        . Chi vuole i dettagli (mappe Leaflet, grafici, assistente) li trova
        nel repository; in questa pagina restiamo sul senso.
      </p>

      <h2 className="guide-h2">Domande frequenti</h2>
      <div className="not-prose grid gap-3">
        <Faq q="È il sito del Comune?">
          <p className="m-0">
            No. È un progetto civico indipendente. Per i servizi ufficiali
            (anagrafe, tributi, pec) vai sul sito del Comune.
          </p>
        </Faq>
        <Faq q="I dati sono aggiornati in tempo reale?">
          <p className="m-0">
            Dipende dalla fonte. Il meteo e i treni sì, o quasi. Demografia e
            bilanci seguono i calendari ISTAT, MEF, AgID: a volte mesi. In
            dubbio, apri il link della fonte in fondo a ogni scheda.
          </p>
        </Faq>
        <Faq q="Posso usarlo per una delibera o un’inchiesta?">
          <p className="m-0">
            Come orientamento, sì. Per un atto ufficiale torna sempre al
            dataset originale. Questo sito non certifica i numeri.
          </p>
        </Faq>
        <Faq q="Posso farne uno per un altro comune?">
          <p className="m-0">
            Sì. La guida, anche per chi non programma, è in{" "}
            <Link href="/riusa">Porta nel tuo comune</Link>. I siti già nati
            sono in <Link href="/esempi">Cruscotti online</Link>.
          </p>
        </Faq>
        <Faq q="Come segnalo un errore?">
          <p className="m-0">
            Dalla pagina <Link href="/partecipa">Partecipa</Link>, oppure
            scrivendo a{" "}
            <a href={`mailto:${AUTHOR.email}`}>{AUTHOR.email}</a>.
          </p>
        </Faq>
      </div>
    </section>
  );
}
