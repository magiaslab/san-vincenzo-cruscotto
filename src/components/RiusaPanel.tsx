"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import {
  AUTHOR,
  COMUNE_NOME,
  CRUSCOTTO_ITALIA_URL,
  GITHUB_REPO_URL,
  ISTAT_CODE,
  VERCEL_DEPLOY_URL,
} from "@/lib/constants";
import { SectionIntro } from "@/components/ui";

const GITHUB_FORK_URL = `${GITHUB_REPO_URL}/fork`;
const GITHUB_DOCS_RIUSO_URL = `${GITHUB_REPO_URL}/blob/master/docs/riuso-fork.md`;
const GITHUB_CONFIG_EXAMPLE_URL = `${GITHUB_REPO_URL}/blob/master/config/comune.example.json`;
const GITHUB_ENV_EXAMPLE_URL = `${GITHUB_REPO_URL}/blob/master/.env.example`;
const GITHUB_MODAL_RAG_URL = `${GITHUB_REPO_URL}/blob/master/modal_rag/README.md`;
const GITHUB_DAE_DOCS_URL = `${GITHUB_REPO_URL}/blob/master/docs/dae-telegram-bot.md`;

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

function DocLink({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex min-h-11 items-center rounded-lg border border-[var(--pa-border)] bg-white px-3 py-2 text-sm font-semibold text-[var(--pa-ink)] no-underline transition hover:border-[var(--pa-primary)] hover:text-[var(--pa-primary)]"
    >
      {children}
    </a>
  );
}

/** Scroll in-page senza cambiare l’hash della tab (`#riusa`). */
function scrollToSection(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

const TOC: { id: string; label: string }[] = [
  { id: "percorsi", label: "Due percorsi" },
  { id: "account", label: "Account esterni" },
  { id: "passi", label: "GitHub → Vercel → online" },
  { id: "minimo", label: "Identità comune" },
  { id: "env", label: "Variabili d’ambiente" },
  { id: "moduli", label: "Moduli opzionali" },
  { id: "mcp", label: "Cursor, Claude e MCP" },
  { id: "limiti", label: "Checklist e limiti" },
];

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

const ACCOUNTS: {
  servizio: string;
  aCosa: string;
  obbligatorio: string;
  dove: string;
  href?: string;
}[] = [
  {
    servizio: "GitHub",
    aCosa: "Codice, fork, Issues, commit GeoJSON DAE",
    obbligatorio: "Sì (fork/deploy)",
    dove: "github.com/signup",
    href: "https://github.com/signup",
  },
  {
    servizio: "Vercel",
    aCosa: "Hosting Next.js (regione fra1)",
    obbligatorio: "Sì (online)",
    dove: "vercel.com — login con GitHub",
    href: "https://vercel.com/signup",
  },
  {
    servizio: "AgID Cruscotto Italia MCP",
    aCosa: "KPI comunali",
    obbligatorio: "No account (pubblico)",
    dove: "cruscotto-italia-mcp.agid.workers.dev/mcp",
    href: "https://cruscotto-italia-mcp.agid.workers.dev/mcp",
  },
  {
    servizio: "OpenWeather",
    aCosa: "Meteo current / forecast / AQI",
    obbligatorio: "Opzionale",
    dove: "home.openweathermap.org/api_keys",
    href: "https://home.openweathermap.org/api_keys",
  },
  {
    servizio: "Telegram + BotFather",
    aCosa: "Bot segnalazione DAE",
    obbligatorio: "Opzionale",
    dove: "t.me/BotFather",
    href: "https://t.me/BotFather",
  },
  {
    servizio: "Modal",
    aCosa: "Hosting RAG (modelli Hugging Face)",
    obbligatorio: "Opzionale (assistente)",
    dove: "modal.com → modal setup",
    href: "https://modal.com",
  },
  {
    servizio: "Hugging Face",
    aCosa: "Download pesi modelli pubblici",
    obbligatorio: "Di solito no token",
    dove: "huggingface.co",
    href: "https://huggingface.co",
  },
  {
    servizio: "Wheelmap / Sozialhelden",
    aCosa: "Embed iframe accessibilità",
    obbligatorio: "Opzionale",
    dove: "info@sozialhelden.de",
    href: "https://news.wheelmap.org/wheelmap-widget/",
  },
  {
    servizio: "Cursor / Claude",
    aCosa: "IDE AI e agent per adattare il fork; MCP opzionale",
    obbligatorio: "No",
    dove: "cursor.com · claude.ai",
    href: "https://cursor.com",
  },
];

const ENV_ROWS: { name: string; quando: string }[] = [
  {
    name: "(nessuna obbligatoria)",
    quando: "KPI AgID funzionano senza secret",
  },
  {
    name: "NEXT_PUBLIC_SITE_URL",
    quando: "Dominio custom, SEO, PWA, link bot",
  },
  {
    name: "OPENWEATHER_API_KEY",
    quando: "Pannello OpenWeather",
  },
  {
    name: "ASSISTENTE_MODAL_URL",
    quando: "Tuo deploy Modal (non usare il default SV)",
  },
  {
    name: "TELEGRAM_BOT_TOKEN / WEBHOOK_SECRET / ADMIN_CHAT_IDS",
    quando: "Bot DAE + moderazione",
  },
  {
    name: "NEXT_PUBLIC_TELEGRAM_BOT_URL",
    quando: "CTA «Segnala su Telegram»",
  },
  {
    name: "GITHUB_TOKEN + GITHUB_REPO",
    quando: "Persistenza DAE su Vercel e/o Partecipa (Issues)",
  },
  {
    name: "NEXT_PUBLIC_WHEELMAP_EMBED_TOKEN",
    quando: "Iframe Wheelmap ufficiale",
  },
];

const OPTIONAL_MODULES: { area: string; cerca: string }[] = [
  {
    area: "OpenWeather",
    cerca: "API key free → OPENWEATHER_API_KEY su Vercel → redeploy",
  },
  {
    area: "Bot Telegram DAE",
    cerca:
      "BotFather → env TELEGRAM_* + GITHUB_TOKEN (contents:write) → setWebhook su /api/telegram/webhook — vedi docs/dae-telegram-bot.md",
  },
  {
    area: "Assistente RAG (Modal + HF)",
    cerca:
      "modal setup → aggiorna corpus → modal deploy → ASSISTENTE_MODAL_URL — vedi modal_rag/README.md",
  },
  {
    area: "Partecipa / Issues",
    cerca: "GITHUB_FEEDBACK_TOKEN o GITHUB_TOKEN con issues:write sul tuo repo",
  },
  {
    area: "Trasporti e treni",
    cerca: "build-trasporti-gtfs.mjs, FS_STAZIONE_* in viaggiatreno.ts",
  },
  {
    area: "Allerte / ARPAT / turismo / eventi",
    cerca: "URL regionali in constants — spesso da sostituire fuori Toscana",
  },
  {
    area: "Testi i18n e FAQ",
    cerca: "Nome comune in pannelli, i18n/en.ts, assistente-faq.ts",
  },
];

export function RiusaPanel() {
  return (
    <section>
      <SectionIntro
        title="Riusa questo cruscotto"
        description={`Guida completa per duplicare lo stack su un altro comune: dall’account GitHub alla messa online su Vercel, con account esterni (Telegram, Modal, Hugging Face, …), variabili d’ambiente e note su Cursor / Claude / MCP. Non serve replicare ogni pannello locale di ${COMUNE_NOME}.`}
      />

      <div className="max-w-3xl">
        <Section title="In sintesi" id="sintesi">
          <p>
            Questo sito è un cruscotto <strong>monocomune</strong> open data (un
            deploy = un comune), alimentato in larga parte da{" "}
            <a
              className="underline"
              href={CRUSCOTTO_ITALIA_URL}
              target="_blank"
              rel="noopener noreferrer"
            >
              Cruscotto Italia (AgID)
            </a>{" "}
            via codice ISTAT. Flusso consigliato:{" "}
            <strong>
              account GitHub → fork → identità comunale → deploy Vercel →
              (opzionale) moduli e MCP
            </strong>
            .
          </p>
          <nav aria-label="Indice guida riuso">
            <ul className="m-0 flex list-none flex-wrap gap-2 p-0">
              {TOC.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => scrollToSection(item.id)}
                    className="inline-flex min-h-11 items-center rounded-lg border border-[var(--pa-border)] bg-[var(--pa-surface-soft)] px-3 py-2 text-sm font-semibold text-[var(--pa-ink)] hover:border-[var(--pa-primary)]"
                  >
                    {item.label}
                  </button>
                </li>
              ))}
            </ul>
          </nav>
          <ul className="m-0 flex list-none flex-wrap gap-3 p-0">
            <li>
              <DocLink href={GITHUB_FORK_URL}>Fork su GitHub</DocLink>
            </li>
            <li>
              <DocLink href={GITHUB_DOCS_RIUSO_URL}>
                Guida completa (docs/riuso-fork.md)
              </DocLink>
            </li>
            <li>
              <DocLink href={GITHUB_CONFIG_EXAMPLE_URL}>
                config/comune.example.json
              </DocLink>
            </li>
            <li>
              <DocLink href={GITHUB_ENV_EXAMPLE_URL}>.env.example</DocLink>
            </li>
            <li>
              <DocLink href={VERCEL_DEPLOY_URL}>Esempio deploy Vercel</DocLink>
            </li>
          </ul>
        </Section>

        <Section title="Due percorsi" id="percorsi">
          <p>
            <strong>Principiante / MVP (~mezz’ora):</strong> GitHub + Vercel +
            cambio <code>ISTAT_CODE</code> / nome / coordinate / stemma. Nessuna
            API key. Online su <code>*.vercel.app</code> con i KPI del tuo
            comune.
          </p>
          <p>
            <strong>Completo / produzione:</strong> dominio custom, OpenWeather,
            bot Telegram DAE, assistente RAG (Modal + Hugging Face), token
            GitHub per feedback/segnalazioni, adattamento moduli regionali,
            eventuale MCP per Cursor o Claude.
          </p>
          <p className="text-[var(--pa-muted)]">
            Architettura dello stack:{" "}
            <Link href="/#come-funziona" className="underline">
              Come funziona
            </Link>
            .
          </p>
        </Section>

        <Section title="Account e tool esterni" id="account">
          <p>
            Solo GitHub e Vercel sono necessari per pubblicare. Il resto abilita
            moduli opzionali.
          </p>
          <div className="overflow-x-auto rounded-lg border border-[var(--pa-border)] bg-white">
            <table className="w-full min-w-[32rem] border-collapse text-left text-sm">
              <caption className="sr-only">
                Servizi esterni per fork e moduli opzionali
              </caption>
              <thead>
                <tr className="border-b border-[var(--pa-border)] bg-[var(--pa-surface-soft)]">
                  <th scope="col" className="px-3 py-2.5 font-bold">
                    Servizio
                  </th>
                  <th scope="col" className="px-3 py-2.5 font-bold">
                    A cosa serve
                  </th>
                  <th scope="col" className="px-3 py-2.5 font-bold">
                    Obbligatorio?
                  </th>
                </tr>
              </thead>
              <tbody>
                {ACCOUNTS.map((row) => (
                  <tr
                    key={row.servizio}
                    className="border-b border-[var(--pa-border)] last:border-b-0"
                  >
                    <td className="px-3 py-2.5 align-top font-semibold">
                      {row.href ? (
                        <a
                          className="underline"
                          href={row.href}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {row.servizio}
                        </a>
                      ) : (
                        row.servizio
                      )}
                      <p className="mb-0 mt-1 text-xs font-normal text-[var(--pa-muted)]">
                        {row.dove}
                      </p>
                    </td>
                    <td className="px-3 py-2.5 align-top text-[var(--pa-muted)]">
                      {row.aCosa}
                    </td>
                    <td className="px-3 py-2.5 align-top">{row.obbligatorio}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>

        <Section title="Da GitHub alla messa online" id="passi">
          <ol className="list-decimal space-y-3 pl-5">
            <li>
              <strong>Account GitHub</strong> —{" "}
              <a
                className="underline"
                href="https://github.com/signup"
                target="_blank"
                rel="noopener noreferrer"
              >
                registrati
              </a>
              , attiva 2FA. Più avanti potrai creare un Personal Access Token
              (scopes <code>contents</code> / <code>issues</code>) solo se usi
              bot DAE o Partecipa.
            </li>
            <li>
              <strong>Fork</strong> —{" "}
              <a
                className="underline"
                href={GITHUB_FORK_URL}
                target="_blank"
                rel="noopener noreferrer"
              >
                Fork su GitHub
              </a>{" "}
              (consigliato) oppure mirror in un repo nuovo:
              <pre className="mt-2 overflow-x-auto rounded-lg border border-[var(--pa-border)] bg-white p-3 text-xs leading-relaxed sm:text-sm">
                {`git clone --depth 1 ${GITHUB_REPO_URL}.git mio-cruscotto
cd mio-cruscotto
rm -rf .git && git init
git remote add origin git@github.com:TUO_USER/mio-cruscotto.git
git add -A && git commit -m "Fork iniziale cruscotto comunale"
git branch -M main && git push -u origin main`}
              </pre>
            </li>
            <li>
              <strong>Locale</strong> — Node 20+:{" "}
              <code>npm install && npm run dev</code>. Smoke:{" "}
              <code>curl -s localhost:3000/api/kpi</code>
            </li>
            <li>
              <strong>Identità comune</strong> — aggiorna{" "}
              <code>src/lib/constants.ts</code> (tabella sotto). Checklist:{" "}
              <a
                className="underline"
                href={GITHUB_CONFIG_EXAMPLE_URL}
                target="_blank"
                rel="noopener noreferrer"
              >
                comune.example.json
              </a>{" "}
              (non è caricata a runtime: copia a mano).
            </li>
            <li>
              <strong>Vercel</strong> —{" "}
              <a
                className="underline"
                href="https://vercel.com/signup"
                target="_blank"
                rel="noopener noreferrer"
              >
                account
              </a>{" "}
              (login GitHub) → Add Project → importa il fork → preset Next.js →
              Deploy <em>senza</em> env per l’MVP. Verifica{" "}
              <code>/api/kpi</code> sull’URL <code>*.vercel.app</code>.
            </li>
            <li>
              <strong>Dominio (opzionale)</strong> — Settings → Domains, DNS
              come da Vercel, poi{" "}
              <code>NEXT_PUBLIC_SITE_URL=https://www.tuodominio.it</code> e
              redeploy. Aggiorna anche il fallback in{" "}
              <code>src/lib/seo.ts</code> se serve.
            </li>
          </ol>
        </Section>

        <Section title="Identità del comune (minimo)" id="minimo">
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
          <p className="text-[var(--pa-muted)]">
            Aggiorna anche stazione FS (<code>viaggiatreno.ts</code>), asset in{" "}
            <code>public/data/</code>, OG image e stringhe col nome del comune se
            non vuoi residui di {COMUNE_NOME}.
          </p>
        </Section>

        <Section title="Variabili d’ambiente" id="env">
          <p>
            Elenco completo in{" "}
            <a
              className="underline"
              href={GITHUB_ENV_EXAMPLE_URL}
              target="_blank"
              rel="noopener noreferrer"
            >
              .env.example
            </a>{" "}
            e nella{" "}
            <a
              className="underline"
              href={GITHUB_DOCS_RIUSO_URL}
              target="_blank"
              rel="noopener noreferrer"
            >
              guida su GitHub
            </a>
            . Su Vercel: Project → Settings → Environment Variables (le{" "}
            <code>NEXT_PUBLIC_*</code> richiedono redeploy).
          </p>
          <ul className="m-0 list-none space-y-2 p-0">
            {ENV_ROWS.map((row) => (
              <li
                key={row.name}
                className="rounded-lg border border-[var(--pa-border)] bg-white px-3 py-3 sm:px-4"
              >
                <p className="m-0 font-mono text-xs font-bold sm:text-sm">
                  {row.name}
                </p>
                <p className="mb-0 mt-1 text-sm text-[var(--pa-muted)]">
                  {row.quando}
                </p>
              </li>
            ))}
          </ul>
          <p>
            <strong>Non committare</strong> token. Imposta{" "}
            <code>GITHUB_REPO</code> sul <em>tuo</em> fork se usi Partecipa o il
            bot DAE.
          </p>
        </Section>

        <Section title="Moduli opzionali" id="moduli">
          <p>
            Porto, balneazione, GTFS regionale, bot DAE, RAG, eventi comunali
            sono <strong>extra</strong>: nel fork puoi lasciarli, spegnerli o
            sostituirli.
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
          <p className="flex flex-wrap gap-3">
            <DocLink href={GITHUB_DAE_DOCS_URL}>docs/dae-telegram-bot.md</DocLink>
            <DocLink href={GITHUB_MODAL_RAG_URL}>modal_rag/README.md</DocLink>
          </p>
          <p>
            Un MVP utile è spesso «KPI nazionali + mappa + 1–2 fonti locali», non
            la parità totale con {COMUNE_NOME}.
          </p>
        </Section>

        <Section title="Cursor, Claude e MCP" id="mcp">
          <p>
            <strong>Sì, si può costruire un MCP</strong> per Cursor o Claude: non
            serve per i cittadini sul sito, ma è utile agli sviluppatori del
            fork.
          </p>
          <ul className="list-disc space-y-2 pl-5">
            <li>
              <strong>Oggi:</strong> l’app è già <em>client</em> del MCP AgID (
              <code>src/lib/mcp.ts</code>). In Cursor/Claude puoi anche aggiungere
              direttamente l’URL{" "}
              <code>https://cruscotto-italia-mcp.agid.workers.dev/mcp</code>{" "}
              come server MCP e chiamare <code>comune_kpi</code> /{" "}
              <code>comune_dashboard</code> col tuo ISTAT.
            </li>
            <li>
              <strong>MCP del tuo cruscotto (consigliato per agent):</strong>{" "}
              piccolo server che espone tool read-only sulle tue{" "}
              <code>/api/*</code> (<code>get_kpi</code>, <code>get_meteo</code>,{" "}
              <code>get_dae</code>, …) così l’IDE usa gli stessi dati arricchiti
              del deploy.
            </li>
            <li>
              <strong>Hybrid:</strong> AgID per i KPI nazionali + route locali
              (DAE, GTFS, ARPAT…). Non esporre in MCP le operazioni che usano
              token Telegram/GitHub in scrittura senza autenticazione.
            </li>
          </ul>
          <p>
            Per adattare il fork con Cursor: apri la cartella del repo, leggi{" "}
            <code>AGENTS.md</code>, chiedi all’agent di aggiornare constants e
            asset. Brief utile anche in Claude Projects / Cursor Rules: ISTAT,
            nome comune, «nessun DB, disclaimer da mantenere».
          </p>
          <p className="text-[var(--pa-muted)]">
            Dettaglio configurazione JSON e livelli A/B/C: sezione 12 di{" "}
            <a
              className="underline"
              href={GITHUB_DOCS_RIUSO_URL}
              target="_blank"
              rel="noopener noreferrer"
            >
              docs/riuso-fork.md
            </a>
            .
          </p>
        </Section>

        <Section title="Checklist e cosa non fare" id="limiti">
          <ul className="list-disc space-y-2 pl-5">
            <li>
              Smoke <code>/api/kpi</code> con demografia del tuo ISTAT prima di
              annunciare il sito.
            </li>
            <li>
              Un deploy resta dedicato a un ISTAT: niente selettore multi-comune
              out-of-the-box.
            </li>
            <li>
              Non rimuovere disclaimer e{" "}
              <Link href="/#attribuzioni" className="underline">
                attribuzioni
              </Link>
              .
            </li>
            <li>
              Non lasciare <code>ASSISTENTE_MODAL_URL</code> /{" "}
              <code>GITHUB_REPO</code> puntati a San Vincenzo se non è
              intenzionale.
            </li>
            <li>
              Non committare <code>TELEGRAM_*</code>, <code>GITHUB_TOKEN</code>,
              chiavi meteo.
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
    </section>
  );
}
