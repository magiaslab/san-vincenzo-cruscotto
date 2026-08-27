import { LandingDoc } from "@/components/landing/LandingDoc";
import { PROJECT_ORIGIN } from "@/lib/project-origin";
import {
  getDemoLabel,
  getDemoUrl,
  getProductName,
  getTemplateGithubUrl,
} from "@/lib/product";

const SNIPPET_FOOTER = `Basato su ${getProductName()}, progetto di ${PROJECT_ORIGIN.author.name}, nato dal ${getDemoLabel()}.`;

const SNIPPET_README = `Questo sito è un fork di [${getProductName()}](${getTemplateGithubUrl()}), template open source di ${PROJECT_ORIGIN.author.name}.
Primo esemplare in produzione: [${getDemoLabel()}](${getDemoUrl()}).
Progetto indipendente, non ufficiale: non affiliato al Comune, ad AgID o al Governo italiano.`;

export function MenzioniContent() {
  return (
    <LandingDoc
      kicker="Menzioni"
      title="Come citare il progetto nei fork"
      lede="Il riuso è il punto. Le menzioni non sono burocrazia: dicono da dove viene il lavoro e che il sito non è l’ente."
    >
      <section>
        <h2 className="text-xl font-bold">Cosa non toccare</h2>
        <ul>
          <li>
            <code>src/lib/project-origin.ts</code> — crediti di{" "}
            {PROJECT_ORIGIN.author.name} e del primo esemplare (
            {PROJECT_ORIGIN.comune_demo}).
          </li>
          <li>
            Il disclaimer «progetto indipendente / non ufficiale» in header e
            footer.
          </li>
          <li>
            La pagina Attribuzioni (o questa guida): fonti AgID, OSM, OMI, MIUR,
            ecc.
          </li>
        </ul>
      </section>
      <section>
        <h2 className="text-xl font-bold">Cosa compilare tu</h2>
        <ul>
          <li>
            <code>config/comune.json</code> → <code>fork.maintainer_*</code> e{" "}
            <code>fork.github_repo_url</code>
          </li>
          <li>
            <code>fork.is_template: false</code>,{" "}
            <code>site.mode: &quot;dashboard&quot;</code>
          </li>
          <li>
            Il tuo slug Buy Me a Coffee, o lascialo vuoto. Non copiare quello
            dell’autore del template.
          </li>
          <li>Stemma, dominio, User-Agent HTTP.</li>
        </ul>
      </section>
      <section>
        <h2 className="text-xl font-bold">Testo per il README del fork</h2>
        <pre className="overflow-x-auto rounded-lg bg-[var(--pa-surface-soft)] p-4 text-xs leading-relaxed">
          {SNIPPET_README}
        </pre>
      </section>
      <section>
        <h2 className="text-xl font-bold">Testo breve per il footer</h2>
        <pre className="overflow-x-auto rounded-lg bg-[var(--pa-surface-soft)] p-4 text-xs leading-relaxed">
          {SNIPPET_FOOTER}
        </pre>
        <p>
          Il footer del codice lo genera già: se lasci{" "}
          <code>project-origin.ts</code> intatto e compili <code>fork.*</code>,
          compariranno sia l’autore originale sia il maintainer del fork.
        </p>
      </section>
      <section>
        <h2 className="text-xl font-bold">Comunicati, slide, social</h2>
        <p>Formula minima, adattabile:</p>
        <blockquote className="border-l-4 border-[var(--pa-primary)] pl-4 italic text-[var(--pa-muted)]">
          Dashboard indipendente dei dati aperti del Comune di …, realizzata
          riusando {getProductName()} di {PROJECT_ORIGIN.author.name}. Non è un
          canale ufficiale dell’ente.
        </blockquote>
      </section>
      <section>
        <h2 className="text-xl font-bold">Licenze dei dati</h2>
        <p>
          Ogni fonte ha la propria licenza (spesso CC BY 4.0 o ODbL). In
          interfaccia va citata la fonte accanto al dato. Lo stemma comunale, se
          lo usi, ha quasi sempre vincoli propri (spesso non commerciale / niente
          opere derivate): mettili in <code>brand.stemma_attribution</code>.
        </p>
      </section>
      <section>
        <h2 className="text-xl font-bold">Supporto all’autore</h2>
        <p>
          Un fork che funziona è già un successo. Se vuoi contribuire anche in
          altro modo: pagina <a href="/sostieni">Sostieni</a>, oppure una mail a{" "}
          <a href={`mailto:${PROJECT_ORIGIN.author.email}`}>
            {PROJECT_ORIGIN.author.email}
          </a>
          .
        </p>
      </section>
    </LandingDoc>
  );
}
