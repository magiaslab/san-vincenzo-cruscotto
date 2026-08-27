"use client";

import type { ReactNode } from "react";
import {
  Accessibility,
  BookOpen,
  Bot,
  CloudSun,
  FileCode2,
  FileJson,
  type LucideIcon,
  Server,
  Sparkles,
} from "lucide-react";
import {
  GitHubMark,
  TelegramMark,
  VercelMark,
} from "@/components/BrandMarks";
import {
  COMUNE_NOME,
  CRUSCOTTO_ITALIA_URL,
  ISTAT_CODE,
} from "@/lib/constants";
import { COMUNE } from "@/lib/comune-config";
import {
  PROJECT_ORIGIN,
  PROJECT_ORIGIN_CONFIG_EXAMPLE_URL,
  PROJECT_ORIGIN_DOCS_RIUSO_URL,
  PROJECT_ORIGIN_ENV_EXAMPLE_URL,
  PROJECT_ORIGIN_FORK_URL,
} from "@/lib/project-origin";
import { SectionIntro } from "@/components/ui";

const GITHUB_FORK_URL = PROJECT_ORIGIN_FORK_URL;
const GITHUB_DOCS_RIUSO_URL = PROJECT_ORIGIN_DOCS_RIUSO_URL;
const GITHUB_CONFIG_EXAMPLE_URL = PROJECT_ORIGIN_CONFIG_EXAMPLE_URL;
const GITHUB_ENV_EXAMPLE_URL = PROJECT_ORIGIN_ENV_EXAMPLE_URL;
const GITHUB_MODAL_RAG_URL = `${PROJECT_ORIGIN.github_repo_url}/blob/master/modal_rag/README.md`;
const GITHUB_DAE_DOCS_URL = `${PROJECT_ORIGIN.github_repo_url}/blob/master/docs/dae-telegram-bot.md`;
const GITHUB_REPO_URL = PROJECT_ORIGIN.github_repo_url;
const VERCEL_DEPLOY_URL = PROJECT_ORIGIN.vercel_deploy_url;
const AUTHOR = PROJECT_ORIGIN.author;

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
  icon,
  children,
}: {
  href: string;
  icon?: ReactNode;
  children: ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-[var(--pa-border)] bg-white px-3 py-2 text-sm font-semibold text-[var(--pa-ink)] no-underline transition hover:border-[var(--pa-primary)] hover:text-[var(--pa-primary)]"
    >
      {icon}
      <span>{children}</span>
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
  { id: "cursor-claude", label: "Cursor e Claude" },
  { id: "limiti", label: "Checklist e limiti" },
];

const CORE_FIELDS: { campo: string; esempio: string; dove: string }[] = [
  {
    campo: "istat_code",
    esempio: ISTAT_CODE,
    dove: "config/comune.json → MCP Cruscotto Italia (qualsiasi comune IT)",
  },
  {
    campo: "nome / provincia / regione",
    esempio: `${COMUNE.nome} / ${COMUNE.provincia} / ${COMUNE.regione}`,
    dove: "config/comune.json → header, SEO, footer",
  },
  {
    campo: "geo.map_center · geo.meteo",
    esempio: `${COMUNE.geo.map_center.join(", ")}`,
    dove: "mappe Leaflet, meteo, radar, Wheelmap, OpenAEDMap",
  },
  {
    campo: "geo.bbox / bbox_radius_km",
    esempio: COMUNE.geo.bbox
      ? COMUNE.geo.bbox.join(", ")
      : `raggio ${COMUNE.geo.bbox_radius_km} km`,
    dove: "filtro DAE, TPL Overpass, bot Telegram",
  },
  {
    campo: "geo.terrain_sea_side",
    esempio: COMUNE.geo.terrain_sea_side,
    dove: "rilievo 3D (west/east/south/north/none)",
  },
  {
    campo: "miur_codice_catastale",
    esempio: COMUNE.miur_codice_catastale || "es. I390",
    dove: "scuole MIUR",
  },
  {
    campo: "farmacie_di_turno_cod",
    esempio: COMUNE.farmacie_di_turno_cod || "ISTAT senza lo 0",
    dove: "farmacie di turno",
  },
  {
    campo: "features.*",
    esempio: "porto, balneazione, erosione_costiera, treni, … = false",
    dove: "spegne tab/API non pertinenti al tuo comune",
  },
  {
    campo: "gestori.acqua / gestori.rifiuti",
    esempio: "ASA WFS · SEI pagina comunale",
    dove: "Ambiente: etichette idriche e RD% del gestore (oltre a ISPRA)",
  },
  {
    campo: "fork.maintainer_*",
    esempio: "nome/email di chi cura il fork",
    dove: "Attribuzioni e footer; i crediti originali restano fissi",
  },
  {
    campo: "sostieni.buymeacoffee_slug",
    esempio: COMUNE.sostieni.buymeacoffee_slug || "(vuoto = pagina nascosta)",
    dove: "pagina /sostieni + tab; ringraziamenti in config/sostegni.json",
  },
];

type AccountIcon =
  | { kind: "brand"; Brand: typeof GitHubMark }
  | { kind: "lucide"; Icon: LucideIcon };

const ACCOUNTS: {
  servizio: string;
  aCosa: string;
  obbligatorio: string;
  dove: string;
  href?: string;
  icon: AccountIcon;
}[] = [
  {
    servizio: "GitHub",
    aCosa: "Codice, fork, Issues, commit GeoJSON DAE",
    obbligatorio: "Sì (fork/deploy)",
    dove: "github.com/signup",
    href: "https://github.com/signup",
    icon: { kind: "brand", Brand: GitHubMark },
  },
  {
    servizio: "Vercel",
    aCosa: "Hosting Next.js (regione fra1)",
    obbligatorio: "Sì (online)",
    dove: "vercel.com — login con GitHub",
    href: "https://vercel.com/signup",
    icon: { kind: "brand", Brand: VercelMark },
  },
  {
    servizio: "AgID Cruscotto Italia MCP",
    aCosa: "KPI comunali",
    obbligatorio: "No account (pubblico)",
    dove: "cruscotto-italia-mcp.agid.workers.dev/mcp",
    href: "https://cruscotto-italia-mcp.agid.workers.dev/mcp",
    icon: { kind: "lucide", Icon: Server },
  },
  {
    servizio: "OpenWeather",
    aCosa: "Meteo current / forecast / AQI",
    obbligatorio: "Opzionale",
    dove: "home.openweathermap.org/api_keys",
    href: "https://home.openweathermap.org/api_keys",
    icon: { kind: "lucide", Icon: CloudSun },
  },
  {
    servizio: "Telegram + BotFather",
    aCosa: "Bot segnalazione DAE",
    obbligatorio: "Opzionale",
    dove: "t.me/BotFather",
    href: "https://t.me/BotFather",
    icon: { kind: "brand", Brand: TelegramMark },
  },
  {
    servizio: "Modal",
    aCosa: "Hosting RAG (modelli Hugging Face)",
    obbligatorio: "Opzionale (assistente)",
    dove: "modal.com → modal setup",
    href: "https://modal.com",
    icon: { kind: "lucide", Icon: Sparkles },
  },
  {
    servizio: "Hugging Face",
    aCosa: "Download pesi modelli pubblici",
    obbligatorio: "Di solito no token",
    dove: "huggingface.co",
    href: "https://huggingface.co",
    icon: { kind: "lucide", Icon: Bot },
  },
  {
    servizio: "Wheelmap / Sozialhelden",
    aCosa: "Embed iframe accessibilità",
    obbligatorio: "Opzionale",
    dove: "info@sozialhelden.de",
    href: "https://news.wheelmap.org/wheelmap-widget/",
    icon: { kind: "lucide", Icon: Accessibility },
  },
  {
    servizio: "Cursor / Claude",
    aCosa: "IDE o chat AI per adattare il fork (opzionale)",
    obbligatorio: "No",
    dove: "cursor.com · claude.ai",
    href: "https://cursor.com",
    icon: { kind: "lucide", Icon: Sparkles },
  },
];

function AccountIconMark({ icon }: { icon: AccountIcon }) {
  if (icon.kind === "brand") {
    const Brand = icon.Brand;
    return <Brand size={18} className="shrink-0" />;
  }
  const Icon = icon.Icon;
  return <Icon size={18} strokeWidth={2} className="shrink-0" aria-hidden />;
}

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
    area: "Percorsi ciclo / pedonali",
    cerca:
      "OSM automatico sul bbox (features.ciclabili_pedonali). URL GeoJSON comunale opzionali. GPX dalla lista in Mobilità",
  },
  {
    area: "OMI / DAE",
    cerca:
      "npm run omi:update e npm run dae:sync dopo aver impostato ISTAT e geo.bbox",
  },
  {
    area: "Allerte / ARPAT / turismo / eventi",
    cerca: "URL regionali in constants — spesso da sostituire fuori Toscana",
  },
  {
    area: "Rifiuti ISPRA / gestore",
    cerca:
      "features.rifiuti_ispra (default true, CSV nazionale). gestori.rifiuti.url = pagina comunale SEI o analogo per RD% HTML",
  },
  {
    area: "Acqua / SII",
    cerca:
      "features.acqua_sii + gestori.acqua.geoserver_wfs (ASA WFS). Fuori ATO 5: spegni il flag e lascia i link al tuo gestore",
  },
  {
    area: "Sostieni / Buy Me a Coffee",
    cerca:
      "sostieni.buymeacoffee_slug in comune.json (vuoto = pagina nascosta). Ringraziamenti in config/sostegni.json",
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
        description={`Guida per adattare questo stack a qualsiasi comune italiano: GitHub → config/comune.json → Vercel. I link di fork e la documentazione puntano sempre al progetto originale di ${AUTHOR.name} (Cruscotto ${PROJECT_ORIGIN.comune_demo}).`}
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
              (opzionale) moduli locali
            </strong>
            . Non serve un MCP proprio: i KPI usano già il MCP pubblico AgID.
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
              <DocLink href={GITHUB_FORK_URL} icon={<GitHubMark />}>
                Fork su GitHub
              </DocLink>
            </li>
            <li>
              <DocLink
                href={GITHUB_DOCS_RIUSO_URL}
                icon={<BookOpen size={20} strokeWidth={2} aria-hidden />}
              >
                Guida completa (docs/riuso-fork.md)
              </DocLink>
            </li>
            <li>
              <DocLink
                href={GITHUB_CONFIG_EXAMPLE_URL}
                icon={<FileJson size={20} strokeWidth={2} aria-hidden />}
              >
                config/comune.example.json
              </DocLink>
            </li>
            <li>
              <DocLink
                href={GITHUB_ENV_EXAMPLE_URL}
                icon={<FileCode2 size={20} strokeWidth={2} aria-hidden />}
              >
                .env.example
              </DocLink>
            </li>
            <li>
              <DocLink href={VERCEL_DEPLOY_URL} icon={<VercelMark />}>
                Deploy su Vercel
              </DocLink>
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
            GitHub per feedback/segnalazioni, adattamento moduli regionali.
          </p>
          <p className="text-[var(--pa-muted)]">
            Architettura dello stack:{" "}
            <a href="/come-funziona" className="underline">
              Come funziona
            </a>
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
                      <span className="inline-flex items-start gap-2">
                        <span className="mt-0.5 text-[var(--pa-ink)]">
                          <AccountIconMark icon={row.icon} />
                        </span>
                        <span>
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
                        </span>
                      </span>
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
              <code>config/comune.json</code> (tabella sotto). Checklist:{" "}
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
              redeploy. Imposta anche <code>brand.site_url</code> nel JSON.
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
            Aggiorna anche <code>geo.terrain_sea_side</code>,{" "}
            <code>features.erosione_costiera</code>, bbox DAE, stemma/OG in{" "}
            <code>public/</code>. Poi: <code>npm run dae:sync</code>,{" "}
            <code>npm run omi:update</code>, <code>npm run trasporti:gtfs</code>.
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
            <DocLink href={GITHUB_DAE_DOCS_URL} icon={<TelegramMark />}>
              docs/dae-telegram-bot.md
            </DocLink>
            <DocLink
              href={GITHUB_MODAL_RAG_URL}
              icon={<Sparkles size={20} strokeWidth={2} aria-hidden />}
            >
              modal_rag/README.md
            </DocLink>
          </p>
          <p>
            Un MVP utile è spesso «KPI nazionali + mappa + 1–2 fonti locali», non
            la parità totale con {COMUNE_NOME}.
          </p>
        </Section>

        <Section title="Usare Cursor o Claude" id="cursor-claude">
          <p>
            Cursor e Claude aiutano a personalizzare il fork (constants, stemma,
            moduli locali).{" "}
            <strong>Non serve costruire un MCP proprio</strong>: i KPI usano già
            il MCP pubblico AgID.
          </p>
          <ul className="list-disc space-y-2 pl-5">
            <li>
              <strong>Cursor:</strong> apri la cartella del fork →{" "}
              <code>npm install && npm run dev</code> → in Agent chiedi ad es.
              «Aggiorna <code>config/comune.json</code> per il comune X, ISTAT Y,
              coordinate Z» o «adatta/rimuovi porto e ARPAT». Vedi{" "}
              <code>AGENTS.md</code>.
            </li>
            <li>
              <strong>Claude:</strong> Claude Code sul repo, oppure Project con
              brief fisso: ISTAT, nome comune, «nessun DB, disclaimer da
              mantenere, checklist in <code>docs/riuso-fork.md</code>».
            </li>
            <li>
              <strong>Opzionale:</strong> in Cursor/Claude puoi anche collegare
              l’MCP AgID (
              <code>https://cruscotto-italia-mcp.agid.workers.dev/mcp</code>)
              per interrogare i KPI dall’IDE — non è necessario per il sito
              online.
            </li>
          </ul>
          <p className="text-[var(--pa-muted)]">
            Dettaglio e prompt di esempio: sezione 12 di{" "}
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
              <a href="/attribuzioni" className="underline">
                attribuzioni
              </a>
              . Nei fork lascia intatto{" "}
              <code>src/lib/project-origin.ts</code> e indica te stesso in{" "}
              <code>config/comune.json → fork</code>.
            </li>
            <li>
              Non lasciare <code>ASSISTENTE_MODAL_URL</code> /{" "}
              <code>GITHUB_REPO</code> puntati al comune originale se non è
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
            <a href="/partecipa" className="underline">
              Partecipa
            </a>
            .
          </p>
        </Section>
      </div>
    </section>
  );
}
