"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { Server, Sparkles } from "lucide-react";
import {
  GitHubMark,
  TelegramMark,
  VercelMark,
} from "@/components/BrandMarks";
import { COMUNE_NOME } from "@/lib/constants";
import {
  PROJECT_ORIGIN,
  PROJECT_ORIGIN_CONFIG_EXAMPLE_URL,
  PROJECT_ORIGIN_DOCS_RIUSO_URL,
  PROJECT_ORIGIN_ENV_EXAMPLE_URL,
  PROJECT_ORIGIN_FORK_URL,
} from "@/lib/project-origin";
import { SectionIntro } from "@/components/ui";

const AUTHOR = PROJECT_ORIGIN.author;
const GITHUB_FORK_URL = PROJECT_ORIGIN_FORK_URL;
const GITHUB_DOCS_URL = PROJECT_ORIGIN_DOCS_RIUSO_URL;
const GITHUB_CONFIG_URL = PROJECT_ORIGIN_CONFIG_EXAMPLE_URL;
const GITHUB_ENV_URL = PROJECT_ORIGIN_ENV_EXAMPLE_URL;
const GITHUB_REPO_URL = PROJECT_ORIGIN.github_repo_url;
const VERCEL_DEPLOY_URL = PROJECT_ORIGIN.vercel_deploy_url;

function Step({
  n,
  title,
  children,
}: {
  n: number;
  title: string;
  children: ReactNode;
}) {
  return (
    <li>
      <span className="step-num" aria-hidden>
        {n}
      </span>
      <div className="min-w-0">
        <p className="m-0 font-bold text-[var(--pa-ink)]">{title}</p>
        <div className="mt-1 space-y-2 text-sm leading-relaxed text-[var(--pa-muted)] sm:text-base">
          {children}
        </div>
      </div>
    </li>
  );
}

function AccountCard({
  name,
  href,
  need,
  forWhat,
  icon,
}: {
  name: string;
  href: string;
  need: string;
  forWhat: string;
  icon: ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="guide-card flex gap-3 no-underline"
    >
      <span className="mt-0.5 text-[var(--pa-ink)]">{icon}</span>
      <span>
        <span className="block font-bold text-[var(--pa-ink)]">{name}</span>
        <span className="mt-0.5 block text-xs font-semibold uppercase tracking-wide text-[var(--pa-primary)]">
          {need}
        </span>
        <span className="mt-1 block text-sm text-[var(--pa-muted)]">
          {forWhat}
        </span>
      </span>
    </a>
  );
}

const OPTIONAL: { area: string; text: string }[] = [
  {
    area: "Meteo OpenWeather",
    text: "Registrati, copia la chiave API e incollala su Vercel. Senza chiave restano comunque le previsioni Open-Meteo.",
  },
  {
    area: "Bot Telegram per i defibrillatori",
    text: "Si crea con BotFather. Serve solo se vuoi che i cittadini segnalino nuovi DAE. Dettagli in docs/dae-telegram-bot.md.",
  },
  {
    area: "Assistente in chat",
    text: "Richiede un account Modal. Non copiare l’indirizzo di San Vincenzo: va un assistente addestrato sul tuo comune.",
  },
  {
    area: "Moduli da spegnere",
    text: "Nel file del comune, metti a false ciò che non hai: porto, balneazione, treni, bot Telegram. Un comune interno non deve mostrare il porto.",
  },
];

export function RiusaPanel({ asPage = false }: { asPage?: boolean }) {
  return (
    <section className="guide-prose">
      <SectionIntro
        asPage={asPage}
        title="Porta il cruscotto nel tuo comune"
        description="Non serve essere programmatori. Con un account GitHub, uno su Vercel e circa un’ora puoi avere un sito con i dati aperti del tuo comune."
      />

      <p>
        Questo cruscotto è fatto per essere copiato. Ogni comune ha il suo sito:
        non c’è un selettore con tutti i comuni d’Italia. I numeri arrivano da{" "}
        <a
          href="https://cruscotto-italia.dati.gov.it/"
          target="_blank"
          rel="noopener noreferrer"
        >
          Cruscotto Italia (AgID)
        </a>
        , che è pubblico: non paghi e non chiedi un permesso.
      </p>
      <p>
        Esempi già online: la pagina{" "}
        <Link href="/esempi">Cruscotti online</Link>. La versione estesa di
        questa guida sta anche su{" "}
        <a href={GITHUB_DOCS_URL} target="_blank" rel="noopener noreferrer">
          GitHub
        </a>
        .
      </p>

      <div className="not-prose mb-6 flex flex-wrap gap-2">
        <a
          href={GITHUB_FORK_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-[var(--pa-border)] bg-white px-3 py-2 text-sm font-semibold text-[var(--pa-ink)] no-underline hover:border-[var(--pa-primary)]"
        >
          <GitHubMark />
          Duplica su GitHub
        </a>
        <a
          href={VERCEL_DEPLOY_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-[var(--pa-primary)] px-3 py-2 text-sm font-semibold no-underline hover:bg-[var(--pa-primary-hover)]"
          style={{ color: "#ffffff" }}
        >
          <VercelMark />
          Pubblica su Vercel
        </a>
      </div>

      <h2 className="guide-h2">Cosa ti serve</h2>
      <ul className="mb-4 list-disc space-y-1 pl-5">
        <li>Un computer e una connessione internet.</li>
        <li>Un indirizzo e-mail (quello che usi già va bene).</li>
        <li>Il nome del comune e, se lo hai, il codice ISTAT a 6 cifre.</li>
        <li>Circa un’ora, senza fretta. Il piano gratuito basta.</li>
      </ul>
      <p>
        Non ti servono carta di credito, server propri né un ufficio informatico.
        Se a un certo punto ti blocchi, scrivi a{" "}
        <a href={`mailto:${AUTHOR.email}`}>{AUTHOR.email}</a> oppure usa{" "}
        <Link href="/partecipa">Partecipa</Link>.
      </p>

      <h2 className="guide-h2">Account da aprire (tutti gratis)</h2>
      <p>
        Per andare online ne bastano due. Gli altri arrivano dopo, se ti servono
        meteo extra, un bot o l’assistente.
      </p>
      <div className="not-prose account-grid mb-4">
        <AccountCard
          name="GitHub"
          href="https://github.com/signup"
          need="Obbligatorio"
          forWhat="Qui vive il codice. Lo usi anche per duplicare il progetto e, se vuoi, per i suggerimenti dei cittadini."
          icon={<GitHubMark size={22} />}
        />
        <AccountCard
          name="Vercel"
          href="https://vercel.com/signup"
          need="Obbligatorio"
          forWhat="Mette il sito in rete. Entra con lo stesso account GitHub: è il modo più semplice."
          icon={<VercelMark size={22} />}
        />
        <AccountCard
          name="AgID Cruscotto Italia"
          href="https://cruscotto-italia.dati.gov.it/"
          need="Nessun account"
          forWhat="I dati demografici, economici e di finanza del comune. L’indirizzo è pubblico."
          icon={<Server size={22} aria-hidden />}
        />
        <AccountCard
          name="OpenWeather"
          href="https://home.openweathermap.org/api_keys"
          need="Facoltativo"
          forWhat="Meteo più ricco (qualità dell’aria, previsioni). Senza chiave il meteo di base resta."
          icon={<Sparkles size={22} aria-hidden />}
        />
        <AccountCard
          name="Telegram"
          href="https://t.me/BotFather"
          need="Facoltativo"
          forWhat="Solo se vuoi un bot per segnalare i defibrillatori. Si parla con @BotFather."
          icon={<TelegramMark size={22} />}
        />
        <AccountCard
          name="Cursor o Claude"
          href="https://cursor.com"
          need="Facoltativo"
          forWhat="Un assistente che modifica i file al posto tuo, se non hai voglia di toccare il codice."
          icon={<Sparkles size={22} aria-hidden />}
        />
      </div>

      <h2 className="guide-h2">Dal browser, senza installare nulla</h2>
      <p>
        Questo è il percorso pensato per chi non programma. Tutto si fa nel
        browser.
      </p>
      <ol className="not-prose step-list mb-6">
        <Step n={1} title="Apri un account GitHub">
          <p className="m-0">
            Vai su{" "}
            <a
              href="https://github.com/signup"
              target="_blank"
              rel="noopener noreferrer"
            >
              github.com/signup
            </a>
            , scegli un nome utente e conferma l’e-mail. In Impostazioni attiva
            la verifica in due passaggi: è una spunta, non un esame.
          </p>
        </Step>
        <Step n={2} title="Duplica il progetto (il pulsante Fork)">
          <p className="m-0">
            Apri{" "}
            <a href={GITHUB_REPO_URL} target="_blank" rel="noopener noreferrer">
              il repository originale
            </a>{" "}
            e premi <strong>Fork</strong>, in alto a destra. Lascia i valori
            proposti e conferma. Adesso hai una copia tua, nel tuo account.
          </p>
        </Step>
        <Step n={3} title="Collega Vercel e pubblica">
          <p className="m-0">
            Entra su{" "}
            <a
              href="https://vercel.com/signup"
              target="_blank"
              rel="noopener noreferrer"
            >
              vercel.com
            </a>{" "}
            con GitHub. Poi <strong>Add New → Project</strong>, scegli la copia
            che hai appena creato e premi <strong>Deploy</strong>. Non
            compilare variabili: per partire non servono. Dopo qualche minuto
            hai un indirizzo del tipo{" "}
            <code>qualcosa.vercel.app</code>.
          </p>
        </Step>
        <Step n={4} title="Scrivi il nome del tuo comune">
          <p className="m-0">
            Sempre su GitHub, nella tua copia, apri il file{" "}
            <code>config/comune.json</code>. Premi la matita in alto a destra.
            Cambia almeno:
          </p>
          <ul className="mb-0 mt-2 list-disc pl-5">
            <li>
              <code>nome</code> — il comune, es. «Campiglia Marittima»
            </li>
            <li>
              <code>istat_code</code> — 6 cifre (lo trovi su Wikipedia o su{" "}
              <a
                href="https://cruscotto-italia.dati.gov.it/"
                target="_blank"
                rel="noopener noreferrer"
              >
                Cruscotto Italia
              </a>
              )
            </li>
            <li>
              <code>provincia</code> e <code>regione</code>
            </li>
            <li>
              <code>geo.map_center</code> — latitudine e longitudine del centro
              abitato (le trovi su OpenStreetMap: tasto destro → «Mostra
              indirizzo»)
            </li>
            <li>
              <code>fork.is_upstream</code> → <code>false</code>, e i tuoi nome
              e e-mail in <code>fork.maintainer_*</code>
            </li>
          </ul>
          <p className="mb-0 mt-2">
            Scorri fino a <code>features</code> e spegni ciò che non c’è da te
            (un comune di montagna mette <code>porto</code> e{" "}
            <code>balneazione</code> a <code>false</code>). Poi{" "}
            <strong>Commit changes</strong>. Vercel rifà il sito da solo.
          </p>
        </Step>
        <Step n={5} title="Controlla che i numeri siano i tuoi">
          <p className="m-0">
            Apri <code>https://TUO-SITO.vercel.app/api/kpi</code>. Deve
            comparire il nome del tuo comune, non «{COMUNE_NOME}». Se vedi
            ancora {COMUNE_NOME}, il codice ISTAT non è partito: aspetta il
            nuovo deploy oppure ricontrolla il file.
          </p>
        </Step>
        <Step n={6} title="(Facoltativo) Il tuo dominio">
          <p className="m-0">
            Su Vercel: Project → Settings → Domains. Aggiungi{" "}
            <code>www.tuodominio.it</code> e segui le istruzioni DNS. Poi
            imposta <code>NEXT_PUBLIC_SITE_URL</code> e, nel JSON,{" "}
            <code>brand.site_url</code>. Senza dominio resta l’indirizzo
            Vercel, ed è già un sito vero.
          </p>
        </Step>
      </ol>

      <aside className="guide-callout">
        <p className="m-0 font-bold">Un file da non toccare</p>
        <p className="mb-0 mt-2">
          <code>src/lib/project-origin.ts</code> contiene i crediti a{" "}
          {AUTHOR.name}, che ha aperto la strada. Nei fork si lascia com’è: i
          tuoi dati stanno in <code>config/comune.json</code>, sezione{" "}
          <code>fork</code>.
        </p>
      </aside>

      <h2 className="guide-h2">Cosa compilare, in italiano</h2>
      <p>
        Il file{" "}
        <a href={GITHUB_CONFIG_URL} target="_blank" rel="noopener noreferrer">
          config/comune.example.json
        </a>{" "}
        è il modello. Non serve capire React: è un elenco di nomi e valori.
      </p>
      <div className="not-prose overflow-x-auto rounded-lg border border-[var(--pa-border)] bg-white">
        <table className="w-full min-w-[28rem] border-collapse text-left text-sm">
          <caption className="sr-only">
            Campi del file comunale da compilare
          </caption>
          <thead>
            <tr className="border-b border-[var(--pa-border)] bg-[var(--pa-surface-soft)]">
              <th scope="col" className="px-3 py-2.5 font-bold">
                Campo
              </th>
              <th scope="col" className="px-3 py-2.5 font-bold">
                A che serve
              </th>
            </tr>
          </thead>
          <tbody>
            {[
              ["istat_code", "Chiave dei dati AgID. Senza questo, i numeri restano di un altro comune."],
              ["nome, provincia, regione", "Testi in testata, piè di pagina e motori di ricerca."],
              ["geo.map_center e geo.meteo", "Punto da cui partono mappa e previsioni."],
              ["geo.terrain_sea_side", "Lato mare del rilievo 3D. Se non hai il mare, scrivi none."],
              ["miur_codice_catastale", "Scuole. Quattro caratteri, es. I390."],
              ["farmacie_di_turno_cod", "ISTAT senza lo zero iniziale."],
              ["features.*", "Interruttori: false nasconde porto, spiagge, treni, bot…"],
              ["fork.*", "Chi mantiene QUESTO sito. is_upstream: false nei fork."],
              ["sostieni.buymeacoffee_slug", "Pagina Supporto. Vuoto = la pagina sparisce."],
            ].map(([campo, dove]) => (
              <tr key={campo} className="border-b border-[var(--pa-border)] last:border-0">
                <td className="px-3 py-2.5 align-top">
                  <code>{campo}</code>
                </td>
                <td className="px-3 py-2.5 align-top text-[var(--pa-muted)]">
                  {dove}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 className="guide-h2">Se vuoi di più, dopo</h2>
      <ul className="not-prose m-0 list-none space-y-3 p-0">
        {OPTIONAL.map((m) => (
          <li key={m.area} className="guide-card">
            <p className="m-0 font-bold">{m.area}</p>
            <p className="mb-0 mt-1 text-sm text-[var(--pa-muted)]">{m.text}</p>
          </li>
        ))}
      </ul>
      <p className="mt-4">
        Elenco delle chiavi facoltative:{" "}
        <a href={GITHUB_ENV_URL} target="_blank" rel="noopener noreferrer">
          .env.example
        </a>
        . Non incollare mai password o token nei file che finiscono su GitHub.
      </p>

      <h2 className="guide-h2">Se programmi, o hai Cursor</h2>
      <p>
        In locale: Node 20+, <code>npm install && npm run dev</code>, poi
        apri localhost:3000. Dopo aver cambiato ISTAT e coordinate:
      </p>
      <pre>
        {`npm run dae:sync
npm run omi:update
npm run trasporti:gtfs`}
      </pre>
      <p>
        A Cursor o Claude puoi chiedere, in italiano: «Adatta{" "}
        <code>config/comune.json</code> al Comune di …, ISTAT …, coordinate
        …». Tieni aperto <code>AGENTS.md</code>. Non serve costruire un server
        dati: i KPI arrivano già da AgID.
      </p>

      <h2 className="guide-h2">Prima di dire che è pronto</h2>
      <ul className="list-disc space-y-1.5 pl-5">
        <li>
          <code>/api/kpi</code> mostra il tuo comune.
        </li>
        <li>
          Lo stemma e il nome in testata sono i tuoi.
        </li>
        <li>
          Porto, spiagge e bot sono spenti se non ti servono.
        </li>
        <li>
          La frase «progetto non ufficiale» è ancora lì. Va tenuta.
        </li>
        <li>
          Nessuna chiave segreta è finita nel codice.
        </li>
      </ul>
      <p>
        Domande:{" "}
        <a href={`mailto:${AUTHOR.email}`}>{AUTHOR.email}</a>
        {" · "}
        <Link href="/esempi">Cruscotti già nati</Link>
        {" · "}
        <Link href="/sostieni">Supporto</Link>.
      </p>
    </section>
  );
}
