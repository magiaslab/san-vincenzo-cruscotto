"use client";

import Link from "next/link";
import { ExternalLink, MapPin, Sparkles } from "lucide-react";
import {
  CRUSCOTTI_RETE,
  type CruscottoRete,
  type CruscottoStatus,
} from "@/lib/cruscotti-rete";
import { AUTHOR } from "@/lib/constants";
import { SectionIntro } from "@/components/ui";
import { useT } from "@/lib/i18n";

function statusLabel(status: CruscottoStatus, t: (s: string) => string) {
  return status === "online" ? t("Pubblico") : t("In sviluppo");
}

function CruscottoCard({ item }: { item: CruscottoRete }) {
  const t = useT();
  const online = item.status === "online";
  return (
    <article className="guide-card flex flex-col">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <p className="m-0 text-lg font-bold text-[var(--pa-ink)]">
          {item.nome}
        </p>
        <span
          className={`status-pill ${online ? "status-pill-ok" : "status-pill-wip"}`}
        >
          {statusLabel(item.status, t)}
        </span>
      </div>
      <p className="mb-0 mt-1 flex items-center gap-1.5 text-sm text-[var(--pa-muted)]">
        <MapPin size={14} aria-hidden className="shrink-0" />
        {item.regione} · {item.provincia}
        {item.origin ? ` · ${t("Progetto originale")}` : null}
      </p>
      <p className="mb-0 mt-3 text-sm leading-relaxed text-[var(--pa-ink)]">
        {item.tagline}
      </p>
      <p className="mb-0 mt-2 flex-1 text-sm leading-relaxed text-[var(--pa-muted)]">
        {item.note}
      </p>
      <a
        href={item.url}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-4 inline-flex min-h-11 items-center gap-2 text-sm font-semibold no-underline"
      >
        {item.url.replace(/^https:\/\//, "").replace(/\/$/, "")}
        <ExternalLink size={14} aria-hidden />
      </a>
    </article>
  );
}

export function CruscottiRetePanel({ asPage = false }: { asPage?: boolean }) {
  const t = useT();
  const online = CRUSCOTTI_RETE.filter((c) => c.status === "online");
  const wip = CRUSCOTTI_RETE.filter((c) => c.status === "in_sviluppo");

  return (
    <section className="guide-prose">
      <SectionIntro
        asPage={asPage}
        title={t("Cruscotti online")}
        description={t(
          "I comuni che hanno già un cruscotto pubblico, e quelli in lavorazione. Ognuno è un sito a sé, con i dati del proprio territorio.",
        )}
      />

      <p>
        Non esiste un unico portale nazionale: ogni comune ha il suo indirizzo.
        Qui trovi quelli nati da questo progetto, così puoi vedere il risultato
        prima di replicarlo nel tuo.
      </p>

      <h2 className="guide-h2">{t("Già consultabili")}</h2>
      <div className="not-prose grid gap-4 sm:grid-cols-2">
        {online.map((item) => (
          <CruscottoCard key={item.id} item={item} />
        ))}
      </div>

      {wip.length > 0 ? (
        <>
          <h2 className="guide-h2">{t("In lavorazione")}</h2>
          <p>
            Anteprime su Vercel: i dati ci sono già, il sito può ancora
            cambiare nome, dominio o dettagli locali.
          </p>
          <div className="not-prose grid gap-4 sm:grid-cols-2">
            {wip.map((item) => (
              <CruscottoCard key={item.id} item={item} />
            ))}
          </div>
        </>
      ) : null}

      <h2 className="guide-h2">{t("Vuoi il tuo?")}</h2>
      <p>
        La guida passo passo, anche se non programmi, è in{" "}
        <Link href="/riusa">Porta nel tuo comune</Link>. Se preferisci
        una mano diretta, scrivi a{" "}
        <a href={`mailto:${AUTHOR.email}`}>{AUTHOR.email}</a>.
      </p>

      <aside className="guide-callout">
        <p className="m-0 flex items-start gap-2 font-bold text-[var(--pa-ink)]">
          <Sparkles
            size={18}
            className="mt-0.5 shrink-0 text-[var(--pa-primary)]"
            aria-hidden
          />
          {t("Idee per il minisito")}
        </p>
        <ul className="mb-0 mt-2 space-y-1.5 pl-5">
          <li>
            Una mappa d’Italia con i pin dei cruscotti già nati.
          </li>
          <li>
            Una scheda «storia del fork» (chi l’ha fatto, quanto ci ha messo,
            cosa ha spento).
          </li>
          <li>
            Un kit per l’amministrazione: due paragrafi da mettere sul sito
            comunale e un comunicato stampa.
          </li>
          <li>
            Una guida video di dieci minuti (account GitHub → sito online).
          </li>
          <li>
            Una pagina novità, con le funzioni aggiunte di mese in mese.
          </li>
        </ul>
      </aside>
    </section>
  );
}
